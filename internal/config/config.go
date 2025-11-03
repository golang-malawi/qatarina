package config

import (
	"fmt"
	"net"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

type Config struct {
	Server     HTTPServerConfiguration `mapstructure:"server"`
	Auth       AuthConfiguration       `mapstructure:"auth"`
	Database   DatabaseConfiguration   `mapstructure:"db"`
	SMTP       SMTPConfiguration       `mapstructure:"smtp"`
	Logging    LoggingConfiguration    `mapstructure:"logging"`
	Platform   PlatformConfiguration   `mapstructure:"platform"`
	ImportFile ImportFileConfiguration `mapstructure:"import_file"`
	GitHub     GitHubConfiguration     `mapstructure:"github"`
}

type DatabaseConfiguration struct {
	Host               string `mapstructure:"host" envconfig:"QATARINA_DB_HOST"`
	Username           string `mapstructure:"username" envconfig:"QATARINA_DB_USERNAME"`
	Password           string `mapstructure:"password" envconfig:"QATARINA_DB_PASSWORD"`
	Database           string `mapstructure:"database" envconfig:"QATARINA_DB_DATABASE"`
	Options            string `mapstructure:"options" envconfig:"QATARINA_DB_OPTIONS"`
	Port               int    `mapstructure:"port" envconfig:"QATARINA_DB_PORT"`
	SetConnMaxLifetime int    `mapstructure:"conn_max_lifetime" envconfig:"QATARINA_DB_CONN_MAX_LIFE_TIME"`
}

type HTTPServerConfiguration struct {
	FQDN string `mapstructure:"fqdn" envconfig:"QATARINA_SERVER_FQDN"`
	Host string `mapstructure:"host" envconfig:"QATARINA_SERVER_HOST"`
	Port int    `mapstructure:"port" envconfig:"QATARINA_SERVER_PORT"`
}

type LoggingConfiguration struct {
	Level string
	File  string
}

type SMTPConfiguration struct {
	Host     string `mapstructure:"host" envconfig:"QATARINA_SMTP_HOST"`
	Port     int    `mapstructure:"port" envconfig:"QATARINA_SMTP_PORT"`
	Username string `mapstructure:"username" envconfig:"QATARINA_SMTP_USERNAME"`
	Password string `mapstructure:"password" envconfig:"QATARINA_SMTP_PASSWORD"`
	From     string `mapstructure:"from" envconfig:"QATARINA_SMTP_FROM"`
	ReplyTo  string `mapstructure:"reply_to" envconfig:"QATARINA_SMTP_REPLY_TO"`
	SSL      bool   `mapstructure:"ssl" envconfig:"QATARINA_SMTP_SSL"`
}

type AuthConfiguration struct {
	SignupEnabled           bool   `mapstructure:"signup_enabled" envconfig:"QATARINA_AUTH_SIGNUP_ENABLED"`
	MaxLoginAttempts        int    `mapstructure:"max_login_attempts" envconfig:"QATARINA_AUTH_MAX_LOGIN_ATTEMPTS"`
	RequireVerifiedAccounts bool   `mapstructure:"require_verified_accounts" envconfig:"QATARINA_AUTH_REQUIRE_VERIFIED_ACCOUNTS"`
	JwtSecretKey            string `mapstructure:"jwt_secret_key" envconfig:"QATARINA_AUTH_JWT_SECRET_KEY"`
	JwtIssuer               string `mapstructure:"jwt_issuer" envconfig:"QATARINA_AUTH_JWT_ISSUER"`
	JwtExpiryTimeout        int    `mapstructure:"jwt_expiry_timeout" envconfig:"QATARINA_AUTH_JWT_EXPIRY_TIMEOUT"`
}

type AdminConfiguration struct {
	Username string `mapstructure:"" envconfig:"QATARINA_ADMIN_USERNAME"`
	Password string `mapstructure:"" envconfig:"QATARINA_ADMIN_PASSWORD"`
	Email    string `mapstructure:"" envconfig:"QATARINA_ADMIN_EMAIL"`
	Enabled  bool   `mapstructure:"" envconfig:"QATARINA_ADMIN_ENABLED"`
}

type PlatformConfiguration struct {
	AnonymousTestCase     bool `mapstructure:"" envconfig:"QATARINA_ANONYMOUS_TEST_CASE"`
	CreateDefaultTestPlan bool `mapstructure:"create_default_test_plan" envconfig:"QATARINA_ENABLE_DEFAULT_TEST_PLAN"`
}

type ImportFileConfiguration struct {
	MaxRows int `mapstructure:"max_rows"`
}

type GitHubConfiguration struct {
	AppID          string `mapstructure:"app_id" envconfig:"QATARINA_GITHUB_APP_ID"`
	PrivateKeyPEM  string // populated at runtime
	PrivateKeyPath string `mapstructure:"private_key_path" envconfig:"QATARINA_GITHUB_PRIVATE_KEY_PATH"`
}

func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?%s", c.Database.Username, c.Database.Password, c.Database.Host, c.Database.Port, c.Database.Database, c.Database.Options)
}

func (c *Config) ListenAddress() string {
	return net.JoinHostPort(c.Server.Host, fmt.Sprint(c.Server.Port))
}

func (c *Config) OpenDB() *sqlx.DB {
	db, err := sqlx.Open("pgx", c.GetDatabaseURL())
	if err != nil {
		panic(err)
	}
	// See "Important settings" section.
	db.SetConnMaxLifetime(time.Duration(c.Database.SetConnMaxLifetime * int(time.Second)))
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)

	return db
}

var DefaultConfig = Config{
	Server: HTTPServerConfiguration{
		FQDN: "",
		Host: "",
		Port: 0,
	},
	Auth: AuthConfiguration{
		SignupEnabled:           true,
		MaxLoginAttempts:        3,
		RequireVerifiedAccounts: false,
		JwtSecretKey:            "default",
		JwtIssuer:               "qatarina.example.com",
		JwtExpiryTimeout:        7200,
	},
	Database: DatabaseConfiguration{
		Host:               "",
		Username:           "",
		Password:           "",
		Database:           "",
		Options:            "",
		Port:               0,
		SetConnMaxLifetime: 0,
	},
	SMTP: SMTPConfiguration{
		Host:     "",
		Port:     0,
		Username: "",
		Password: "",
		From:     "",
		ReplyTo:  "",
		SSL:      false,
	},
	Logging: LoggingConfiguration{
		Level: "",
		File:  "",
	},
	Platform: PlatformConfiguration{
		AnonymousTestCase:     false,
		CreateDefaultTestPlan: true,
	},
	GitHub: GitHubConfiguration{
		AppID:         "",
		PrivateKeyPEM: "",
	},
}
