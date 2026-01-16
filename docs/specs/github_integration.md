# GitHub Intergration Specification

## 1. Overview
Qatarina is a QA management system. This feature introduces GitHub integration,
enabling users to import and create test cases directly from GitHub pull requests (PRS) and issues. The goal is to make it easier for QA workflows by linking code changes and reported issues on the project on the GitHub

## 2. Problem Statement
Currently the test cases in Qatarina are created manually, disconnected from the development workflow in GitHub. This results in:
*   Duplicate effort when documenting test cases.
*   Lack of traceability between GitHub activity and QA validation.
*   reduced efficiency when managing multiple projects accross repositories.

## 3. Goals
*   Provide a UI button(**"import from GitHub"**) within each Qatarina Project.
*   Allow users to link a GitHub repository(e.g kwachakonverters) to a Qatarina project.
*   Enable importing of PRs and issues from the linked repository.
*   Automatically generate test cases in Qatarina based on the PRs/issues
Support multile projects in Qatarina, each linked to different GitHub repositories

## 4. Functional Requirements

### 4.1 Project Setup
*   User creates a project in Qatarina(e.g kwachakonverters)
*   user deifnes modules to test within the project

### 4.2 GitHub Integration
*   **Authentication:** 
    *   Qatarina will connect to GitHub via a GitHub App.
    users install the Qatarina GitHub App on their repositories or organisations.
    * The app provides secure, centralized authntication without requiring environment variables.
*   **Respository Linking:**
    *   After installation, users can select which repositories to link to their Qatarina project.
*   **Import Button:**
    *   A button labeled Import from GitHub appears in the project UI.
    *    Clicking if fetches PRs and issues from the linked repository using the GitHub App's permissions.

### 4.3 Importing PRS and Issues
*   When clicked, the button fetches PRs and issues from the linked repositroy
*   Mapping rules:
    *   PR/Issue -> Test case title
    *   PR/issue decription -> Test case title
    *   Lables -> Test case tags
    *   Linked issues in PR -> Related test cases,
*   Imported testcases are stored within the specific Qatarina project

### 4.4 Multi-Project Support
*   Each Qatarina project can be linked to a different GitHub repository.
*   Users can manage multiple repositories simultaneously(e.g kwachakonveters, helpaside).
*   Imported PRs/issues are scoped to their respective Qatarina project.

## 5. Non-Functional Requirements 
*   **Security:** Tokens stored securely, follow GitHuv API best practices
*   **Perfomance:** Efficienlty handle respositories with large numbers of PRs/issues.
*   **Scalability:** Support multiple projects and repositories without conflict.
*   **Maintainability:** Modular integration code, easy to extend for future enhancements.

## 6. User Flow Example (kwachakonveters)
1. User created a project in Qatarina named kwachakonverters.
2. user defines modules (Login, Create Sale).
3. user clicks Import from GitHub.
4. Qatarina connects to the kwachakonverters GitHub repository.
5. PRs and issues are fetched:
    *   Issue #12 Login with valid credentials" becomes a testcase *in Login module.*
    *   PR #45 "Create Sale Request" -> becomes a test case *in Create Sale module.*
6. Test cases are now visible in Qatarina, linked back to their GitHub source.

## 7. Dependecies
*   GitHub REST API/GarphQL API.
*   Qatarina GitHub App (Registered in GitHub Developer settings).
*   Wbhook handling for PR/issue events (future enhancement).

## 8. Accceptance Criteria
*   User can install Qatarina GitHub App on a repository.
*   User can link the repository to a Qatarina project without setting the environment variables.
*   Imported PRs/issues are converted into test cases.
*   Erros (e.g., missing app installation, insufficient permissions) are surfaced clearly.


