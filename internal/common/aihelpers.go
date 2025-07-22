package common

import (
	"context"
	"fmt"
	"strings"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type GeminiAPI interface {
	AnalyzeText(input string) (*GeminiResponse, error)
}

type GeminiResponse struct {
	SuggestedTestCases []string
}

type geminiClientImpl struct {
	logger       logging.Logger
	apiKeyConfig *config.Config
}

func NewGeminiClient(logger logging.Logger, apiKey *config.Config) GeminiAPI {
	return &geminiClientImpl{
		apiKeyConfig: apiKey,
		logger:       logger,
	}
}

func (g *geminiClientImpl) AnalyzeText(input string) (*GeminiResponse, error) {
	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(g.apiKeyConfig.Ai.GeminiApiKey))
	if err != nil {
		g.logger.Error("failed to load Gemini API key", "error", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-pro")
	prompt := fmt.Sprintf(`You 're a software QA assistant. Analyze the following documentation content and list detailed test cases that could be created to validate it:
	-----
	%s
	-----
	Respond with a concise list of suggested test cases.`, input)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		g.logger.Error("Gemini content generation failed", "error", err)
		return nil, fmt.Errorf("gemini generation error: %w", err)
	}
	text := extractTextFromResponse(resp)
	testCases := parseSuggestedTestCases(text)

	return &GeminiResponse{SuggestedTestCases: testCases}, nil

}

func extractTextFromResponse(resp *genai.GenerateContentResponse) string {
	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return ""
	}

	var builder strings.Builder

	for _, part := range resp.Candidates[0].Content.Parts {
		builder.WriteString(fmt.Sprintf("%v\n", part))

	}
	return builder.String()
}

func parseSuggestedTestCases(text string) []string {
	lines := strings.Split(text, "\n")
	var cases []string
	for _, line := range lines {
		line = strings.TrimSpace(strings.TrimPrefix(line, "-"))
		if line != "" {
			cases = append(cases, line)
		}
	}
	return cases
}
