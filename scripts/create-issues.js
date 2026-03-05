const fs = require('fs');
const path = require('path');
const { parseAllDocuments } = require('./parse-documents');

/**
 * Create a GitHub issue
 * @param {object} doc - Document object with metadata
 * @param {string} repoOwner - GitHub repository owner
 * @param {string} repoName - GitHub repository name
 * @param {string} token - GitHub Personal Access Token
 * @returns {object|null} - Created issue object or null if failed
 */
async function createIssue(doc, repoOwner, repoName, token) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/issues`;
  
  // Build issue body from document content
  const issueBody = buildIssueBody(doc);
  
  // Clean up title (remove quotes if present)
  const cleanTitle = doc.title ? doc.title.replace(/^["']|["']$/g, '') : '';
  
  const payload = {
    title: cleanTitle,
    body: issueBody,
    labels: doc.labels.length > 0 ? doc.labels : ['documentation']
  };
  
  // Only add assignees if there's a valid assignee
  if (doc.assignee) {
    payload.assignees = [doc.assignee];
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to create issue for "${doc.title}":`, errorData);
      return null;
    }
    
    const issue = await response.json();
    console.log(`✓ Created issue #${issue.number}: ${doc.title}`);
    return issue;
  } catch (error) {
    console.error(`Error creating issue for "${doc.title}":`, error.message);
    return null;
  }
}

/**
 * Build issue body from document content
 * @param {object} doc - Document object
 * @returns {string} - Formatted issue body
 */
function buildIssueBody(doc) {
  let body = doc.description ? `## Description\n\n${doc.description}\n\n` : '';
  
  body += `## Acceptance Criteria\n\n`;
  
  // Extract acceptance criteria from content
  const acceptanceCriteriaMatch = doc.content.match(/## Acceptance Criteria([\s\S]*?)(?=## Tasks|$)/);
  if (acceptanceCriteriaMatch) {
    body += acceptanceCriteriaMatch[1].trim() + '\n\n';
  } else {
    body += '- [ ] Define acceptance criteria\n\n';
  }
  
  body += `## Tasks\n\n`;
  
  // Extract tasks from content
  const tasksMatch = doc.content.match(/## Tasks([\s\S]*?)(?=## Notes|$)/);
  if (tasksMatch) {
    body += tasksMatch[1].trim() + '\n\n';
  } else {
    body += '### Development\n- [ ] \n\n### QA\n- [ ] \n\n';
  }
  
  if (doc.category) {
    body += `## Category\n\n${doc.category}\n\n`;
  }
  
  if (doc.priority) {
    body += `## Priority\n\n${doc.priority}\n\n`;
  }
  
  if (doc.filePath) {
    body += `## Source\n\n[Document: ${doc.filename}](${doc.filePath})\n`;
  }
  
  return body;
}

/**
 * Create GitHub issues from all documents
 * @param {string} docsDir - Path to docs directory
 * @param {string} repoOwner - GitHub repository owner
 * @param {string} repoName - GitHub repository name
 * @param {string} token - GitHub Personal Access Token
 * @returns {Array} - Array of created issues
 */
async function createIssuesFromDocs(docsDir = 'docs', repoOwner, repoName, token) {
  const documents = parseAllDocuments(docsDir);
  
  if (documents.length === 0) {
    console.log('No documents found to process.');
    return [];
  }
  
  const createdIssues = [];
  
  for (const doc of documents) {
    const issue = await createIssue(doc, repoOwner, repoName, token);
    if (issue) {
      createdIssues.push(issue);
    }
  }
  
  console.log(`\nCreated ${createdIssues.length} issue(s) out of ${documents.length} document(s).`);
  return createdIssues;
}

/**
 * Load configuration from config file
 * @param {string} configPath - Path to config file
 * @returns {object} - Configuration object
 */
function loadConfig(configPath = 'config/config.json') {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error.message);
  }
  return {};
}

// Main execution
async function main() {
  // Load configuration
  const config = loadConfig();
  
  // Get environment variables (take precedence over config)
  const repoOwner = process.env.GITHUB_OWNER || config.repoOwner;
  const repoName = process.env.GITHUB_REPO || config.repoName;
  const token = process.env.GITHUB_TOKEN || config.token;
  const docsDir = process.env.DOCS_DIR || config.docsDir || 'docs';
  
  // Validate required configuration
  if (!repoOwner || !repoName || !token) {
    console.error('Missing required configuration:');
    console.error('- GITHUB_OWNER (repository owner)');
    console.error('- GITHUB_REPO (repository name)');
    console.error('- GITHUB_TOKEN (Personal Access Token)');
    console.error('\nSet environment variables or create config/config.json');
    process.exit(1);
  }
  
  console.log(`Creating issues for ${repoOwner}/${repoName} from ${docsDir}/`);
  
  const issues = await createIssuesFromDocs(docsDir, repoOwner, repoName, token);
  
  if (issues.length > 0) {
    console.log('\nCreated Issues Summary:');
    issues.forEach(issue => {
      console.log(`- #${issue.number}: ${issue.title} (${issue.html_url})`);
    });
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other scripts
module.exports = {
  createIssue,
  buildIssueBody,
  createIssuesFromDocs,
  loadConfig
};