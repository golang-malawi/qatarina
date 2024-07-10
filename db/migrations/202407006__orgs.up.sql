-- +goose Up
CREATE TABLE orgs (
    id serial primary key not null,
    name text not null,
    address text,
    country text,
    github_url text,
    website_url text,
    created_by_id integer not null,
    created_at timestamp without time zone not null,
    updated_at timestamp without time zone null,
    CONSTRAINT fk_org_creator FOREIGN KEY (created_by_id) REFERENCES users(id)
);


COMMENT ON COLUMN orgs.name IS 'Name of the organization';
COMMENT ON COLUMN orgs.address IS 'Address of the org';
COMMENT ON COLUMN orgs.country IS 'Country of the org';
COMMENT ON COLUMN orgs.github_url IS 'Optional github url';
COMMENT ON COLUMN orgs.website_url IS 'Optional website url';
COMMENT ON COLUMN orgs.created_by_id IS 'User who created the org';

CREATE TABLE org_members (
    id serial primary key not null,
    org_id integer not null,
    user_id integer not null,
    role text not null,
    created_at timestamp without time zone not null,
    removed_at timestamp without time zone null,
    CONSTRAINT fk_membership_org FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_member FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- +goose Down
