-- +goose Up
-- +goose StatementBegin
CREATE TABLE pages (
    id serial not null primary key,
    parent_page_id integer,
    page_version varchar(50) not null default '1',
    org_id integer not null,
    project_id integer not null,
    code text not null,
    title text not null,
    file_path text,
    content text not null,
    page_type varchar(50) not null,
    mime_type varchar(100) not null default 'text/markdown',
    has_embedded_media boolean not null default false,
    external_content_url text,
    notion_url text, -- Special support for Notion
    last_edited_by integer not null,
    created_by integer not null default 0,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    unique(project_id, code)
);

ALTER TABLE pages ADD CONSTRAINT fk_pages_creator_id 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE pages ADD CONSTRAINT fk_pages_editor_id 
  FOREIGN KEY (last_edited_by) REFERENCES users(id);

COMMENT ON COLUMN pages.parent_page_id is 'Optional parent of the current page';
COMMENT ON COLUMN pages.page_version is 'Version of the page';
COMMENT ON COLUMN pages.org_id is 'Organization which owns the page. Here for quick analytical queries';
COMMENT ON COLUMN pages.project_id is 'Project ID which the page belongs to';
COMMENT ON COLUMN pages.page_type is 'Page Type: Prose, Help Video, Walkthrough, FAQ or something else';
COMMENT ON COLUMN pages.code is 'the name or token to embed the page as';
COMMENT ON COLUMN pages.title is 'The title of the page';
COMMENT ON COLUMN pages.content is 'The raw markdown content of the page';
COMMENT ON COLUMN pages.mime_type is 'The mime/type of the page, by default text/markdown';
COMMENT ON COLUMN pages.has_embedded_media is 'Whether the page has media links to Youtube or some other supported site';
COMMENT ON COLUMN pages.external_content_url is 'If the page is pulled from an external source,the url to that page';
COMMENT ON COLUMN pages.notion_url is 'Notion URL for a page containing the content, similar to external_content_url';
COMMENT ON COLUMN pages.last_edited_by is 'User who last edited this page on the system';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE pages;
-- +goose StatementEnd
