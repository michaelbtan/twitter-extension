# Craft Reply for X

A Chrome extension that generates AI-powered replies for X/Twitter. Click "Craft Reply" on any tweet to get 3 reply options in your chosen tone, then pick the one you like best.

## Features

- **3 reply options** per generation — choose the one that fits best
- **6 tone presets**: Witty, Supportive, Contrarian, Informative, Provocative, Analytical
- **AI providers**: Claude (Anthropic) or OpenAI — bring your own API key
- **Optional context**: Add custom context before generating to steer the reply
- **Topic research** (optional): Uses Twitter API to pull recent context about the topic
- **Dark mode support**: Matches X's Dim and Lights Out themes automatically

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `twitter-extension` folder
6. The extension icon should appear in your toolbar

## Setup

1. Click the extension icon in the Chrome toolbar to open settings
2. Choose your AI provider (Claude or OpenAI)
3. Enter your API key
   - **Claude**: Get a key at [console.anthropic.com](https://console.anthropic.com/)
   - **OpenAI**: Get a key at [platform.openai.com](https://platform.openai.com/)
4. Select a model and default tone
5. (Optional) Enable topic research by providing a Twitter Bearer Token
6. Click **Save Settings**

## Usage

1. Go to [x.com](https://x.com) (or twitter.com)
2. Find any tweet — a **Craft Reply** button appears in the action bar
3. Click the tone label next to the button to change tones (Witty, Supportive, etc.)
4. Click **Craft Reply** — a context popover appears where you can optionally add steering context
5. Click **Generate** (or press Enter)
6. A panel appears with 3 reply options showing character counts
7. Click the reply you like — it gets inserted into the reply box
8. Close the panel or click outside to dismiss without selecting

## Project Structure

```
twitter-extension/
├── manifest.json              # Extension manifest (MV3)
├── background/
│   └── service-worker.js      # API calls, prompt building, message handling
├── content/
│   ├── content.js             # Main content script — button clicks, response handling
│   ├── content.css            # All extension styles (light + dark mode)
│   ├── tweet-parser.js        # Extracts tweet text, author, media, thread context
│   ├── ui-injector.js         # Injects buttons, popovers, and reply selector UI
│   └── reply-inserter.js      # Inserts chosen reply into X's reply composer
├── lib/
│   ├── api-client.js          # Claude and OpenAI API client functions
│   ├── prompt-builder.js      # System prompts and user prompt construction
│   ├── storage.js             # Chrome storage wrapper
│   └── twitter-research.js    # Twitter search API for topic research
├── popup/
│   ├── popup.html             # Settings popup UI
│   ├── popup.js               # Settings save/load logic
│   └── popup.css              # Popup styles
└── icons/                     # Extension icons (16, 32, 48, 128px + SVG)
```

## Permissions

- **storage**: Saves your settings (API keys, preferences) locally
- **activeTab**: Accesses the current tab to inject the UI
- **Host permissions**: API calls to Anthropic, OpenAI, and Twitter endpoints
