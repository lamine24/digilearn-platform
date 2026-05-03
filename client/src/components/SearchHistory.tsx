import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchPreferences, type SearchHistory } from "@/hooks/useSearchPreferences";

interface SearchHistoryProps {
  onSelectSearch: (query: string) => void;
  limit?: number;
}

export function SearchHistoryComponent({ onSelectSearch, limit = 5 }: SearchHistoryProps) {
  const { history, clearHistory } = useSearchPreferences();

  const recentSearches = history.slice(0, limit);

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Recherches récentes</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearHistory()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Effacer
        </Button>
      </div>

      <div className="space-y-2">
        {recentSearches.map((search, index) => (
          <div
            key={`${search.query}-${search.timestamp}`}
            className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors group"
          >
            <button
              onClick={() => onSelectSearch(search.query)}
              className="flex-1 text-left text-sm hover:text-primary transition-colors"
            >
              <span className="line-clamp-1">{search.query}</span>
              {search.preferences && (
                <div className="text-xs text-muted-foreground mt-1 space-x-1">
                  {search.preferences.category && (
                    <span className="inline-block bg-muted px-2 py-0.5 rounded">
                      {search.preferences.category}
                    </span>
                  )}
                  {search.preferences.level && (
                    <span className="inline-block bg-muted px-2 py-0.5 rounded">
                      {search.preferences.level}
                    </span>
                  )}
                </div>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                // TODO: Implement individual history item deletion
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
