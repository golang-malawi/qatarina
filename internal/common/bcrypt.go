package common

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

var PasswordHashCost = bcrypt.DefaultCost

// CheckPasswordHash compare password with hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// hashPassword generates a hashed password from a plaintext string
func HashPassword(password string) (string, error) {
	pw, err := bcrypt.GenerateFromPassword([]byte(password), PasswordHashCost)
	if err != nil {
		return "", err
	}
	return string(pw), nil
}
func MustHashPassword(password string) string {
	pw, err := bcrypt.GenerateFromPassword([]byte(password), PasswordHashCost)
	if err != nil {
		panic(fmt.Errorf("MustHashPassword failed: %v", err))
	}
	return string(pw)
}
