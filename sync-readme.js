#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const API_URL = 'https://pocket.uft1.com/data/personal-projects.json';
const HIGHLIGHTS_URL = 'https://pocket.uft1.com/data/highlights.json';

// Language to badge color mapping
const languageColors = {
  'JavaScript': '323330',
  'TypeScript': '3178C6',
  'Vue': '35495e',
  'React': '20232a',
  'PHP': '777BB4',
  'Python': '3776AB',
  'HTML': 'E34F26',
  'CSS': '1572B6',
  'SCSS': 'CC6699',
  'Svelte': 'FF3E00',
  'Astro': 'FF5D01',
  'C++': '00599C',
  'Ruby': 'CC342D',
  'Shell': '89E051'
};

async function fetchProjectsData() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchHighlightsData() {
  return new Promise((resolve, reject) => {
    https.get(HIGHLIGHTS_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function generateTechStackBadges(projects) {
  // Extract unique languages from projects
  const languages = [...new Set(
    projects
      .map(p => p.language)
      .filter(lang => lang && lang !== null)
  )].sort();

  // Generate badges for each language
  const badges = languages.map(lang => {
    const color = languageColors[lang] || '000000';
    const logoName = lang.toLowerCase().replace(/\+/g, 'plus');
    return `  <img src="https://img.shields.io/badge/${encodeURIComponent(lang)}-${color}?style=for-the-badge&logo=${logoName}&logoColor=white" />`;
  });

  return badges.join('\n');
}

function generateHighlightsShowcase(highlightsData) {
  const highlights = highlightsData.highlights.slice(0, 6); // Show top 6

  let showcase = `---

<div style="font-size: 1.25rem; font-weight: bold">🚀 Professional Highlights</div>

<table align="center">
`;

  // Create rows of 2 columns
  for (let i = 0; i < highlights.length; i += 2) {
    showcase += `<tr>\n`;
    
    // First column
    const highlight1 = highlights[i];
    showcase += `  <td align="center" width="50%" style="vertical-align: top; padding: 20px;">
    <h3 style="color: #2F81F7; margin-bottom: 8px;">${highlight1.title}</h3>
    <p><strong style="background: #f6f8fa; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">${highlight1.tag}</strong></p>
    <p style="font-size: 0.9em; line-height: 1.4; margin: 12px 0;">${highlight1.description}</p>`;
    
    if (highlight1.link) {
      showcase += `    <p>
      <a href="${highlight1.link}" target="_blank">
        <img src="https://img.shields.io/badge/View%20Project-000?style=for-the-badge&logo=firefox&logoColor=white" />
      </a>
    </p>`;
    }
    
    showcase += `  </td>\n`;

    // Second column (if exists)
    if (i + 1 < highlights.length) {
      const highlight2 = highlights[i + 1];
      showcase += `  <td align="center" width="50%" style="vertical-align: top; padding: 20px;">
    <h3 style="color: #2F81F7; margin-bottom: 8px;">${highlight2.title}</h3>
    <p><strong style="background: #f6f8fa; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">${highlight2.tag}</strong></p>
    <p style="font-size: 0.9em; line-height: 1.4; margin: 12px 0;">${highlight2.description}</p>`;
      
      if (highlight2.link) {
        showcase += `    <p>
      <a href="${highlight2.link}" target="_blank">
        <img src="https://img.shields.io/badge/View%20Project-000?style=for-the-badge&logo=firefox&logoColor=white" />
      </a>
    </p>`;
      }
      
      showcase += `  </td>\n`;
    } else {
      showcase += `  <td width="50%"></td>\n`;
    }
    
    showcase += `</tr>\n`;
  }

  showcase += `</table>\n\n`;
  return showcase;
}

function generateStatsSection(projects) {
  const totalProjects = projects.length;
  const languages = new Set(projects.map(p => p.language).filter(Boolean)).size;
  const liveProjects = projects.filter(p => p.live || p.netlify_live).length;

  return `---

<div style="font-size: 1.25rem; font-weight: bold">📊 Stats</div>

<p align="center">
  <img src="https://img.shields.io/badge/Projects-${totalProjects}-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Languages-${languages}-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Live%20Sites-${liveProjects}-orange?style=for-the-badge" />
</p>

`;
}

async function updateReadme() {
  try {
    console.log('🔄 Fetching projects data...');
    const projectsData = await fetchProjectsData();
    
    console.log('🔄 Fetching highlights data...');
    const highlightsData = await fetchHighlightsData();
    
    console.log(`📊 Found ${projectsData.projects.length} projects and ${highlightsData.highlights.length} highlights`);

    // Read current README
    const readmePath = './README.md';
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Generate new sections
    const techStackBadges = generateTechStackBadges(projectsData.projects);
    const highlightsShowcase = generateHighlightsShowcase(highlightsData);
    const statsSection = generateStatsSection(projectsData.projects);

    // Replace tech stack section (between Tech Stack header and next ---)
    const techStackRegex = /(🧰 Tech Stack<\/div>\n\n<p align="center">)([\s\S]*?)(\n<\/p>)/;
    readme = readme.replace(techStackRegex, `$1\n${techStackBadges}\n$3`);

    // Remove any existing showcase/stats sections to prevent duplicates
    readme = readme.replace(/---\n\n<div[^>]*>🚀 (?:Professional Highlights|Featured Projects)<\/div>[\s\S]*?(?=\n---\n<div|---\n<p align="center">[\s\S]*holopin\.me|$)/g, '');
    readme = readme.replace(/---\n\n<div[^>]*>📊 Stats<\/div>[\s\S]*?(?=\n---\n<div|---\n<p align="center">[\s\S]*holopin\.me|$)/g, '');
    
    // Add highlights showcase before the final Holopin section
    const holoPinRegex = /(\n---\n<p align="center">[\s\S]*holopin\.me[\s\S]*<\/p>\n)$/;
    if (holoPinRegex.test(readme)) {
      readme = readme.replace(holoPinRegex, `${highlightsShowcase}${statsSection}$1`);
    } else {
      // If no Holopin section, add at the end
      readme += highlightsShowcase + statsSection;
    }

    // Write updated README
    fs.writeFileSync(readmePath, readme);
    
    console.log('✅ README.md updated successfully!');
    console.log(`   - Updated tech stack with ${new Set(projectsData.projects.map(p => p.language).filter(Boolean)).size} languages`);
    console.log(`   - Added ${highlightsData.highlights.length} professional highlights`);
    console.log(`   - Generated stats section`);

  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the update
updateReadme();