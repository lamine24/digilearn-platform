import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchPreferences } from "./useSearchPreferences";

describe("useSearchPreferences", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with empty preferences", () => {
    const { result } = renderHook(() => useSearchPreferences());
    expect(result.current.preferences).toEqual({});
    expect(result.current.history).toEqual([]);
  });

  it("should save preferences to localStorage", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.savePreferences({
        category: "programming",
        level: "intermediate",
        sortBy: "rating",
      });
    });

    expect(result.current.preferences).toEqual({
      category: "programming",
      level: "intermediate",
      sortBy: "rating",
    });

    const saved = JSON.parse(localStorage.getItem("digilearn_search_preferences") || "{}");
    expect(saved).toEqual({
      category: "programming",
      level: "intermediate",
      sortBy: "rating",
    });
  });

  it("should add search to history", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.addToHistory("Python", { category: "programming" });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].query).toBe("Python");
    expect(result.current.history[0].preferences).toEqual({ category: "programming" });
  });

  it("should maintain history order with newest first", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.addToHistory("Python");
      result.current.addToHistory("JavaScript");
      result.current.addToHistory("React");
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].query).toBe("React");
    expect(result.current.history[1].query).toBe("JavaScript");
    expect(result.current.history[2].query).toBe("Python");
  });

  it("should limit history to MAX_HISTORY items", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addToHistory(`Query ${i}`);
      }
    });

    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0].query).toBe("Query 24");
  });

  it("should clear history", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.addToHistory("Python");
      result.current.addToHistory("JavaScript");
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(localStorage.getItem("digilearn_search_history")).toBeNull();
  });

  it("should get unique queries from history", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.addToHistory("Python");
      result.current.addToHistory("JavaScript");
      result.current.addToHistory("Python");
      result.current.addToHistory("React");
    });

    const unique = result.current.getUniqueQueries();
    expect(unique).toHaveLength(3);
    expect(unique).toContain("Python");
    expect(unique).toContain("JavaScript");
    expect(unique).toContain("React");
  });

  it("should get recent searches with limit", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.addToHistory("Python");
      result.current.addToHistory("JavaScript");
      result.current.addToHistory("React");
      result.current.addToHistory("Vue");
    });

    const recent = result.current.getRecentSearches(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].query).toBe("Vue");
    expect(recent[1].query).toBe("React");
  });

  it("should clear preferences", () => {
    const { result } = renderHook(() => useSearchPreferences());

    act(() => {
      result.current.savePreferences({
        category: "programming",
        level: "advanced",
      });
    });

    expect(result.current.preferences).not.toEqual({});

    act(() => {
      result.current.clearPreferences();
    });

    expect(result.current.preferences).toEqual({});
    expect(localStorage.getItem("digilearn_search_preferences")).toBeNull();
  });

  it("should load preferences from localStorage on mount", () => {
    const preferences = {
      category: "data-science",
      level: "beginner",
      sortBy: "recent" as const,
    };

    localStorage.setItem("digilearn_search_preferences", JSON.stringify(preferences));

    const { result } = renderHook(() => useSearchPreferences());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.preferences).toEqual(preferences);
  });
});
