-- +goose Up
CREATE TABLE test_plan_cases (
    test_plan_id BIGINT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    PRIMARY KEY (test_plan_id, test_case_id)
);

-- +goose Down
DROP TABLE IF EXISTS test_plan_cases;