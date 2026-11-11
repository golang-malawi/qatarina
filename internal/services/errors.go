package services

import "errors"

var ErrInvalidCredentials = errors.New("invalid email and password combination provided")
var ErrNotFound = errors.New("entity or resource not found")
var ErrForbidden = errors.New("you do not have permission to perform this action")
var ErrCannotResetOwnPassword = errors.New("use change password to update your own password")
