package services

import (
	"fmt"
)

func main() {
	intergrateJira := &JiraIntegration{}
	integrateGithub := &GithubConnection{}

	intergrationProcessor := &IntegrationProcessor{}
	intergrationProcessor.SetIntegrationMethod(intergrateJira)
	intergrationProcessor.SendIssue("hello", "summer time", "12345")

	fmt.Println("Jira Integration: ")

	intergrationProcessor.SetIntegrationMethod(integrateGithub)
	intergrationProcessor.SendIssue("hello", "winter time", "123456")

}

type IntegrationMethod interface {
	SendIssue(issueTitle, issueDescription, projectID string) error
}

type IntegrationProcessor struct {
	integrationMethod IntegrationMethod
}

func (i *IntegrationProcessor) SetIntegrationMethod(method IntegrationMethod) {
	i.integrationMethod = method
}

func (i *IntegrationProcessor) SendIssue(issueTitle, issueDescription, projectID string) error {
	return i.integrationMethod.SendIssue(
		issueTitle,
		issueDescription,
		projectID,
	)
}

type JiraIntegration struct{}

func (j *JiraIntegration) SendIssue(issueTitle, issueDescription, projectID string) error {
	return nil
}

type GithubConnection struct{}

func (g *GithubConnection) SendIssue(issueTitle, issueDescription, projectID string) error {
	return nil
}

func EncryptText(plainText, key string) (encryptedText []byte, err error) {

	return nil, nil

}

func DecryptText(encryptedText []byte, key string) (plainText string, err error) {


	return "", nil
}