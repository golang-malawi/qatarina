-- +goose Up
CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    is_sent BOOLEAN DEFAULT false
);

-- +goose Down
DROP TABLE user_notifications;