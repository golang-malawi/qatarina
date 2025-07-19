-- +goose Up
CREATE TABLE uploads(
    id serial primary key not null,
    user_id integer not null,    
    project_id integer not null,
    name text not null,
    created_at timestamp without time zone not null,
    deleted_at timestamp without time zone null
);

COMMENT ON COLUMN uploads.user_id IS 'User who uploaded the document';
COMMENT ON COLUMN uploads.project_id IS 'Project which this document is under';
COMMENT ON COLUMN uploads.name IS 'Name of the uploaded document';
-- +goose Down
DROP TABLE uploads;

