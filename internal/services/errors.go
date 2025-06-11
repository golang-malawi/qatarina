package services

import "errors"

var ErrInvalidCredentials = errors.New("invalid email and password combination provided")
var ErrNotFound = errors.New("entity or resource not found")
