-- +goose Up
-- One emoji reaction per person per comment; reacting again replaces it
CREATE TABLE IF NOT EXISTS test_plan_comment_reactions (
    comment_id UUID NOT NULL REFERENCES test_plan_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- +goose Down
DROP TABLE IF EXISTS test_plan_comment_reactions;
