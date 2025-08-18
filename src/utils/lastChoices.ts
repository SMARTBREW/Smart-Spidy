// Utility to manage last choices for chat creation
const LAST_CHOICES_KEY = 'smartspidy_last_choices';

interface LastChoices {
  product: string;
  executiveInstagramUsername: string;
}

// Default values
const DEFAULT_CHOICES: LastChoices = {
  product: 'Wings Of Hope', // Default campaign
  executiveInstagramUsername: '',
};

// Get last choices from localStorage
export const getLastChoices = (): LastChoices => {
  try {
    const stored = localStorage.getItem(LAST_CHOICES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CHOICES,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Error reading last choices from localStorage:', error);
  }
  return { ...DEFAULT_CHOICES };
};

// Save last choices to localStorage
export const saveLastChoices = (choices: Partial<LastChoices>): void => {
  try {
    const current = getLastChoices();
    const updated = { ...current, ...choices };
    localStorage.setItem(LAST_CHOICES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving last choices to localStorage:', error);
  }
};

// Save specific choice
export const saveLastProduct = (product: string): void => {
  saveLastChoices({ product });
};

export const saveLastExecutiveInstagramUsername = (username: string): void => {
  saveLastChoices({ executiveInstagramUsername: username });
};

// Clear all last choices
export const clearLastChoices = (): void => {
  try {
    localStorage.removeItem(LAST_CHOICES_KEY);
  } catch (error) {
    console.error('Error clearing last choices from localStorage:', error);
  }
};
