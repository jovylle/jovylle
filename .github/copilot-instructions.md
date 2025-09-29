# GitHub Profile Repository Instructions

This is Jovylle's personal GitHub profile repository (username/username special repo that displays on their profile).

## Repository Purpose & Structure

**Primary Goal:** Showcase Jovylle's professional identity as a fullstack web developer (JS/PHP/Vue/React/Laravel, 8+ years experience)

```
README.md          # Main profile content (displays on github.com/jovylle)
assets/            # Supporting files
├── techstack.svg  # Custom tech stack visualization 
header.png         # Profile header image
```

## Content Guidelines

### README.md Patterns
- **Header**: Centered name + title with HTML styling for emphasis
- **Portfolio CTA**: Prominent "Visit Portfolio" badge linking to jovylle.com
- **Personal Voice**: Casual, authentic tone ("Ctrl+Z is my best friend", "I like breaking things apart")
- **Tech Stack**: Badge-style shields.io images in centered grid layout
- **External Integration**: Holopin badges for achievements/certifications

### Visual Elements
- Use shields.io badges with consistent styling: `style=for-the-badge`
- Color schemes: Dark backgrounds with contrasting logos
- Center-aligned layouts for visual impact
- Mix of custom SVGs (`techstack.svg`) and external badge services

## Common Tasks

### Adding New Technologies
When adding tech to the stack:
1. Find appropriate shields.io badge with matching style
2. Add to the centered paragraph block in README.md
3. Consider updating `assets/techstack.svg` if it's used elsewhere

### Portfolio Updates
- Portfolio links point to `https://jovylle.com`
- Maintain consistent branding across profile elements
- Update experience years in the subtitle when appropriate

### External Service Integration
- Holopin badges: Use `https://holopin.me/jovylle` format
- All external images should have proper alt text and sizing

## Development Notes

This is a content-focused repository, not a code project:
- No build process or dependencies
- Changes are direct markdown/asset updates
- Focus on visual presentation and professional messaging
- Optimize for GitHub's README rendering engine