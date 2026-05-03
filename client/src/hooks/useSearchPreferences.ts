import { useState, useEffect } from "react";

export interface SearchPreferences {
  category?: string;
  level?: string;
  platform?: string;
  sortBy?: "recent" | "rating" | "popular";
  priceRange?: { min: number; max: number };
  duration?: { min: number; max: number };
}

export interface SearchHistory {
  query: string;
  timestamp: number;
  preferences?: SearchPreferences;
}

const PREFERENCES_KEY = "digilearn_search_preferences";
const HISTORY_KEY = "digilearn_search_history";
const MAX_HISTORY = 20;

export function useSearchPreferences() {
  const [preferences, setPreferences] = useState<SearchPreferences>({});
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences and history from localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading search preferences:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: SearchPreferences) => {
    try {
      setPreferences(newPreferences);
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error("Error saving search preferences:", error);
    }
  };

  // Add search to history
  const addToHistory = (query: string, currentPreferences?: SearchPreferences) => {
    try {
      const newEntry: SearchHistory = {
        query,
        timestamp: Date.now(),
        preferences: currentPreferences,
      };

      const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY);
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error adding to search history:", error);
    }
  };

  // Clear history
  const clearHistory = () => {
    try {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };

  // Clear preferences
  const clearPreferences = () => {
    try {
      setPreferences({});
      localStorage.removeItem(PREFERENCES_KEY);
    } catch (error) {
      console.error("Error clearing search preferences:", error);
    }
  };

  // Get unique search queries from history
  const getUniqueQueries = (): string[] => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const entry of history) {
      if (!seen.has(entry.query)) {
        seen.add(entry.query);
        unique.push(entry.query);
      }
    }
    return unique;
  };

  // Get recent searches (last N)
  const getRecentSearches = (limit: number = 5): SearchHistory[] => {
    return history.slice(0, limit);
  };

  return {
    preferences,
    savePreferences,
    history,
    addToHistory,
    clearHistory,
    clearPreferences,
    getUniqueQueries,
    getRecentSearches,
    isLoaded,
  };
}
