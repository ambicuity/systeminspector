import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
const turndownPluginGfm = require('turndown-plugin-gfm');
const gfm = turndownPluginGfm.gfm;

const LEGACY_DIR = path.join(process.cwd(), 'docs', 'legacy_html');
const OUTPUT_DIR = path.join(process.cwd(), 'docs');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});
turndownService.use(gfm);

// Custom rule for code blocks that might be in <pre class="js">
turndownService.addRule('pre-js', {
  filter: (node, options) => {
    return node.nodeName === 'PRE' && node.classList.contains('js');
  },
  replacement: (content) => {
    return '\n\n```javascript\n' + content.trim() + '\n```\n\n';
  }
});

// Fix for raw JSON example blocks in <pre class="example">
turndownService.addRule('pre-example', {
  filter: (node, options) => {
    return node.nodeName === 'PRE' && node.classList.contains('example');
  },
  replacement: (content, node) => {
    // Some older versions of Turndown might not pass `node`, but let's try reading textContent
    const code = node && node.textContent ? node.textContent.trim() : content.trim();
    return '\n\n```json\n' + code + '\n```\n\n';
  }
});

async function migrateDocs() {
  try {
    const files = await fs.readdir(LEGACY_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html'); // Skip index.html, we wrote a new one

    console.log(`Found ${htmlFiles.length} HTML files to migrate.`);

    for (const file of htmlFiles) {
      const filePath = path.join(LEGACY_DIR, file);
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Target the main content section
      let contentSection = document.querySelector('.content .sectionheader');
      if (!contentSection) {
        contentSection = document.querySelector('.content');
      }
      
      if (!contentSection) {
        console.warn(`[WARN] Skipping ${file} - could not find main content section.`);
        continue;
      }

      // Add # Title based on the .title element if it exists
      const titleEl = contentSection.querySelector('.title');
      let pageTitle = '';
      if (titleEl) {
        pageTitle = `# ${titleEl.textContent}\n\n`;
        titleEl.remove();
      }

      // Cleanup some repetitive elements
      const breadcrumbs = contentSection.querySelector('.row.index');
      if (breadcrumbs) breadcrumbs.remove();
      
      const hrElements = contentSection.querySelectorAll('hr');
      hrElements.forEach(hr => hr.remove());

      // FIX: Extract `.example` rows from tables so they do not break Markdown generation
      const exampleRows = contentSection.querySelectorAll('tr.example');
      const examplesHtml: string[] = [];
      exampleRows.forEach(row => {
        examplesHtml.push(row.innerHTML);
        row.remove(); // Remove from the DOM so the table stays clean
      });

      let markdown = turndownService.turndown(contentSection.innerHTML);
      
      // Basic cleanup of generated markdown
      markdown = markdown.replace(/\[\\]/g, ''); // Fix escaping issues sometimes found in tables
      markdown = pageTitle + markdown;

      // Append extracted examples
      if (examplesHtml.length > 0) {
        markdown += '\n\n## Examples\n\n';
        examplesHtml.forEach(exHtml => {
          markdown += turndownService.turndown(exHtml) + '\n\n';
        });
      }
      
      const basename = path.basename(file, '.html');
      // Fix: We already created memory.md, cpu.md, gettingstarted.md manually, so let's skip them
      if (['cpu', 'memory', 'gettingstarted'].includes(basename)) {
        console.log(`[SKIP] ${basename}.md already exists.`);
        continue;
      }

      const outputFilePath = path.join(OUTPUT_DIR, `${basename}.md`);
      
      await fs.writeFile(outputFilePath, markdown, 'utf-8');
      console.log(`[SUCCESS] Migrated ${file} to ${basename}.md`);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateDocs();
