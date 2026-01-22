-- +goose Up
ALTER TABLE invites
DROP CONSTRAINT invites_test_case_id_fkey;

ALTER TABLE invites
ADD CONSTRAINT invites_test_case_id_fkey
    FOREIGN KEY (test_case_id)
    REFERENCES test_cases(id)
    ON DELETE CASCADE;
-- +goose Down
