package storage

import (
	"bytes"
	"context"
	"errors"
	"io"
	"mime"
	"os"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/spf13/afero"
	"github.com/spf13/afero/mem"
)

// S3Fs is an afero.Fs backed by an S3 bucket. Objects are buffered in memory,
// so it is intended for attachment-sized files rather than large blobs.
// Directories do not exist in S3, so directory operations are no-ops.
type S3Fs struct {
	bucket string
	client *awss3.Client
}

func NewS3Fs(bucket string, client *awss3.Client) afero.Fs {
	return &S3Fs{bucket: bucket, client: client}
}

func (fs *S3Fs) Name() string { return "s3fs" }

func (fs *S3Fs) Create(name string) (afero.File, error) {
	return fs.OpenFile(name, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0o644)
}

func (fs *S3Fs) Mkdir(name string, perm os.FileMode) error {
	return nil
}

func (fs *S3Fs) MkdirAll(path string, perm os.FileMode) error {
	return nil
}

func (fs *S3Fs) Open(name string) (afero.File, error) {
	return fs.OpenFile(name, os.O_RDONLY, 0)
}

func (fs *S3Fs) OpenFile(name string, flag int, perm os.FileMode) (afero.File, error) {
	key := objectKey(name)
	data := mem.CreateFile(key)
	writable := flag&(os.O_WRONLY|os.O_RDWR) != 0

	if flag&os.O_TRUNC == 0 {
		out, err := fs.client.GetObject(context.TODO(), &awss3.GetObjectInput{
			Bucket: &fs.bucket,
			Key:    &key,
		})
		switch {
		case err == nil:
			defer out.Body.Close()
			h := mem.NewFileHandle(data)
			if _, err := io.Copy(h, out.Body); err != nil {
				return nil, &os.PathError{Op: "open", Path: name, Err: err}
			}
			if out.LastModified != nil {
				mem.SetModTime(data, *out.LastModified)
			}
		case isNotFound(err) && flag&os.O_CREATE != 0:
			// new object, starts empty
		case isNotFound(err):
			return nil, &os.PathError{Op: "open", Path: name, Err: os.ErrNotExist}
		default:
			return nil, &os.PathError{Op: "open", Path: name, Err: err}
		}
	}

	if !writable {
		return mem.NewReadOnlyFileHandle(data), nil
	}
	f := &s3File{File: mem.NewFileHandle(data), fs: fs, key: key}
	if flag&os.O_APPEND != 0 {
		if _, err := f.Seek(0, io.SeekEnd); err != nil {
			return nil, err
		}
	}
	return f, nil
}

func (fs *S3Fs) Remove(name string) error {
	key := objectKey(name)
	_, err := fs.client.DeleteObject(context.TODO(), &awss3.DeleteObjectInput{
		Bucket: &fs.bucket,
		Key:    &key,
	})
	return err
}

// RemoveAll deletes every object under the given prefix.
func (fs *S3Fs) RemoveAll(p string) error {
	prefix := objectKey(p)
	if prefix != "" && !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}
	paginator := awss3.NewListObjectsV2Paginator(fs.client, &awss3.ListObjectsV2Input{
		Bucket: &fs.bucket,
		Prefix: &prefix,
	})
	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.TODO())
		if err != nil {
			return err
		}
		for _, obj := range page.Contents {
			if _, err := fs.client.DeleteObject(context.TODO(), &awss3.DeleteObjectInput{
				Bucket: &fs.bucket,
				Key:    obj.Key,
			}); err != nil {
				return err
			}
		}
	}
	return nil
}

func (fs *S3Fs) Rename(oldname, newname string) error {
	src, dst := objectKey(oldname), objectKey(newname)
	source := fs.bucket + "/" + src
	if _, err := fs.client.CopyObject(context.TODO(), &awss3.CopyObjectInput{
		Bucket:     &fs.bucket,
		CopySource: &source,
		Key:        &dst,
	}); err != nil {
		return err
	}
	return fs.Remove(src)
}

func (fs *S3Fs) Stat(name string) (os.FileInfo, error) {
	key := objectKey(name)
	out, err := fs.client.HeadObject(context.TODO(), &awss3.HeadObjectInput{
		Bucket: &fs.bucket,
		Key:    &key,
	})
	if err != nil {
		if isNotFound(err) {
			return nil, &os.PathError{Op: "stat", Path: name, Err: os.ErrNotExist}
		}
		return nil, &os.PathError{Op: "stat", Path: name, Err: err}
	}
	info := s3FileInfo{name: path.Base(key), size: aws.ToInt64(out.ContentLength)}
	if out.LastModified != nil {
		info.modTime = *out.LastModified
	}
	return info, nil
}

func (fs *S3Fs) Chmod(name string, mode os.FileMode) error {
	return nil
}

func (fs *S3Fs) Chown(name string, uid, gid int) error {
	return nil
}

func (fs *S3Fs) Chtimes(name string, atime time.Time, mtime time.Time) error {
	return nil
}

// s3File buffers writes in memory and uploads the object on Sync or Close.
type s3File struct {
	*mem.File
	fs  *S3Fs
	key string
}

func (f *s3File) Sync() error {
	info, err := f.File.Stat()
	if err != nil {
		return err
	}
	buf := make([]byte, info.Size())
	if _, err := f.File.ReadAt(buf, 0); err != nil && !errors.Is(err, io.EOF) {
		return err
	}
	input := &awss3.PutObjectInput{
		Bucket: &f.fs.bucket,
		Key:    &f.key,
		Body:   bytes.NewReader(buf),
	}
	if contentType := mime.TypeByExtension(path.Ext(f.key)); contentType != "" {
		input.ContentType = &contentType
	}
	_, err = f.fs.client.PutObject(context.TODO(), input)
	return err
}

func (f *s3File) Close() error {
	if err := f.Sync(); err != nil {
		_ = f.File.Close()
		return err
	}
	return f.File.Close()
}

type s3FileInfo struct {
	name    string
	size    int64
	modTime time.Time
}

func (i s3FileInfo) Name() string       { return i.name }
func (i s3FileInfo) Size() int64        { return i.size }
func (i s3FileInfo) Mode() os.FileMode  { return 0o644 }
func (i s3FileInfo) ModTime() time.Time { return i.modTime }
func (i s3FileInfo) IsDir() bool        { return false }
func (i s3FileInfo) Sys() any           { return nil }

// objectKey normalises an afero path into an S3 key.
func objectKey(name string) string {
	return strings.TrimPrefix(path.Clean("/"+strings.ReplaceAll(name, "\\", "/")), "/")
}

func isNotFound(err error) bool {
	var noSuchKey *types.NoSuchKey
	var notFound *types.NotFound
	return errors.As(err, &noSuchKey) || errors.As(err, &notFound)
}
