-- +goose Up

CREATE TABLE modules (
    id serial primary key not null,
    project_id integer not null,
    name text not null,
    code text not null,
    priority integer not null,
    created_at timestamp without time zone,
    updated_at timestamp without time zone

);


-- +goose Down

