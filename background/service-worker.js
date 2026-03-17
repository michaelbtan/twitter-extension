// ── Storage ──
const Storage = {
  async get(keys) {
    return chrome.storage.local.get(keys);
  },
  async set(data) {
    return chrome.storage.local.set(data);
  },
  async getSettings() {
    const defaults = {
      apiProvider: 'claude',
      claudeApiKey: '',
      openaiApiKey: '',
      claudeModel: 'claude-sonnet-4-6',
      openaiModel: 'gpt-5.4',
      defaultTone: 'witty',
      twitterBearerToken: '',
      researchEnabled: false,
    };
    const stored = await this.get(Object.keys(defaults));
    return { ...defaults, ...stored };
  },
};

// ── AI API Clients ──
async function callClaudeAPI(prompt, systemPrompt, settings, imageUrls = []) {
  const content = imageUrls.length > 0
    ? [
        { type: 'text', text: prompt },
        ...imageUrls.map((url) => ({ type: 'image', source: { type: 'url', url } })),
      ]
    : prompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.claudeApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.claudeModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function callOpenAIAPI(prompt, systemPrompt, settings, imageUrls = []) {
  const userContent = imageUrls.length > 0
    ? [
        { type: 'text', text: prompt },
        ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
      ]
    : prompt;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.openaiModel,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callAI(prompt, systemPrompt, settings, imageUrls = []) {
  if (settings.apiProvider === 'openai') {
    return callOpenAIAPI(prompt, systemPrompt, settings, imageUrls);
  }
  return callClaudeAPI(prompt, systemPrompt, settings, imageUrls);
}

// ── Prompt Builder ──
const TONE_INSTRUCTIONS = {
  witty: `You are sharp, clever, and quick with wordplay. Use unexpected angles, irony, or humor to make your point. Think late-night talk show host — smart but accessible. Puns are acceptable if genuinely clever. Avoid forced humor or dad jokes.`,
  supportive: `You are warm, encouraging, and genuine. Validate the poster's perspective or effort. Add constructive insight rather than empty praise. Think trusted friend who also happens to be insightful. Avoid toxic positivity or vague cheerleading.`,
  contrarian: `You respectfully push back with a well-reasoned alternative take. Play devil's advocate with substance, not snark. Present your disagreement as food for thought, not an attack. Think skilled debate partner. Avoid being hostile or dismissive.`,
  informative: `You add valuable context, data, or a lesser-known perspective. Be the person who makes the thread smarter. Lead with the insight, not "Actually..." or "Fun fact:". Think knowledgeable colleague sharing over coffee. Avoid lecturing or condescension.`,
  provocative: `You challenge assumptions and spark discussion with bold takes. Be edgy but thoughtful — provoke thinking, not anger. Push boundaries without crossing into meanness. Think intellectual provocateur. Avoid trolling or rage-bait.`,
  analytical: `You break down the topic with structured thinking. Identify patterns, implications, or overlooked angles. Be precise but not dry. Think strategic consultant in 280 characters. Avoid jargon or unnecessary complexity.`,
  question: `Reply with a genuinely curious, thought-provoking question that pulls at an interesting thread in the tweet. The question should feel natural and make the author want to respond. Avoid rhetorical questions or ones with obvious answers.`,
  agreeable: `Sincerely agree and build on the point. Add a concrete example, a stronger implication, or a personal angle that shows you genuinely get it. Sound like an ally who sharpens the argument, not a yes-man.`,
  disagreeable: `Sincerely and respectfully disagree. Name the specific point you push back on and offer a cleaner counter-argument or overlooked tradeoff. Be direct and honest, not hostile.`,
};

function buildPrompt(tweetContext, tone, researchContext, userContext) {
  const systemPrompt = `You are a social media engagement expert who writes authentic, high-quality replies on X/Twitter.

RULES — follow these strictly:
- Output EXACTLY 3 distinct reply options as a JSON array of strings: ["reply1", "reply2", "reply3"]
- Each reply must be under 280 characters.
- Each reply should use a different angle or structure.
- Never use hashtags.
- Never start with "I" as the first word.
- No corporate-speak, buzzwords, or marketing language.
- No sycophantic openers like "Great point!" or "Love this!"
- Sound like a real, thoughtful human — not a bot or brand account.
- Match the energy and register of the original tweet.
- Output ONLY the JSON array. No other text, no explanation, no markdown fences.

TONE: ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.witty}`;

  let userPrompt = `Write a reply to this tweet:

Author: @${tweetContext.author}
Tweet: "${tweetContext.text}"`;

  if (tweetContext.quotedText) {
    userPrompt += `\nQuoted tweet: "${tweetContext.quotedText}"`;
  }
  if (tweetContext.mediaAlt) {
    userPrompt += `\nImage description: ${tweetContext.mediaAlt}`;
  }
  if (researchContext && researchContext.length > 0) {
    userPrompt += `\n\nRecent context about this topic (weave in naturally, do not cite sources):`;
    researchContext.forEach((item) => {
      userPrompt += `\n- ${item}`;
    });
  }

  if (tweetContext.mediaUrls && tweetContext.mediaUrls.length > 0) {
    userPrompt += `\nThe post includes images (attached). Consider the visual content when crafting your reply.`;
  }

  if (userContext) {
    userPrompt += `\n\nAdditional context from user: ${userContext}`;
  }

  return { systemPrompt, userPrompt };
}

// ── Twitter Research ──
function extractSearchQuery(text) {
  const cleaned = text
    .replace(/@\w+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return null;
  return words.slice(0, 5).join(' ');
}

async function searchTwitter(tweetText, bearerToken) {
  const query = extractSearchQuery(tweetText);
  if (!query) return [];

  try {
    const params = new URLSearchParams({
      query: query,
      max_results: '10',
      'tweet.fields': 'public_metrics,text',
      sort_order: 'relevancy',
    });

    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params}`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.data || data.data.length === 0) return [];

    return data.data
      .filter((t) => t.public_metrics)
      .sort(
        (a, b) =>
          b.public_metrics.like_count +
          b.public_metrics.retweet_count -
          (a.public_metrics.like_count + a.public_metrics.retweet_count)
      )
      .slice(0, 5)
      .map((t) => t.text.substring(0, 200));
  } catch {
    return [];
  }
}

// ── Message Handler ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CRAFT_REPLY') {
    handleCraftReply(message)
      .then((result) => sendResponse(result))
      .catch((err) => {
        console.error('Craft reply error:', err);
        sendResponse({ error: err.message || 'Unknown error' });
      });
    return true;
  }
});

async function handleCraftReply(message) {
  const settings = await Storage.getSettings();

  const apiKey =
    settings.apiProvider === 'openai' ? settings.openaiApiKey : settings.claudeApiKey;
  if (!apiKey) {
    return {
      error: `No ${settings.apiProvider === 'openai' ? 'OpenAI' : 'Claude'} API key configured. Open extension settings.`,
    };
  }

  let researchContext = [];
  if (settings.researchEnabled && settings.twitterBearerToken) {
    try {
      researchContext = await searchTwitter(
        message.tweetContext.text,
        settings.twitterBearerToken
      );
    } catch {
      // non-fatal
    }
  }

  const { systemPrompt, userPrompt } = buildPrompt(
    message.tweetContext,
    message.tone,
    researchContext,
    message.userContext
  );

  const imageUrls = message.tweetContext.mediaUrls || [];
  const raw = await callAI(userPrompt, systemPrompt, settings, imageUrls);

  let replies;
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      replies = parsed.map((r) => String(r).replace(/^["']|["']$/g, '').trim()).filter(Boolean).slice(0, 3);
    }
  } catch {
    // JSON parse failed
  }

  // Fallback: wrap raw text as single reply
  if (!replies || replies.length === 0) {
    const fallback = raw.replace(/^["']|["']$/g, '').trim();
    replies = [fallback];
  }

  return { replies };
}
