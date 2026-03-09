document.addEventListener('DOMContentLoaded', async () => {
  const settings = await Storage.getSettings();

  // Populate form
  document.getElementById('claude-key').value = settings.claudeApiKey;
  document.getElementById('openai-key').value = settings.openaiApiKey;
  document.getElementById('claude-model').value = settings.claudeModel;
  document.getElementById('openai-model').value = settings.openaiModel;
  document.getElementById('default-tone').value = settings.defaultTone;
  document.getElementById('twitter-token').value = settings.twitterBearerToken;
  document.getElementById('research-enabled').checked = settings.researchEnabled;

  // Set active provider
  setProvider(settings.apiProvider);

  // Show/hide research settings
  toggleResearch(settings.researchEnabled);

  // Provider toggle
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setProvider(btn.dataset.provider);
    });
  });

  // Research toggle
  document.getElementById('research-enabled').addEventListener('change', (e) => {
    toggleResearch(e.target.checked);
  });

  // Save
  document.getElementById('save-btn').addEventListener('click', async () => {
    const activeProvider = document.querySelector('.toggle-btn.active').dataset.provider;

    await Storage.saveSettings({
      apiProvider: activeProvider,
      claudeApiKey: document.getElementById('claude-key').value.trim(),
      openaiApiKey: document.getElementById('openai-key').value.trim(),
      claudeModel: document.getElementById('claude-model').value,
      openaiModel: document.getElementById('openai-model').value,
      defaultTone: document.getElementById('default-tone').value,
      twitterBearerToken: document.getElementById('twitter-token').value.trim(),
      researchEnabled: document.getElementById('research-enabled').checked,
    });

    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});

function setProvider(provider) {
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.provider === provider);
  });
  document.getElementById('claude-settings').classList.toggle('hidden', provider !== 'claude');
  document.getElementById('openai-settings').classList.toggle('hidden', provider !== 'openai');
}

function toggleResearch(enabled) {
  document.getElementById('research-settings').classList.toggle('hidden', !enabled);
}
