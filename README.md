# BA Tool - Business Analyst GitHub Integration

A tool for Business Analysts to create GitHub issues from documentation files. This tool automates the process of converting BA documents into development and QA tasks.

## Features

- 📄 Parse documentation files with YAML frontmatter
- 🏷️ Extract metadata (title, description, type, priority, labels)
- 🎯 Create GitHub issues with proper structure
- 📋 Support for user stories, acceptance criteria, and QA test cases
- 🔄 Automated workflow via GitHub Actions

## Project Structure

```
ba-tool/
├── docs/                    # Document files (one per issue)
│   ├── template.md         # Template for new documents
│   └── sample-document.md  # Example document
├── scripts/
│   ├── parse-documents.js  # Document parser
│   └── create-issues.js    # GitHub issue creator
├── config/
│   └── config.json         # Configuration file
├── .github/workflows/      # GitHub Actions workflows
│   └── issue-creator.yml   # Automated workflow
└── README.md               # This file
```

## Document Format

Each document in the `docs/` folder should follow this format:

```markdown
---
title: "Document Title"
description: "Brief description of the requirement"
type: "feature|bug|task"  # Default: feature
priority: "low|medium|high|critical"  # Default: medium
assignee: "github-username"  # Optional
labels: ["label1", "label2"]  # Additional labels
status: "pending|in-progress|review"  # Default: pending
estimate: 5  # Story points estimate
related_issues: ["123", "456"]  # Related issue numbers
---

# Document Title

## Business Context
Describe the business need...

## User Stories
### US-001: Story Title
**As a** [role]  
**I want to** [feature]  
**So that** [benefit]

## Acceptance Criteria
1. First criterion
2. Second criterion

## QA Test Cases
1. **TC-001**: Test description
   - Given [precondition]
   - When [action]
   - Then [expected result]
```

## Configuration

Create a `config/config.json` file:

```json
{
  "repoOwner": "your-github-username",
  "repoName": "your-repository-name",
  "token": "",
  "docsDir": "docs",
  "defaultLabels": ["documentation", "triage"],
  "defaultAssignee": "",
  "issueTemplate": {
    "titlePrefix": "",
    "titleSuffix": ""
  }
}
```

## Local Usage

### Prerequisites
- Node.js 20+
- GitHub Personal Access Token with `repo` scope

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure GitHub credentials in `config/config.json`:
```json
{
  "repoOwner": "your-github-username",
  "repoName": "your-repository-name",
  "token": "your_personal_access_token"
}
```

Or set environment variables:
```env
GITHUB_TOKEN=your_personal_access_token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
```

4. Run the parser:
```bash
node scripts/parse-documents.js
```

5. Create issues:
```bash
node scripts/create-issues.js
```

## GitHub Actions Workflow

### Setup

To enable automated issue creation via GitHub Actions:

1. Create a Personal Access Token (PAT) with `repo` scope:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` scope checked
   - Copy the generated token

2. Add the PAT as a repository secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `BA_TOOL_PAT`
   - Value: (paste your PAT)

3. Commit and push changes to trigger the workflow

### Workflow Triggers

The workflow automatically runs when:
- A document in `docs/` is pushed to `main` or `master`
- Manually triggered via workflow dispatch

The workflow will:
1. Checkout the repository
2. Parse all documents in `docs/`
3. Create GitHub issues for each document
4. Upload a summary of created issues

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes |
| `GITHUB_OWNER` | GitHub username/organization | No (auto-detected) |
| `GITHUB_REPO` | Repository name | No (auto-detected) |
| `DOCS_DIR` | Directory containing docs | No (default: docs) |

## Output

The tool generates two files:
- `created-issues.json` - Detailed JSON of all created issues
- `issue-summary.txt` - Human-readable summary

## Example Output

```
Issue Summary:
==============
1. [BA] Sample Feature Request (#123)
   - Type: feature
   - Priority: high
   - Labels: feature, backend, high-priority
   - Story Points: 5

Created 1 issue(s) successfully.
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Ensure `GITHUB_TOKEN` is set correctly
   - Verify token has `repo` scope

2. **Document Parsing Error**
   - Check YAML frontmatter syntax
   - Ensure all required fields are present

3. **Issue Creation Failed**
   - Verify repository exists and is accessible
   - Check GitHub API rate limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details