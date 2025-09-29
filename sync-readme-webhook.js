#!/usr/bin/env node

// This version can be triggered via HTTP webhook from cron-job.org
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

const API_URL = 'https://pocket.uft1.com/data/personal-projects.json';

// ... (same helper functions as before)
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function generateTechStackBadges(projects) {
  const languages = [...new Set(
    projects.map(p => p.language).filter(lang => lang && lang !== null)
  )].sort();

  return languages.map(lang => {
    const color = languageColors[lang] || '000000';
    const logoName = lang.toLowerCase().replace(/\+/g, 'plus');
    return `  <img src="https://img.shields.io/badge/${encodeURIComponent(lang)}-${color}?style=for-the-badge&logo=${logoName}&logoColor=white" />`;
  }).join('\n');
}

function generateProjectsShowcase(projects) {
  const showcaseProjects = projects
    .filter(p => p.showcase === true)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6);

  if (showcaseProjects.length === 0) return '';

  let showcase = `---

<div style="font-size: 1.25rem; font-weight: bold">🚀 Featured Projects</div>

<table align="center">
<tr>
`;

  showcaseProjects.forEach((project, index) => {
    if (index % 2 === 0 && index > 0) {
      showcase += `</tr>\n<tr>\n`;
    }
    
    const liveUrl = project.live || (project.netlify_live ? `https://${project.netlify_live}` : project.repo);
    const description = project.description || 'No description available';
    
    showcase += `  <td align="center" width="50%">
    <h3><a href="${liveUrl}" target="_blank">${project.title}</a></h3>
    <p><strong>Language:</strong> ${project.language || 'Mixed'}</p>
    <p>${description}</p>
    <p>
      <a href="${liveUrl}" target="_blank">
        <img src="https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge&logo=firefox&logoColor=white" />
      </a>
      <a href="${project.repo}" target="_blank">
        <img src="https://img.shields.io/badge/Code-181717?style=for-the-badge&logo=github&logoColor=white" />
      </a>
    </p>
  </td>
`;
  });

  return showcase + `</tr>\n</table>\n\n`;
}

function generateStatsSection(projects) {
  const totalProjects = projects.length;
  const languages = new Set(projects.map(p => p.language).filter(Boolean)).size;
  const liveProjects = projects.filter(p => p.live || p.netlify_live).length;
  const totalStars = projects.reduce((sum, p) => sum + (p.stars || 0), 0);

  return `---

<div style="font-size: 1.25rem; font-weight: bold">📊 Stats</div>

<p align="center">
  <img src="https://img.shields.io/badge/Projects-${totalProjects}-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Languages-${languages}-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Live%20Sites-${liveProjects}-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/GitHub%20Stars-${totalStars}-yellow?style=for-the-badge" />
</p>

`;
}

async function commitAndPush() {
  return new Promise((resolve, reject) => {
    const commands = [
      'git add README.md',
      'git commit -m "🤖 Auto-update README with latest projects data"',
      'git push'
    ];
    
    exec(commands.join(' && '), (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes('nothing to commit')) {
          console.log('No changes to commit');
          resolve();
        } else {
          reject(error);
        }
      } else {
        console.log('Changes committed and pushed successfully');
        resolve();
      }
    });
  });
}

async function updateReadme() {
  try {
    console.log('🔄 Fetching projects data...');
    const data = await fetchProjectsData();
    const projects = data.projects;

    console.log(`📊 Found ${projects.length} projects`);

    const readmePath = './README.md';
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Generate sections
    const techStackBadges = generateTechStackBadges(projects);
    const projectsShowcase = generateProjectsShowcase(projects);
    const statsSection = generateStatsSection(projects);

    // Update tech stack
    const techStackRegex = /(🧰 Tech Stack<\/div>\n\n<p align="center">)([\s\S]*?)(\n<\/p>)/;
    readme = readme.replace(techStackRegex, `$1\n${techStackBadges}\n$3`);

    // Add showcase and stats
    const holoPinRegex = /(\n---\n<p align="center">[\s\S]*holopin\.me[\s\S]*<\/p>\n)$/;
    if (holoPinRegex.test(readme)) {
      readme = readme.replace(holoPinRegex, `${projectsShowcase}${statsSection}$1`);
    } else {
      readme += projectsShowcase + statsSection;
    }

    fs.writeFileSync(readmePath, readme);
    
    console.log('✅ README.md updated successfully!');
    console.log(`   - Tech stack: ${new Set(projects.map(p => p.language).filter(Boolean)).size} languages`);
    console.log(`   - Featured: ${projects.filter(p => p.showcase).length} projects`);

    // Auto-commit if running in CI or with --commit flag
    if (process.env.CI || process.argv.includes('--commit')) {
      await commitAndPush();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateReadme();