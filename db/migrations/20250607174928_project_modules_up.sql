-- +goose Up
-- +goose StatementBegin
CREATE TABLE project_modules (
    id serial primary key not null,
    project_id integer not null,
    project_name text not null,
    project_code text not null,
    modules integer not null,
    created_at timestamp without time zone,
    updated_at timestamp without time zone

);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
