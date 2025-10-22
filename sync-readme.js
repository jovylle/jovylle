#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const API_URL = 'https://pocket.uft1.com/data/personal-projects.json';
const HIGHLIGHTS_URL = 'https://pocket.uft1.com/data/highlights.json';
const REACTION_API_URL = 'https://raw.githubusercontent.com/jovylle/playbase/master/reaction/top.json';

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

async function fetchReactionData() {
  return new Promise((resolve, reject) => {
    https.get(REACTION_API_URL, (res) => {
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

function generateReactionLeaderboard(reactionData) {
  const topScores = reactionData.top.slice(0, 5); // Show top 5
  const lastUpdated = new Date(reactionData.last_updated).toLocaleDateString();
  const bestScore = Math.min(...reactionData.top.map(s => s.ms));

  let leaderboard = `---

<div align="center" style="margin-bottom: 20px;">
  <div style="font-size: 1.5rem; font-weight: bold; color: #2F81F7;">⚡ Reaction Game Leaderboard</div>
</div>

<div align="center" style="margin: 20px 0;">
  <a href="https://fast.jovylle.com" target="_blank">
    <img src="./game1.png" alt="Reaction Test Game - Click when it turns RED!" style="max-width: 300px; width: 50%; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 16px;" />
  </a>
  <br>
  <a href="https://fast.jovylle.com" target="_blank">
    <img src="https://img.shields.io/badge/🎮%20Play%20Game-FF6B6B?style=for-the-badge&logo=gamepad2&logoColor=white&labelColor=FF6B6B&color=white" />
  </a>
  <br>
  <div style="margin-top: 8px; font-size: 0.85em; color: #666; background: #f8f9fa; padding: 6px 12px; border-radius: 20px; display: inline-block;">
    🏆 Best: ${bestScore}ms • 📅 Updated: ${lastUpdated}
  </div>
</div>

<table align="center" style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <thead>
    <tr style="background: #f6f8fa;">
      <th style="padding: 12px; text-align: center; border: 1px solid #d0d7de;">🏆</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #d0d7de;">Player</th>
      <th style="padding: 12px; text-align: center; border: 1px solid #d0d7de;">Time</th>
      <th style="padding: 12px; text-align: center; border: 1px solid #d0d7de;">Date</th>
    </tr>
  </thead>
  <tbody>`;

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  
  topScores.forEach((score, index) => {
    const date = new Date(score.timestamp).toLocaleDateString();
    const medal = medals[index] || `${index + 1}️⃣`;
    const isBestScore = score.ms === bestScore;
    const rowBg = index % 2 === 0 ? '#ffffff' : '#f6f8fa';
    const scoreColor = score.ms < 200 ? '#28a745' : score.ms < 300 ? '#ffc107' : '#dc3545';
    
    leaderboard += `
    <tr style="background: ${rowBg};">
      <td style="padding: 12px; text-align: center; border: 1px solid #d0d7de; font-size: 1.2em;">${medal}</td>
      <td style="padding: 12px; text-align: left; border: 1px solid #d0d7de; font-weight: 500;">${score.playerName}</td>
      <td style="padding: 12px; text-align: center; border: 1px solid #d0d7de; font-weight: bold; color: ${scoreColor}; ${isBestScore ? 'background: #e6ffed;' : ''}">${score.ms}ms</td>
      <td style="padding: 12px; text-align: center; border: 1px solid #d0d7de; font-size: 0.9em; color: #666;">${date}</td>
    </tr>`;
  });

  leaderboard += `
  </tbody>
</table>

<p align="center" style="margin-top: 20px; font-size: 0.85em; color: #666;">
  <small style="color: #ff6b6b; font-weight: 500;">🔄 Resets every 3 months</small>
</p>

`;

  return leaderboard;
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
    
    console.log('🔄 Fetching reaction game data...');
    const reactionData = await fetchReactionData();
    
    console.log(`📊 Found ${projectsData.projects.length} projects, ${highlightsData.highlights.length} highlights, and ${reactionData.top.length} reaction scores`);

    // Read current README
    const readmePath = './README.md';
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Generate new sections
    const techStackBadges = generateTechStackBadges(projectsData.projects);
    const highlightsShowcase = generateHighlightsShowcase(highlightsData);
    const reactionLeaderboard = generateReactionLeaderboard(reactionData);
    const statsSection = generateStatsSection(projectsData.projects);

    // Replace tech stack section (between Tech Stack header and next ---)
    const techStackRegex = /(🧰 Tech Stack<\/div>\n\n<p align="center">)([\s\S]*?)(\n<\/p>)/;
    readme = readme.replace(techStackRegex, `$1\n${techStackBadges}\n$3`);

    // Remove any existing showcase/stats/leaderboard sections to prevent duplicates
    readme = readme.replace(/---\n\n<div[^>]*>🚀 (?:Professional Highlights|Featured Projects)<\/div>[\s\S]*?(?=\n---\n<div|---\n<p align="center">[\s\S]*holopin\.me|$)/g, '');
    readme = readme.replace(/---\n\n<div[^>]*>⚡ Reaction Game Leaderboard<\/div>[\s\S]*?(?=\n---\n<div|---\n<p align="center">[\s\S]*holopin\.me|$)/g, '');
    readme = readme.replace(/---\n\n<div[^>]*>📊 Stats<\/div>[\s\S]*?(?=\n---\n<div|---\n<p align="center">[\s\S]*holopin\.me|$)/g, '');
    
    // Add sections before the final Holopin section
    const holoPinRegex = /(\n---\n<p align="center">[\s\S]*holopin\.me[\s\S]*<\/p>\n)$/;
    if (holoPinRegex.test(readme)) {
      readme = readme.replace(holoPinRegex, `${highlightsShowcase}${reactionLeaderboard}${statsSection}$1`);
    } else {
      // If no Holopin section, add at the end
      readme += highlightsShowcase + reactionLeaderboard + statsSection;
    }

    // Write updated README
    fs.writeFileSync(readmePath, readme);
    
    console.log('✅ README.md updated successfully!');
    console.log(`   - Updated tech stack with ${new Set(projectsData.projects.map(p => p.language).filter(Boolean)).size} languages`);
    console.log(`   - Added ${highlightsData.highlights.length} professional highlights`);
    console.log(`   - Added reaction game leaderboard with ${reactionData.top.length} scores`);
    console.log(`   - Generated stats section`);

  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the update
updateReadme();