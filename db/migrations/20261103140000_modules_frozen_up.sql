-- +goose Up
ALTER TABLE modules
    ADD COLUMN is_frozen boolean NOT NULL DEFAULT false,
    ADD COLUMN frozen_at timestamp without time zone NULL;

COMMENT ON COLUMN modules.is_frozen IS 'Frozen modules, and the modules below them, have test cases that cannot be used in new test plans or test runs';
COMMENT ON COLUMN modules.frozen_at IS 'When the module was last frozen, NULL while it is not frozen';

-- +goose Down
ALTER TABLE modules
    DROP COLUMN IF EXISTS frozen_at,
    DROP COLUMN IF EXISTS is_frozen;
