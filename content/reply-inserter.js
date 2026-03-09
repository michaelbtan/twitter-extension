const ReplyInserter = {
  async insert(tweetElement, replyText) {
    // Click the native reply button to open the reply box
    const replyBtn = tweetElement.querySelector('[data-testid="reply"]');
    if (replyBtn) {
      replyBtn.click();
      // Wait for reply box to appear
      await this.waitForReplyBox();
    }

    const editor = document.querySelector(
      '[data-testid="tweetTextarea_0"], [data-testid="tweetTextarea_0_label"]'
    );
    if (!editor) {
      // Try the reply compose area as fallback
      const composeArea = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (!composeArea) {
        throw new Error('Could not find reply box');
      }
    }

    // Find the contenteditable div
    const editableDiv = document.querySelector(
      '[data-testid="tweetTextarea_0"] [contenteditable="true"], ' +
      '[contenteditable="true"][role="textbox"]'
    );

    if (!editableDiv) {
      throw new Error('Could not find editable reply area');
    }

    // Focus the editor
    editableDiv.focus();

    // Strategy 1: execCommand (works best with DraftJS)
    const inserted = document.execCommand('insertText', false, replyText);
    if (inserted) return true;

    // Strategy 2: Clipboard paste simulation
    try {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', replyText);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });
      editableDiv.dispatchEvent(pasteEvent);
      return true;
    } catch {
      // Fall through to strategy 3
    }

    // Strategy 3: Direct text insertion with input event
    editableDiv.textContent = replyText;
    editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  },

  waitForReplyBox(timeout = 3000) {
    return new Promise((resolve, reject) => {
      const selector = '[data-testid="tweetTextarea_0"], [contenteditable="true"][role="textbox"]';
      if (document.querySelector(selector)) {
        // Small delay for the editor to fully initialize
        setTimeout(resolve, 300);
        return;
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          setTimeout(resolve, 300);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        // Resolve anyway — the box might have appeared
        resolve();
      }, timeout);
    });
  },
};

window.ReplyInserter = ReplyInserter;
