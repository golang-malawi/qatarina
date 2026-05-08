package common

import "fmt"

func SplitProject(project string) (string, string, error) {
	for i := range project {
		if project[i] == '/' {
			return project[:i], project[i+1:], nil
		}
	}
	return "", "", fmt.Errorf("invalid project format, expected owner/repo")
}
