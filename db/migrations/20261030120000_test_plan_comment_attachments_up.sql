-- +goose Up
CREATE TABLE test_plan_comment_attachments (
    id UUID PRIMARY KEY NOT NULL,
    test_plan_id BIGINT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
    -- NULL until the comment the attachment was uploaded for is posted
    comment_id UUID REFERENCES test_plan_comments(id) ON DELETE CASCADE,
    uploaded_by_id BIGINT NOT NULL REFERENCES users(id),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_plan_comment_attachments_comment ON test_plan_comment_attachments(comment_id);
CREATE INDEX idx_test_plan_comment_attachments_test_plan ON test_plan_comment_attachments(test_plan_id);

-- +goose Down
DROP TABLE IF EXISTS test_plan_comment_attachments;
