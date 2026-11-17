// Handlers for screenshots attached to test plan comments
package v1

import (
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/google/uuid"
)

const (
	commentAttachmentsDir       = "comment-attachments"
	maxCommentAttachmentBytes   = 10 << 20
	maxCommentAttachmentNameLen = 255
)

// allowedCommentAttachmentTypes maps the sniffed content type of an upload to the extension it is stored with
var allowedCommentAttachmentTypes = map[string]string{
	"image/png":  ".png",
	"image/jpeg": ".jpg",
	"image/gif":  ".gif",
	"image/webp": ".webp",
}

func storageRoot(storage config.StorageConfiguration) string {
	if storage.LocalPath == "" {
		return "./storage"
	}
	return storage.LocalPath
}

// UploadTestPlanCommentAttachment godoc
//
// @ID      UploadTestPlanCommentAttachment
// @Summary Upload a screenshot to attach to a test plan comment
// @Description Uploads an image (PNG, JPEG, GIF or WebP, max 10MB). Pass the returned id in attachment_ids when creating the comment.
// @Tags    test-plans, comments
// @Accept  multipart/form-data
// @Produce json
// @Param   testPlanID path int true "Test Plan ID"
// @Param   file formData file true "Image file"
// @Success 200 {object} schema.CommentAttachment
// @Failure 400 {object} problemdetail.ProblemDetail
// @Failure 404 {object} problemdetail.ProblemDetail
// @Failure 500 {object} problemdetail.ProblemDetail
// @Router  /v1/test-plans/{testPlanID}/comments/attachments [post]
func UploadTestPlanCommentAttachment(testPlanService services.TestPlanService, storage config.StorageConfiguration, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		planID, err := c.ParamsInt("testPlanID", 0)
		if err != nil || planID <= 0 {
			return problemdetail.BadRequest(c, "invalid testPlanID")
		}

		if _, err := testPlanService.GetOneTestPlan(c.Context(), int64(planID)); err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(c, "test plan not found")
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to fetch test plan", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to verify test plan existence")
		}

		fileHeader, err := c.FormFile("file")
		if err != nil {
			return problemdetail.BadRequest(c, "file is required")
		}
		if fileHeader.Size > maxCommentAttachmentBytes {
			return problemdetail.BadRequest(c, "file is too large, the maximum size is 10MB")
		}

		file, err := fileHeader.Open()
		if err != nil {
			return problemdetail.BadRequest(c, "failed to read uploaded file")
		}
		defer file.Close()

		// Trust the file contents rather than the client supplied content type or name
		head := make([]byte, 512)
		n, err := io.ReadFull(file, head)
		if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) {
			return problemdetail.BadRequest(c, "failed to read uploaded file")
		}
		contentType := http.DetectContentType(head[:n])
		ext, ok := allowedCommentAttachmentTypes[contentType]
		if !ok {
			return problemdetail.BadRequest(c, "only PNG, JPEG, GIF and WebP images can be attached")
		}

		attachmentID := uuid.New()
		relativePath := filepath.ToSlash(filepath.Join(commentAttachmentsDir, strconv.Itoa(planID), attachmentID.String()+ext))
		absolutePath := filepath.Join(storageRoot(storage), filepath.FromSlash(relativePath))

		if err := os.MkdirAll(filepath.Dir(absolutePath), os.ModePerm); err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to create attachment directory", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to save attachment")
		}
		if err := c.SaveFile(fileHeader, absolutePath); err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to save attachment", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to save attachment")
		}

		attachment, err := testPlanService.CreateCommentAttachment(c.Context(), dbsqlc.CreateCommentAttachmentParams{
			ID:           attachmentID,
			TestPlanID:   int64(planID),
			UploadedByID: authutil.GetAuthUserID(c),
			FileName:     commentAttachmentName(fileHeader.Filename, ext),
			ContentType:  contentType,
			FileSize:     fileHeader.Size,
			StoragePath:  relativePath,
		})
		if err != nil {
			_ = os.Remove(absolutePath)
			logger.Error(loggedmodule.ApiTestPlans, "failed to record attachment", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to save attachment")
		}

		return c.JSON(attachment)
	}
}

// GetTestPlanCommentAttachment godoc
//
// @ID      GetTestPlanCommentAttachment
// @Summary Get the image file of a test plan comment attachment
// @Tags    test-plans, comments
// @Produce image/png,image/jpeg,image/gif,image/webp
// @Param   testPlanID   path int    true "Test Plan ID"
// @Param   attachmentID path string true "Attachment ID"
// @Success 200 {file} string "Image file"
// @Failure 404 {object} problemdetail.ProblemDetail
// @Failure 500 {object} problemdetail.ProblemDetail
// @Router  /v1/test-plans/{testPlanID}/comments/attachments/{attachmentID} [get]
func GetTestPlanCommentAttachment(testPlanService services.TestPlanService, storage config.StorageConfiguration, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		planID, err := c.ParamsInt("testPlanID", 0)
		if err != nil || planID <= 0 {
			return problemdetail.BadRequest(c, "invalid testPlanID")
		}

		attachment, err := testPlanService.GetCommentAttachment(c.Context(), c.Params("attachmentID"))
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(c, "attachment not found")
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to fetch attachment", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch attachment")
		}
		if attachment.TestPlanID != int64(planID) {
			return problemdetail.NotFound(c, "attachment not found")
		}

		absolutePath := filepath.Join(storageRoot(storage), filepath.FromSlash(attachment.StoragePath))
		// Streamed rather than sent with SendFile, whose file handle cache stops the file being deleted on Windows
		file, err := os.Open(absolutePath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return problemdetail.NotFound(c, "attachment file is missing")
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to open attachment", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to read attachment")
		}
		info, err := file.Stat()
		if err != nil {
			file.Close()
			logger.Error(loggedmodule.ApiTestPlans, "failed to read attachment", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to read attachment")
		}

		c.Set(fiber.HeaderContentType, attachment.ContentType)
		c.Set(fiber.HeaderXContentTypeOptions, "nosniff")
		c.Set(fiber.HeaderCacheControl, "private, max-age=86400")
		if disposition := mime.FormatMediaType("inline", map[string]string{"filename": attachment.FileName}); disposition != "" {
			c.Set(fiber.HeaderContentDisposition, disposition)
		}
		// The response closes the file once it has been written
		return c.SendStream(file, int(info.Size()))
	}
}

// commentAttachmentName keeps the base name of the uploaded file for display, falling back to a generic one
func commentAttachmentName(original, ext string) string {
	name := strings.TrimSpace(filepath.Base(strings.ReplaceAll(original, "\\", "/")))
	if name == "" || name == "." || name == "/" {
		name = "screenshot" + ext
	}
	if runes := []rune(name); len(runes) > maxCommentAttachmentNameLen {
		name = string(runes[len(runes)-maxCommentAttachmentNameLen:])
	}
	return name
}

func removeCommentAttachmentFiles(storage config.StorageConfiguration, paths []string, logger logging.Logger) {
	for _, p := range paths {
		if err := os.Remove(filepath.Join(storageRoot(storage), filepath.FromSlash(p))); err != nil && !errors.Is(err, os.ErrNotExist) {
			logger.Error(loggedmodule.ApiTestPlans, "failed to remove attachment file", "path", p, "error", err)
		}
	}
}
