package s3

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	bucket string
	client *s3.Client
}

func NewClient(bucket string, client *s3.Client) *Client {
	return &Client{
		bucket: bucket,
		client: client,
	}
}

func (c *Client) Upload(ctx context.Context, key string, content io.Reader, contentType string) error {
	_, err := c.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		Body:        content,
		ContentType: aws.String(contentType),
	})

	return err
}

func (c *Client) GetFileURL(key string) string {
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", c.bucket, key)
}
