const TweetParser = {
  parse(tweetElement) {
    return {
      text: this.getText(tweetElement),
      author: this.getAuthor(tweetElement),
      mediaAlt: this.getMediaAlt(tweetElement),
      mediaUrls: this.getMediaUrls(tweetElement),
      quotedText: this.getQuotedText(tweetElement),
    };
  },

  getText(el) {
    const textEl = el.querySelector('[data-testid="tweetText"]');
    return textEl ? textEl.innerText.trim() : '';
  },

  getAuthor(el) {
    // User handle is inside a link like /@username
    const links = el.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const match = link.getAttribute('href')?.match(/^\/([A-Za-z0-9_]+)$/);
      if (match && link.closest('[data-testid="User-Name"]')) {
        return match[1];
      }
    }
    return 'unknown';
  },

  getMediaAlt(el) {
    const images = el.querySelectorAll('[data-testid="tweetPhoto"] img');
    const alts = [];
    images.forEach((img) => {
      if (img.alt && img.alt !== 'Image') {
        alts.push(img.alt);
      }
    });
    return alts.length > 0 ? alts.join('; ') : '';
  },

  getMediaUrls(el) {
    const images = el.querySelectorAll('[data-testid="tweetPhoto"] img');
    const urls = [];
    images.forEach((img) => {
      if (img.src) {
        urls.push(img.src);
      }
    });
    return urls;
  },

  getQuotedText(el) {
    const quoted = el.querySelector('[data-testid="quoteTweet"]');
    if (!quoted) return '';
    const textEl = quoted.querySelector('[data-testid="tweetText"]');
    return textEl ? textEl.innerText.trim() : '';
  },
};

window.TweetParser = TweetParser;
