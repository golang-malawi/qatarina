package storage

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	awscfg "github.com/aws/aws-sdk-go-v2/config"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/spf13/afero"
)

const (
	DriverLocal = "local"
	DriverS3    = "s3"
)

// ResolveDriver returns the storage driver that will actually be used.
// S3 is only used when it is selected and a bucket is configured; everything
// else falls back to local storage.
func ResolveDriver(cfg config.StorageConfiguration) string {
	if cfg.Driver == DriverS3 && cfg.S3Bucket != "" {
		return DriverS3
	}
	return DriverLocal
}

// New creates the storage backend for the given configuration.
func New(ctx context.Context, cfg config.StorageConfiguration) (afero.Fs, error) {
	switch cfg.Driver {
	case "", DriverLocal, DriverS3:
	default:
		return nil, fmt.Errorf("unsupported storage driver: %q", cfg.Driver)
	}

	if ResolveDriver(cfg) == DriverS3 {
		return newS3(ctx, cfg)
	}
	return newLocal(cfg.LocalPath)
}

func newLocal(localPath string) (afero.Fs, error) {
	if localPath == "" {
		localPath = config.DefaultConfig.Storage.LocalPath
	}
	absPath, err := filepath.Abs(localPath)
	if err != nil {
		return nil, fmt.Errorf("invalid local storage path %q: %w", localPath, err)
	}
	if err := os.MkdirAll(absPath, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create local storage directory: %w", err)
	}
	return afero.NewBasePathFs(afero.NewOsFs(), absPath), nil
}

func newS3(ctx context.Context, cfg config.StorageConfiguration) (afero.Fs, error) {
	awsCfg, err := awscfg.LoadDefaultConfig(ctx, awscfg.WithRegion(cfg.S3Region))
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	client := awss3.NewFromConfig(awsCfg, func(o *awss3.Options) {
		// Custom endpoints (e.g. MinIO) generally need path-style addressing.
		if cfg.S3Endpoint != "" {
			o.BaseEndpoint = &cfg.S3Endpoint
			o.UsePathStyle = true
		}
	})
	if _, err := client.HeadBucket(ctx, &awss3.HeadBucketInput{Bucket: &cfg.S3Bucket}); err != nil {
		return nil, fmt.Errorf("failed to access S3 bucket %q: %w", cfg.S3Bucket, err)
	}
	return NewS3Fs(cfg.S3Bucket, client), nil
}
