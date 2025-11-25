-- +goose Up
ALTER TABLE invites ADD COLUMN test_case_id uuid REFERENCES test_cases(id);

-- +goose Down

