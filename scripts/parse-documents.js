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
  let currentKey = '';
  let inList = false;
  
  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }
    
    // Check if this is a new key-value pair (not indented, not a list item)
    const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
    
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      const value = keyValueMatch[2].trim();
      
      // Check if this is a list (value starts with -)
      if (value.startsWith('- ')) {
        // Start of a list
        currentKey = key;
        inList = true;
        if (!frontmatter[currentKey]) {
          frontmatter[currentKey] = [];
        }
        // Extract the list item value (remove the - and trim, then remove quotes)
        const listItem = value.slice(2).trim().replace(/^["']|["']$/g, '');
        frontmatter[currentKey].push(listItem);
      } else if (key === 'labels' && value.startsWith('[') && value.endsWith(']')) {
        // Inline array format: labels: ["label1", "label2"]
        const arrayContent = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
        frontmatter[key] = arrayContent;
        inList = false;
      } else if (value === '') {
        // Key with empty value - might be a list header like "labels:"
        currentKey = key;
        inList = true;
        if (!frontmatter[currentKey]) {
          frontmatter[currentKey] = [];
        }
      } else if (value === '""' || value === "''") {
        // Empty string value
        frontmatter[key] = '';
        inList = false;
      } else {
        // Regular key-value pair
        frontmatter[key] = value;
        inList = false;
      }
    } else if (inList && line.trim().startsWith('- ')) {
      // Continue list item
      const listItem = line.trim().slice(2).trim().replace(/^["']|["']$/g, '');
      frontmatter[currentKey].push(listItem);
    } else if (inList && line.trim() !== '') {
      // Check if this is a continuation of the list item (indented line)
      const listItem = line.trim().replace(/^["']|["']$/g, '');
      frontmatter[currentKey].push(listItem);
    } else {
      // Not a list item, not a key-value pair
      inList = false;
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
    let title = frontmatter.title || content.match(/^# (.+)$/m)?.[1] || path.basename(filePath, '.md');
    // Remove surrounding quotes from title
    if (title && (title.startsWith('"') && title.endsWith('"')) || (title.startsWith("'") && title.endsWith("'"))) {
      title = title.slice(1, -1);
    }
    
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