const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function processFiles() {
  const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'index.md');
  
  files.forEach(file => {
    const filePath = path.join(docsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has frontmatter
    const hasFrontmatter = content.startsWith('---');
    
    // Derive a name
    const baseName = path.basename(file, '.md');
    let title = baseName === 'general' ? 'General System' : 
                baseName === 'gettingstarted' ? 'Getting Started' : 
                baseName === 'os' ? 'Operating System' : 
                capitalize(baseName);
                
    const description = `Complete SystemInspector documentation and API reference for ${title}. Retrieve detailed hardware and system telemetry in Node.js.`;
    
    if (hasFrontmatter) {
      if (!content.includes('description:')) {
        // Inject description into existing frontmatter
        content = content.replace(/^---\n/, `---\ndescription: "${description}"\n`);
        fs.writeFileSync(filePath, content);
        console.log(`[UPDATED] Added description to ${file}`);
      }
    } else {
      // Create new frontmatter
      const newFrontmatter = `---\ndescription: "${description}"\n---\n\n`;
      fs.writeFileSync(filePath, newFrontmatter + content);
      console.log(`[CREATED] Added frontmatter to ${file}`);
    }
  });
}

processFiles();
console.log('Description injection complete.');
