package test

import (
	"testing"

	"github.com/golang-malawi/qatarina/internal/common"
)

func TestValidateAttachment(t *testing.T) {
	maxSize := int64(10485760) // 10 MB

	tests := []struct {
		name        string
		fileName    string
		contentType string
		size        int64
		wantErr     bool
	}{
		{
			name:        "valid png file with empty contentType",
			fileName:    "test.png",
			contentType: "",
			size:        2048,
			wantErr:     false,
		},
		{
			name:        "invalid file type",
			fileName:    "malware.exe",
			contentType: "application/x-msdownload",
			size:        512,
			wantErr:     true,
		},
		{
			name:        "file size exceeds limit",
			fileName:    "large.pdf",
			contentType: "application/pdf",
			size:        maxSize + 1,
			wantErr:     true,
		},
		{
			name:        "fallback to octet-stream for unknown extension",
			fileName:    "data.unknown",
			contentType: "",
			size:        1024,
			wantErr:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotType, err := common.ValidateAttachment(tt.fileName, tt.contentType, tt.size, maxSize)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAttachment() error = %v, wantErr %v", err, tt.wantErr)

			}
			if err == nil && gotType == "" {
				t.Errorf("ValidateAttachment() gotType = %v, expected a valid content type", gotType)
			}
		})
	}
}
