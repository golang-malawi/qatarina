-- +goose Up
-- Allow test_plan_id to be null for standalone test runs
ALTER TABLE test_runs ALTER COLUMN test_plan_id DROP NOT NULL;