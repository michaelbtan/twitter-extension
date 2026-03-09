// Assign to self so it's accessible in both window (content scripts) and service worker
self.Storage = {
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
      openaiModel: 'gpt-4o',
      defaultTone: 'witty',
      twitterBearerToken: '',
      researchEnabled: false,
    };
    const stored = await this.get(Object.keys(defaults));
    return { ...defaults, ...stored };
  },

  async saveSettings(settings) {
    return this.set(settings);
  },
};
