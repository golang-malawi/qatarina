# GitHub Integration Specification

## 1. Overview
Qatarina is a QA management system. This feature introduces GitHub integration,
enabling users to import and create test cases directly from GitHub pull requests (PRs) and issues. The goal is to make it easier for QA workflows by linking code changes and reported issues within GitHub projects.

## 2. Problem Statement
Currently the test cases in Qatarina are created manually, disconnected from the development workflow in GitHub. This results in:
*   Duplicate effort when documenting test cases.
*   Lack of traceability between GitHub activity and QA validation.
*   Reduced efficiency when managing multiple projects across repositories.

## 3. Goals
*   Provide a UI button(**"import from GitHub"**) within each Qatarina Project.
*   Allow users to link a GitHub repository(e.g kwachakonverters) to a Qatarina project.
*   Enable importing of PRs and issues from the linked repository.
*   Automatically generate test cases in Qatarina based on the PRs/issues
*   Support multiple projects in Qatarina, each linked to a different GitHub repository

## 4. Functional Requirements

### 4.1 Project Setup
*   User creates a project in Qatarina(e.g kwachakonverters)
*   User defines modules to test within the project

### 4.2 GitHub Integration
*   **Authentication:** 
    *   Qatarina will connect to GitHub via a GitHub App.
    *   Users install the Qatarina GitHub App on their repositories or organisations.
    * The app provides secure, centralized authentication without requiring environment variables.
*   **Repository Linking:**
    *   After installation, users can select which repositories to link to their Qatarina project.
*   **Import Button:**
    *   A button labeled Import from GitHub appears in the project UI.
    *    Clicking it fetches PRs and issues from the linked repository using the GitHub App's permissions.

### 4.3 Importing PRs and Issues
*   When clicked, the button fetches PRs and issues from the linked repository
*   Mapping rules:
    *   PR/issue -> Test case title
    *   PR/issue description -> Test case description
    *   Labels -> Test case tags
    *   Linked issues in PR -> Related test cases
*   Imported test cases are stored within the specific Qatarina project

### 4.4 Multi-Project Support
*   Each Qatarina project can be linked to a different GitHub repository.
*   Users can manage multiple repositories simultaneously(e.g kwachakonverters, helpaside).
*   Imported PRs/issues are scoped to their respective Qatarina project.

## 5. Non-Functional Requirements 
*   **Security:** Tokens stored securely, follow GitHub API best practices
*   **Performance:** Efficiently handle repositories with large numbers of PRs/issues.
*   **Scalability:** Support multiple projects and repositories without conflict.
*   **Maintainability:** Modular integration code, easy to extend for future enhancements.

## 6. User Flow Example (kwachakonverters)
1. User creates a project in Qatarina named kwachakonverters.
2. User defines modules (Login, Create Sale).
3. User clicks Import from GitHub.
4. Qatarina connects to the kwachakonverters GitHub repository.
5. PRs and issues are fetched:
    *   Issue #12 "Login with valid credentials" becomes a test case *in Login module*.
    *   PR #45 "Create Sale Request" -> becomes a test case *in Create Sale module*.
6. Test cases are now visible in Qatarina, linked back to their GitHub source.

## 7. Dependencies
*   GitHub REST API/GraphQL API.
*   Qatarina GitHub App (Registered in GitHub Developer settings).
*   Webhook handling for PR/issue events (future enhancement).

## 8. Acceptance Criteria
*   User can install Qatarina GitHub App on a repository.
*   User can link the repository to a Qatarina project without setting the environment variables.
*   Imported PRs/issues are converted into test cases.
*   Errors (e.g., missing app installation, insufficient permissions) are surfaced clearly.


