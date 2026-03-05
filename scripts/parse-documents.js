const fs = require('fs');
const path = require('path');

/**
 * Parse frontmatter from a markdown file
 * @param {string} content - The markdown file content
 * @returns {object} - Parsed frontmatter object
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {};
  }
  
  const frontmatterText = match[1];
  const lines = frontmatterText.split('\n');
  const frontmatter = {};
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(': ');
    if (key && valueParts.length > 0) {
      let value = valueParts.join(': ').trim();
      
      // Handle arrays (labels)
      if (key === 'labels' && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(item => item.trim().replace(/"/g, '').replace(/'/g, ''));
      }
      
      frontmatter[key.trim()] = value;
    }
  }
  
  return frontmatter;
}

/**
 * Parse a markdown document and extract metadata
 * @param {string} filePath - Path to the markdown file
 * @returns {object|null} - Parsed document metadata or null if no frontmatter
 */
function parseDocument(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip template.md
    if (path.basename(filePath) === 'template.md') {
      return null;
    }
    
    const frontmatter = parseFrontmatter(content);
    
    if (Object.keys(frontmatter).length === 0) {
      console.warn(`No frontmatter found in: ${filePath}`);
      return null;
    }
    
    // Extract title from frontmatter or first h1
    const title = frontmatter.title || content.match(/^# (.+)$/m)?.[1] || path.basename(filePath, '.md');
    
    // Extract content after frontmatter
    const contentAfterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    return {
      title,
      description: frontmatter.description || '',
      category: frontmatter.category || 'uncategorized',
      priority: frontmatter.priority || 'medium',
      assignee: frontmatter.assignee || '',
      labels: frontmatter.labels || [],
      content: contentAfterFrontmatter,
      filePath,
      filename: path.basename(filePath)
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Parse all documents in the docs folder
 * @param {string} docsDir - Path to the docs directory
 * @returns {Array} - Array of parsed documents
 */
function parseAllDocuments(docsDir = 'docs') {
  const documents = [];
  
  try {
    const files = fs.readdirSync(docsDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(docsDir, file);
        const doc = parseDocument(filePath);
        
        if (doc) {
          documents.push(doc);
          console.log(`Parsed: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading docs directory: ${error.message}`);
  }
  
  return documents;
}

// Export functions for use in other scripts
module.exports = {
  parseFrontmatter,
  parseDocument,
  parseAllDocuments
};

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const docsDir = args[0] || 'docs';
  
  console.log(`Parsing documents in: ${docsDir}`);
  const documents = parseAllDocuments(docsDir);
  
  console.log(`\nFound ${documents.length} document(s):`);
  documents.forEach(doc => {
    console.log(`- ${doc.title} (${doc.filename})`);
  });
  
  // Output JSON
  console.log('\n--- JSON Output ---');
  console.log(JSON.stringify(documents, null, 2));
}