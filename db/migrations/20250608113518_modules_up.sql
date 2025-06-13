-- +goose Up

CREATE TABLE modules (
    id serial primary key not null,
    project_id integer not null,
    name text not null,
    code text not null,
    priority integer not null,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE

);


-- +goose Down

