const TONES = [
  { value: 'witty', label: 'Witty' },
  { value: 'supportive', label: 'Supportive' },
  { value: 'contrarian', label: 'Contrarian' },
  { value: 'informative', label: 'Informative' },
  { value: 'provocative', label: 'Provocative' },
  { value: 'analytical', label: 'Analytical' },
];

const UIInjector = {
  injectButton(tweetElement, defaultTone) {
    const actionBar = tweetElement.querySelector('[role="group"]');
    if (!actionBar || actionBar.querySelector('.craft-reply-btn')) return;

    const container = document.createElement('div');
    container.className = 'craft-reply-container';

    // Main button
    const btn = document.createElement('button');
    btn.className = 'craft-reply-btn';
    btn.setAttribute('aria-label', 'Craft AI Reply');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" class="craft-reply-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-1-1 4-4-4-4 1-1 5 5-5 5z" fill="currentColor"/>
      </svg>
      <span class="craft-reply-label">Craft Reply</span>
    `;

    // Tone selector dropdown
    const toneBtn = document.createElement('button');
    toneBtn.className = 'craft-reply-tone-btn';
    toneBtn.textContent = this.getToneLabel(defaultTone || 'witty');
    toneBtn.dataset.tone = defaultTone || 'witty';

    const dropdown = document.createElement('div');
    dropdown.className = 'craft-reply-dropdown';
    dropdown.style.display = 'none';

    TONES.forEach((tone) => {
      const option = document.createElement('div');
      option.className = 'craft-reply-dropdown-item';
      if (tone.value === (defaultTone || 'witty')) {
        option.classList.add('active');
      }
      option.textContent = tone.label;
      option.dataset.tone = tone.value;
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        toneBtn.textContent = tone.label;
        toneBtn.dataset.tone = tone.value;
        dropdown.querySelectorAll('.craft-reply-dropdown-item').forEach((item) =>
          item.classList.remove('active')
        );
        option.classList.add('active');
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(option);
    });

    toneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    container.appendChild(btn);
    container.appendChild(toneBtn);
    container.appendChild(dropdown);
    actionBar.appendChild(container);

    return { btn, toneBtn };
  },

  setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.querySelector('.craft-reply-label').textContent = 'Crafting...';
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.querySelector('.craft-reply-label').textContent = 'Craft Reply';
      btn.disabled = false;
    }
  },

  showError(tweetElement, message) {
    let toast = tweetElement.querySelector('.craft-reply-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'craft-reply-toast';
      tweetElement.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 4000);
  },

  showContextPopover(container, onSubmit) {
    // Close any existing popover
    const existing = document.querySelector('.craft-reply-popover');
    if (existing) {
      existing.remove();
      return;
    }

    const popover = document.createElement('div');
    popover.className = 'craft-reply-popover';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add context (optional)...';
    textarea.rows = 3;

    const generateBtn = document.createElement('button');
    generateBtn.className = 'craft-reply-popover-generate';
    generateBtn.textContent = 'Generate';

    popover.appendChild(textarea);
    popover.appendChild(generateBtn);
    document.body.appendChild(popover);

    // Position popover above the Craft Reply button
    const rect = container.getBoundingClientRect();
    const popoverWidth = 280;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    // Clamp horizontally to viewport
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) left = 12;
    popover.style.left = left + 'px';

    // Measure height after appending, then place above
    const popoverHeight = popover.offsetHeight;
    let top = rect.top - popoverHeight - 6;
    // If it would go above the viewport, show below instead
    if (top < 8) {
      top = rect.bottom + 6;
    }
    popover.style.top = top + 'px';

    textarea.focus();

    function submit() {
      const text = textarea.value.trim();
      popover.remove();
      onSubmit(text);
    }

    generateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      submit();
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });

    // Dismiss on outside click (next tick to avoid immediate dismiss)
    setTimeout(() => {
      const dismiss = (e) => {
        if (!popover.contains(e.target)) {
          popover.remove();
          document.removeEventListener('click', dismiss, true);
        }
      };
      document.addEventListener('click', dismiss, true);
    }, 0);
  },

  showReplySelector(container, replies, onSelect) {
    // Remove any existing selector
    const existing = document.querySelector('.craft-reply-selector');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'craft-reply-selector-overlay';

    const panel = document.createElement('div');
    panel.className = 'craft-reply-selector';

    // Header
    const header = document.createElement('div');
    header.className = 'craft-reply-selector-header';
    const title = document.createElement('span');
    title.textContent = 'Choose a reply';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'craft-reply-selector-close';
    closeBtn.innerHTML = '&times;';
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Reply options
    const list = document.createElement('div');
    list.className = 'craft-reply-selector-list';

    replies.forEach((text, i) => {
      const card = document.createElement('div');
      card.className = 'craft-reply-selector-option';

      const replyText = document.createElement('div');
      replyText.className = 'craft-reply-selector-text';
      replyText.textContent = text;

      const meta = document.createElement('div');
      meta.className = 'craft-reply-selector-meta';
      const charCount = document.createElement('span');
      charCount.className = 'craft-reply-selector-chars';
      if (text.length > 280) charCount.classList.add('over-limit');
      charCount.textContent = `${text.length}/280`;
      const label = document.createElement('span');
      label.className = 'craft-reply-selector-label';
      label.textContent = `Option ${i + 1}`;
      meta.appendChild(label);
      meta.appendChild(charCount);

      card.appendChild(replyText);
      card.appendChild(meta);

      card.addEventListener('click', () => {
        card.classList.add('selected');
        setTimeout(() => {
          cleanup();
          onSelect(text);
        }, 200);
      });

      list.appendChild(card);
    });

    panel.appendChild(list);

    // Position near the button
    const rect = container.getBoundingClientRect();
    let top = rect.top - 8;
    let left = rect.left;

    // Clamp to viewport
    const panelWidth = 340;
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }
    if (left < 16) left = 16;

    panel.style.top = `${Math.max(16, top)}px`;
    panel.style.left = `${left}px`;
    // Adjust after render if it goes below viewport
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      if (panelRect.bottom > window.innerHeight - 16) {
        panel.style.top = `${window.innerHeight - panelRect.height - 16}px`;
      }
      if (panelRect.top < 16) {
        panel.style.top = '16px';
      }
    });

    function cleanup() {
      overlay.remove();
      panel.remove();
    }

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup();
    });

    overlay.addEventListener('click', () => {
      cleanup();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  },

  getToneLabel(value) {
    const tone = TONES.find((t) => t.value === value);
    return tone ? tone.label : 'Witty';
  },
};

window.UIInjector = UIInjector;
