#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const API_URL = 'https://pocket.uft1.com/data/personal-projects.json';

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

function generateProjectsShowcase(projects) {
  // Filter showcase projects and sort by updated_at (most recent first)
  const showcaseProjects = projects
    .filter(p => p.showcase === true)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6); // Show top 6 showcase projects

  if (showcaseProjects.length === 0) {
    return '';
  }

  let showcase = `---

<div style="font-size: 1.25rem; font-weight: bold">🚀 Featured Projects</div>

<table align="center">
<tr>
`;

  showcaseProjects.forEach((project, index) => {
    if (index % 2 === 0 && index > 0) {
      showcase += `</tr>\n<tr>\n`;
    }
    
    const liveUrl = project.live || `https://${project.netlify_live}` || project.repo;
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

  showcase += `</tr>
</table>

`;

  return showcase;
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

async function updateReadme() {
  try {
    console.log('Fetching projects data...');
    const data = await fetchProjectsData();
    const projects = data.projects;

    console.log(`Found ${projects.length} projects`);

    // Read current README
    const readmePath = './README.md';
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Generate new sections
    const techStackBadges = generateTechStackBadges(projects);
    const projectsShowcase = generateProjectsShowcase(projects);
    const statsSection = generateStatsSection(projects);

    // Replace tech stack section (between Tech Stack header and next ---)
    const techStackRegex = /(🧰 Tech Stack<\/div>\n\n<p align="center">)([\s\S]*?)(\n<\/p>)/;
    readme = readme.replace(techStackRegex, `$1\n${techStackBadges}\n$3`);

    // Add projects showcase before the final Holopin section
    const holoPinRegex = /(\n---\n<p align="center">[\s\S]*holopin\.me[\s\S]*<\/p>\n)$/;
    if (holoPinRegex.test(readme)) {
      readme = readme.replace(holoPinRegex, `${projectsShowcase}${statsSection}$1`);
    } else {
      // If no Holopin section, add at the end
      readme += projectsShowcase + statsSection;
    }

    // Write updated README
    fs.writeFileSync(readmePath, readme);
    
    console.log('✅ README.md updated successfully!');
    console.log(`   - Updated tech stack with ${new Set(projects.map(p => p.language).filter(Boolean)).size} languages`);
    console.log(`   - Added ${projects.filter(p => p.showcase).length} featured projects`);
    console.log(`   - Generated stats section`);

  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the update
updateReadme();