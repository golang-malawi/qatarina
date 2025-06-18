-- +goose Up
CREATE TABLE IF NOT EXISTS pages(
    id SERIAL PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down

