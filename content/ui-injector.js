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
    const existing = container.querySelector('.craft-reply-popover');
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
    container.appendChild(popover);

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

  getToneLabel(value) {
    const tone = TONES.find((t) => t.value === value);
    return tone ? tone.label : 'Witty';
  },
};

window.UIInjector = UIInjector;
