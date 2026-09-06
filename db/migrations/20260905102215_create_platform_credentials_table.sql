-- +goose Up
create table platform_credentials (
    id serial primary key,
    platform varchar(15) not null CHECK (platform IN ('JIRA', 'GITHUB', 'TRELLO', 'MONDAY')),
    platform_username varchar(50) not null,
    access_token bytea not null,
    domain varchar(150),
    user_id integer not null,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now(),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);

COMMENT ON COLUMN platform_credentials.platform IS "The platform can either be JIRA, GITHUB or TRELLO ";
COMMENT ON COLUMN platform_credentials.platform_username IS "The platform username can either be the username or email from the selected platform ";
COMMENT ON COLUMN platform_credentials.domain IS "This is the url or base for the selected platform for instance when using jira you have to pass https://yourjira.jira.com ";
-- +goose Down
SELECT 'down SQL query';
