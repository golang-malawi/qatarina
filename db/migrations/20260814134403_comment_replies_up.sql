-- +goose Up
ALTER TABLE test_plan_comments 
ADD COLUMN parent_comment_id UUID REFERENCES test_plan_comments(id) ON DELETE CASCADE;

CREATE INDEX idx_test_plan_comments_parent ON test_plan_comments(parent_comment_id);
SELECT 'down SQL query';
-- +goose Down
