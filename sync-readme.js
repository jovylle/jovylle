#!/usr/bin/env node

const fs = require('fs');

const PROJECTS_API_URLS = [
  process.env.PROJECTS_API_URL,
  'https://pocket.uft1.com/data/personal-projects.json'
].filter(Boolean);

const HIGHLIGHTS_API_URLS = [
  process.env.HIGHLIGHTS_API_URL,
  'https://pocket.uft1.com/data/highlights.json',
  'https://jovylle.com/data/highlights.json'
].filter(Boolean);

const REACTION_API_URLS = [
  process.env.REACTION_API_URL,
  'https://raw.githubusercontent.com/jovylle/playbase/master/reaction/top.json'
].filter(Boolean);

const REQUEST_TIMEOUT_MS = 20000;
const MAX_ATTEMPTS_PER_URL = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504, 522, 524, 530]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT'
]);
const REQUEST_HEADERS = {
  'User-Agent': 'jovylle-readme-sync/1.0 (+https://github.com/jovylle/jovylle)',
  'Accept': 'application/json,text/plain;q=0.9,*/*;q=0.8'
};

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  if (error?.name === 'AbortError') {
    return true;
  }

  if (error?.status && RETRYABLE_STATUS_CODES.has(error.status)) {
    return true;
  }

  const code = error?.code || error?.cause?.code;
  return code ? RETRYABLE_ERROR_CODES.has(code) : false;
}

async function fetchJsonFromUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });

    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText || '<none>'}`);
      error.status = response.status;
      error.responseSnippet = body.trim().replace(/\s+/g, ' ').slice(0, 160);
      throw error;
    }

    if (!body.trim()) {
      throw new Error('Empty response from API');
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}. Response: ${body.substring(0, 100)}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithFallback(label, urls) {
  const failures = [];

  for (const url of urls) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_URL; attempt += 1) {
      try {
        return await fetchJsonFromUrl(url);
      } catch (error) {
        const retryable = isRetryableError(error);
        const detail = error.responseSnippet ? ` (${error.responseSnippet})` : '';

        failures.push({
          transient: retryable,
          message: `${url} [attempt ${attempt}/${MAX_ATTEMPTS_PER_URL}]: ${error.message}${detail}`
        });

        if (retryable && attempt < MAX_ATTEMPTS_PER_URL) {
          console.warn(`⚠️ ${label} fetch failed from ${url} (${error.message}). Retrying...`);
          await sleep(1500 * attempt);
          continue;
        }

        break;
      }
    }
  }

  const finalError = new Error(`Failed to fetch ${label}: ${failures.map((failure) => failure.message).join(' | ')}`);
  finalError.transient = failures.length > 0 && failures.every((failure) => failure.transient);
  throw finalError;
}

async function fetchProjectsData() {
  return fetchJsonWithFallback('projects data', PROJECTS_API_URLS);
}

async function fetchHighlightsData() {
  return fetchJsonWithFallback('highlights data', HIGHLIGHTS_API_URLS);
}

async function fetchReactionData() {
  return fetchJsonWithFallback('reaction data', REACTION_API_URLS);
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

<div style="font-size: 1.25rem; font-weight: bold">🚀 Techs and Solutions</div>

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
  <a href="https://fast.jovylle.com" target="_blank" style="text-decoration: none;">
    <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; padding: 16px 32px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; text-align: center; display: inline-block; box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4); transition: all 0.3s ease; border: 3px solid #ff4757;">
      🎮 PLAY GAME NOW! ⚡
    </div>
  </a>
  <br>
  <div style="margin-top: 12px; font-size: 0.85em; color: #666; background: #f8f9fa; padding: 6px 12px; border-radius: 20px; display: inline-block;">
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
  <small style="color: #2F81F7; font-weight: 500;">🏆 All-time leaderboard • Every saved run stays in history</small>
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

    // Helper to upsert a section between explicit markers
    function upsertSection(src, startMarker, endMarker, content) {
      const startIdx = src.indexOf(startMarker);
      const endIdx = src.indexOf(endMarker);
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        return (
          src.slice(0, startIdx + startMarker.length) +
          "\n" + content.trim() + "\n" +
          src.slice(endIdx)
        );
      }
      // If markers not present, append at end with separators
      const block = `\n\n${startMarker}\n${content.trim()}\n${endMarker}`;
      return src.trimEnd() + block + "\n";
    }

    // 1) Tech Stack: keep existing logic (lighter change) but guard with try
    try {
      const techStackRegex = /(🧰 Tech Stack<\/div>\n\n<p align="center">)([\s\S]*?)(\n<\/p>)/;
      if (techStackRegex.test(readme)) {
        readme = readme.replace(techStackRegex, `$1\n${techStackBadges}\n$3`);
      }
    } catch (_) {}

    // 2) Techs & Solutions (formerly Professional Highlights)
    const HIGHLIGHTS_START = '<!-- START: TECHS_SOLUTIONS -->';
    const HIGHLIGHTS_END = '<!-- END: TECHS_SOLUTIONS -->';
    readme = upsertSection(readme, HIGHLIGHTS_START, HIGHLIGHTS_END, highlightsShowcase);

    // 3) Reaction Leaderboard
    const LEADER_START = '<!-- START: REACTION_LEADERBOARD -->';
    const LEADER_END = '<!-- END: REACTION_LEADERBOARD -->';
    readme = upsertSection(readme, LEADER_START, LEADER_END, reactionLeaderboard);

    // 4) Stats
    const STATS_START = '<!-- START: PROFILE_STATS -->';
    const STATS_END = '<!-- END: PROFILE_STATS -->';
    readme = upsertSection(readme, STATS_START, STATS_END, statsSection);

    // Write updated README
    fs.writeFileSync(readmePath, readme);
    
    console.log('✅ README.md updated successfully!');
    console.log(`   - Updated tech stack with ${new Set(projectsData.projects.map(p => p.language).filter(Boolean)).size} languages`);
    console.log(`   - Added ${highlightsData.highlights.length} highlights section`);
    console.log(`   - Added reaction game leaderboard with ${reactionData.top.length} scores`);
    console.log(`   - Generated stats section`);

  } catch (error) {
    if (process.env.GITHUB_ACTIONS === 'true' && error.transient) {
      console.warn('⚠️ Skipping README update because the upstream data source is temporarily unavailable.');
      console.warn(`   ${error.message}`);
      return;
    }

    console.error('❌ Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the update
updateReadme();