-- +goose Up
CREATE TABLE project_testers (
    id serial primary key not null,
    project_id integer not null,
    user_id integer not null,
    role text not null, -- roles can be 'lead', 'engineer', 'client', 'bot' or 'ai_agent'
    is_active boolean not null,
    created_at timestamp without time zone default now (),
    updated_at timestamp without time zone default now (),
    CONSTRAINT unq_project_tester UNIQUE (project_id, user_id),
    CONSTRAINT fk_project_tester_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_tester_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

COMMENT ON COLUMN project_testers.project_id IS 'The project associated with this tester';

COMMENT ON COLUMN project_testers.user_id IS 'The user who is acting as a tester for the project';

COMMENT ON COLUMN project_testers.role IS 'Role of the tester, roles can be lead, engineer, client, bot or ai_agent';

-- +goose Down
DROP TABLE project_testers;
