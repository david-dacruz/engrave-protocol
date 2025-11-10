# Engrave Protocol Demo Presentation

This folder contains a Marp-powered markdown presentation showcasing the Engrave Protocol's agentic x402 Solana mempool integration.

## Contents

- `presentation.md` - Main Marp presentation (open in VS Code with Marp extension)
- `interactions/` - Real MCP interaction logs and examples
- `screenshots/` - Visual aids and diagrams
- `assets/` - Images and assets for the presentation

## Viewing the Presentation

### Option 1: VS Code (Recommended)

1. Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension
2. Open `presentation.md` in VS Code
3. Click the Marp preview icon or use `Cmd+K V` (Mac) / `Ctrl+K V` (Windows/Linux)
4. For full-screen presentation mode, click the "Open in Browser" icon

### Option 2: Marp CLI

```bash
# Install Marp CLI
npm install -g @marp-team/marp-cli

# Generate HTML
marp presentation.md -o presentation.html

# Generate PDF
marp presentation.md -o presentation.pdf --pdf

# Start presentation server (live reload)
marp -s presentation.md
```

### Option 3: Export to PowerPoint

```bash
marp presentation.md -o presentation.pptx
```

## Running Live Demos

To run the live demos shown in the presentation:

1. Ensure the API server is running:
   ```bash
   cd ../api
   npm run dev
   ```

2. Make sure you have the MCP wallet configured in `.gemini/settings.json`

3. Test endpoints:
   ```bash
   # Free endpoint
   curl http://localhost:3000/api/v1/mempool/height

   # Paid endpoint (returns 402)
   curl http://localhost:3000/api/v1/mempool/fees
   ```

4. For full MCP demo with Claude CLI:
   ```bash
   claude --print --mcp-config "../.gemini/settings.json" -- "Get current Bitcoin testnet fee recommendations"
   ```

## Presentation Structure

1. **Title & Introduction** - What is Engrave Protocol
2. **The Problem** - Traditional API limitations
3. **The Solution** - x402 micropayments on Solana
4. **Architecture** - Vertical integration flow
5. **Live Demo** - Real MCP interactions
6. **Use Cases** - Practical applications
7. **Technical Deep Dive** - Payment flow details
8. **Results & Impact** - What we achieved
9. **Q&A** - Closing

## Customization

Edit `presentation.md` and modify the YAML frontmatter to customize theme, colors, and styling:

```yaml
---
marp: true
theme: default
paginate: true
backgroundColor: #1a1a1a
color: #ffffff
---
```

## Tips for Presenting

- Use arrow keys or space to navigate slides
- Press `F` for fullscreen mode
- Press `P` for presenter notes view (if supported)
- Each slide is separated by `---`
- Slides with `<!-- _class: lead -->` are title/section slides
