package mcpserver

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/schema"
)

// Identity is the QATARINA user a tool call runs as.
type Identity struct {
	UserID      int64
	Email       string
	DisplayName string
}

type identityKey struct{}

func withIdentity(ctx context.Context, identity *Identity) context.Context {
	return context.WithValue(ctx, identityKey{}, identity)
}

func identityFrom(ctx context.Context) (*Identity, bool) {
	identity, ok := ctx.Value(identityKey{}).(*Identity)
	return identity, ok && identity != nil
}

func (s *Server) signIn(email, password string) (*Identity, error) {
	if email == "" || password == "" {
		return nil, errors.New("email and password are required for the stdio transport")
	}
	res, err := s.authService.SignIn(&schema.LoginRequest{Email: email, Password: password})
	if err != nil {
		return nil, fmt.Errorf("failed to sign in: %w", err)
	}
	return &Identity{UserID: res.UserID, Email: res.Email, DisplayName: res.DisplayName}, nil
}

// requireAuthentication accepts the same JWTs the REST API issues and rejects
// the request before it reaches the MCP handler otherwise.
func (s *Server) requireAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || tokenStr == "" {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}
		identity, err := s.parseToken(tokenStr)
		if err != nil {
			s.logger.Debug("mcp", "rejected MCP request", "error", err)
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r.WithContext(withIdentity(r.Context(), identity)))
	})
}

func (s *Server) parseToken(tokenStr string) (*Identity, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		return []byte(s.config.Auth.JwtSecretKey), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("unexpected token claims")
	}
	userID, ok := claims["UserID"].(float64)
	if !ok {
		return nil, errors.New("token has no UserID claim")
	}
	email, _ := claims["Email"].(string)
	name, _ := claims["Name"].(string)
	return &Identity{UserID: int64(userID), Email: email, DisplayName: name}, nil
}
