import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TranslationAPI {
  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/translations`,
      timeout: 10000
    });

    // Handle responses
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('Translation API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Helper method to get token
  getAuthToken() {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('aggrekart_token='))
      ?.split('=')[1];
    return token;
  }

  // Helper method to create auth headers when needed
  getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get supported languages (NO AUTH REQUIRED)
  async getSupportedLanguages() {
    return await this.client.get('/languages');
  }

  // Get all translations for a language (NO AUTH REQUIRED)
  async getTranslations(language, context = 'general') {
    return await this.client.get(`/${language}`, {
      params: { context }
    });
  }

  // Get specific translations (NO AUTH REQUIRED)
  async getSpecificTranslations(language, keys, context = 'general') {
    return await this.client.get(`/${language}`, {
      params: { keys, context }
    });
  }

  // Get single translation (NO AUTH REQUIRED)
  async getTranslation(language, key, context = 'general') {
    return await this.client.get(`/${language}/${key}`, {
      params: { context }
    });
  }

  // Update user language preference (AUTH REQUIRED)
  async updateUserLanguage(language) {
    return await this.client.patch('/user/language', 
      { language },
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: Update translation (AUTH REQUIRED)
  async updateTranslation(language, key, value, context = 'general') {
    return await this.client.put(`/${language}/${key}`, 
      { value, context },
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: Batch update translations (AUTH REQUIRED)
  async batchUpdateTranslations(translations) {
    return await this.client.post('/batch-update', 
      { translations },
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: Auto-translate (AUTH REQUIRED)
  async autoTranslate(sourceLanguage, targetLanguage, keys = null, context = 'general') {
    return await this.client.post('/auto-translate', 
      {
        sourceLanguage,
        targetLanguage,
        keys,
        context
      },
      { headers: this.getAuthHeaders() }
    );
  }
}

export const translationAPI = new TranslationAPI();