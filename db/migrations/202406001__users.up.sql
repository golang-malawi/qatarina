-- +goose Up

create table users (
    id serial not null primary key,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    display_name varchar(100),
    email text not null,
    password text not null ,
    phone varchar(20) not null,
    org_id int null,
    country_iso varchar(4) not null,
    city text,
    address text not null,
    is_activated boolean default false,
    is_reviewed boolean default false,
    is_super_admin boolean default false,
    is_verified boolean default false,
    last_login_at timestamp without time zone,
    email_confirmed_at timestamp without time zone,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now(),
    deleted_at timestamp without time zone null,
    unique(email)
);

COMMENT ON COLUMN users.first_name IS 'Firstname of the user';
COMMENT ON COLUMN users.last_name IS 'Family name or Surname of the user';
COMMENT ON COLUMN users.display_name IS 'Preferred display name';
COMMENT ON COLUMN users.email IS 'E-mail address of the user';
COMMENT ON COLUMN users.password IS 'BCrypt encryped Password of the user';
COMMENT ON COLUMN users.phone IS 'Primary phone number, used for OTP in the future';
COMMENT ON COLUMN users.org_id IS 'Organization to which this user account belongs to, 0 for system';
COMMENT ON COLUMN users.is_super_admin IS 'Whether the user is a system-wide administrator. Not to be confused with admin role';
COMMENT ON COLUMN users.email_confirmed_at IS 'When the user confirmed their account e-mail';
COMMENT ON COLUMN users.is_verified IS 'Whether user account is verified';
COMMENT ON COLUMN users.last_login_at IS 'Last login time of the user account';

-- +goose Down
