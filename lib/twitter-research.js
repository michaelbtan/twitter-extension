async function searchTwitter(tweetText, bearerToken) {
  // Extract key terms from the tweet for search
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
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('Twitter research API error:', response.status);
      return [];
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) return [];

    // Sort by engagement and return top 5 summaries
    const sorted = data.data
      .filter((t) => t.public_metrics)
      .sort(
        (a, b) =>
          (b.public_metrics.like_count + b.public_metrics.retweet_count) -
          (a.public_metrics.like_count + a.public_metrics.retweet_count)
      )
      .slice(0, 5);

    return sorted.map((t) => t.text.substring(0, 200));
  } catch (err) {
    console.warn('Twitter research failed:', err.message);
    return [];
  }
}

function extractSearchQuery(text) {
  // Remove mentions, URLs, and common stop words
  const cleaned = text
    .replace(/@\w+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();

  // Take first ~5 meaningful words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return null;

  return words.slice(0, 5).join(' ');
}
