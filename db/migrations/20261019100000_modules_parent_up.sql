-- +goose Up
ALTER TABLE modules
    ADD COLUMN parent_module_id integer NULL;

ALTER TABLE modules
    ADD CONSTRAINT fk_modules_parent_module
    FOREIGN KEY (parent_module_id) REFERENCES modules(id) ON DELETE SET NULL;

ALTER TABLE modules
    ADD CONSTRAINT modules_parent_not_self CHECK (parent_module_id IS NULL OR parent_module_id <> id);

CREATE INDEX idx_modules_parent_module_id ON modules(parent_module_id);

COMMENT ON COLUMN modules.parent_module_id IS 'Parent module in the module hierarchy, NULL for top-level modules';

-- +goose Down
DROP INDEX IF EXISTS idx_modules_parent_module_id;

ALTER TABLE modules
    DROP CONSTRAINT IF EXISTS modules_parent_not_self;

ALTER TABLE modules
    DROP CONSTRAINT IF EXISTS fk_modules_parent_module;

ALTER TABLE modules
    DROP COLUMN parent_module_id;
