import AsyncStorage from '@react-native-async-storage/async-storage';

interface DraftData {
  formData: {
    title: string;
    description: string;
    type: 'cat' | 'dog' | 'other';
    status: 'needs_rescue' | 'for_adoption' | 'emergency';
    gender: 'male' | 'female';
    age: 'young' | 'adult' | 'senior';
    health: string;
    contactPhone: string;
    contactWechat: string;
    contactQQ: string;
  };
  images: { uri: string }[];
  timestamp: number;
}

const DRAFT_STORAGE_KEY = 'pawlink_publish_draft';

export const DraftStorage = {
  async saveDraft(draft: Omit<DraftData, 'timestamp'>): Promise<void> {
    try {
      const draftWithTimestamp: DraftData = {
        ...draft,
        timestamp: Date.now(),
      };
      const jsonValue = JSON.stringify(draftWithTimestamp);
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  },

  async loadDraft(): Promise<DraftData | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  },

  async clearDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing draft:', error);
      throw error;
    }
  },

  async hasDraft(): Promise<boolean> {
    try {
      const draft = await this.loadDraft();
      return draft !== null;
    } catch (error) {
      console.error('Error checking draft:', error);
      return false;
    }
  },
};
