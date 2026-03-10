(async function () {
  const settings = await Storage.getSettings();
  let defaultTone = settings.defaultTone || 'witty';

  function sendMessageWithTimeout(message, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timed out. Check your API key in extension settings.'));
      }, timeoutMs);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
          reject(new Error('No response from background. Try reloading the extension.'));
        } else {
          resolve(response);
        }
      });
    });
  }

  function processTweet(tweetElement) {
    if (tweetElement.dataset.craftReplyProcessed) return;
    tweetElement.dataset.craftReplyProcessed = 'true';

    const result = UIInjector.injectButton(tweetElement, defaultTone);
    if (!result) return;

    const { btn, toneBtn } = result;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('[CraftReply] Button clicked');

      const container = btn.closest('.craft-reply-container');
      UIInjector.showContextPopover(container, async (contextText) => {
        const tweetData = TweetParser.parse(tweetElement);
        console.log('[CraftReply] Tweet data:', tweetData);
        if (!tweetData.text) {
          UIInjector.showError(tweetElement, 'Could not read tweet text');
          return;
        }

        const tone = toneBtn.dataset.tone || defaultTone;

        UIInjector.setLoading(btn, true);

        try {
          console.log('[CraftReply] Sending message to service worker...');
          const response = await sendMessageWithTimeout({
            type: 'CRAFT_REPLY',
            tweetContext: tweetData,
            tone: tone,
            userContext: contextText,
          });
          console.log('[CraftReply] Response:', response);

          if (response.error) {
            UIInjector.showError(tweetElement, response.error);
            return;
          }

          const replies = response.replies || [response.reply];
          if (replies.length > 1) {
            UIInjector.showReplySelector(container, replies, async (chosen) => {
              await ReplyInserter.insert(tweetElement, chosen);
            });
          } else {
            await ReplyInserter.insert(tweetElement, replies[0]);
          }
        } catch (err) {
          console.error('[CraftReply] Error:', err);
          UIInjector.showError(tweetElement, err.message || 'Failed to craft reply');
        } finally {
          UIInjector.setLoading(btn, false);
        }
      });
    });
  }

  function processAllTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(processTweet);
  }

  console.log('[CraftReply] Content script loaded');

  // Initial scan
  processAllTweets();

  // Watch for dynamically loaded tweets (infinite scroll, SPA nav)
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }
    if (shouldProcess) {
      processAllTweets();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Re-process on SPA navigation
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(processAllTweets, 500);
    }
  });
  urlObserver.observe(document.querySelector('head > title') || document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.defaultTone) {
      defaultTone = changes.defaultTone.newValue;
    }
  });
})();
