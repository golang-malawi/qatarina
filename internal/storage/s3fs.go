package storage

import (
	"context"
	"os"
	"time"

	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/spf13/afero"
)

type S3Fs struct {
	bucket string
	client *awss3.Client
}

func NewS3Fs(bucket string, client *awss3.Client) afero.Fs {
	return &S3Fs{bucket: bucket, client: client}
}

func (fs *S3Fs) Name() string { return "s3fs" }

func (fs *S3Fs) Create(name string) (afero.File, error) {
	return nil, os.ErrNotExist
}

func (fs *S3Fs) Mkdir(name string, perm os.FileMode) error {
	return nil
}

func (fs *S3Fs) MkdirAll(path string, perm os.FileMode) error {
	return nil
}

func (fs *S3Fs) Open(name string) (afero.File, error) {
	return nil, os.ErrNotExist
}

func (fs *S3Fs) OpenFile(name string, flag int, perm os.FileMode) (afero.File, error) {
	return fs.Open(name)
}

func (fs *S3Fs) Remove(name string) error {
	_, err := fs.client.DeleteObject(context.TODO(), &awss3.DeleteObjectInput{
		Bucket: &fs.bucket,
		Key:    &name,
	})
	return err
}

func (fs *S3Fs) RemoveAll(path string) error {
	return nil
}

func (fs *S3Fs) Rename(oldname, newname string) error {
	return os.ErrNotExist
}

func (fs *S3Fs) Stat(name string) (os.FileInfo, error) {
	return nil, os.ErrNotExist
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
