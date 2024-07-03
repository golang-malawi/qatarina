-- +goose Up

CREATE TABLE projects (
    id serial primary key not null,
    title text not null,
    description text not null,
    version varchar(100) null,
    is_active boolean default true,
    is_public boolean default true,
    website_url text null,
    github_url text null,
    trello_url text null,
    jira_url text null,
    monday_url text null,
    owner_user_id integer not null,
    created_at timestamp without time zone not null,
    updated_at timestamp without time zone not null,
    deleted_at timestamp without time zone null
);

ALTER TABLE projects ADD CONSTRAINT fk_project_owner FOREIGN KEY (owner_user_id) REFERENCES users(id);

COMMENT ON COLUMN projects.title IS 'Title of the project';
COMMENT ON COLUMN projects.description IS 'Description of the project';
COMMENT ON COLUMN projects.version IS 'Version of the project';
COMMENT ON COLUMN projects.is_active IS 'Whether project is active or not';
COMMENT ON COLUMN projects.is_public IS 'Whether project is public or not';
COMMENT ON COLUMN projects.website_url IS 'URL to the projects website';
COMMENT ON COLUMN projects.github_url IS 'URL to the GitHub Organization or Project link';
COMMENT ON COLUMN projects.trello_url IS 'URL to Trello if available';
COMMENT ON COLUMN projects.jira_url IS 'URL to JIRA if available';
COMMENT ON COLUMN projects.monday_url IS 'URL to Monday.com if available';
COMMENT ON COLUMN projects.owner_user_id IS 'The ID of the owner or creator of the project';
-- +goose Down
