-- +goose Up
CREATE TABLE test_plan_comments (
    id UUID PRIMARY KEY NOT NULL,
    test_plan_id BIGINT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- +goose Down

