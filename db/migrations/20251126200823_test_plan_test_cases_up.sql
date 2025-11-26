-- +goose Up
CREATE TABLE test_plan_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_plan_id INT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE (test_plan_id, test_case_id)
);
-- +goose Down
DROP TABLE test_plan_test_cases;
