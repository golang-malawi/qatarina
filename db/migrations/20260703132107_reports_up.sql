-- +goose Up
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g. Summary, Analytics, Detailed
    status VARCHAR(50) NOT NULL, -- Completed, In Progress, Failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT, -- for downloadable reports
    updated_at TIMESTAMP DEFAULT now()
);

-- +goose Down
DROP TABLE reports;
