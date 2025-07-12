-- +goose Up
-- +goose StatementBegin
CREATE TABLE invites(
    id serial not null primary key,
    sender_email text not null,
    receiver_email text not null,
    token text not null,
    expires_at timestamp without time zone null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE invites;
-- +goose StatementEnd
