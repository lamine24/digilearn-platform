import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  availableFilters?: {
    categories: Array<{ id: number; name: string; slug: string; count?: number }>;
    levels: Array<{ value: string; label: string }>;
    priceRange: { minPrice: number; maxPrice: number };
    durationRange: { minDuration: number; maxDuration: number };
    formateurs: Array<{ id: number; name: string | null; courseCount?: number }>;
  };
  loading?: boolean;
}

export interface FilterState {
  categoryId?: number;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  formateurId?: number;
  sortBy?: "relevance" | "popularity" | "price_asc" | "price_desc" | "newest" | "rating";
}

export function FilterPanel({ onFilterChange, availableFilters, loading }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "relevance",
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    level: true,
    price: true,
    duration: true,
    formateur: false,
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([
    availableFilters?.priceRange.minPrice || 0,
    availableFilters?.priceRange.maxPrice || 1000000,
  ]);

  const [durationRange, setDurationRange] = useState<[number, number]>([
    availableFilters?.durationRange.minDuration || 0,
    availableFilters?.durationRange.maxDuration || 1000,
  ]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (categoryId: number) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? undefined : categoryId,
    }));
  };

  const handleLevelChange = (level: string) => {
    setFilters((prev) => ({
      ...prev,
      level: prev.level === level ? undefined : level,
    }));
  };

  const handlePriceChange = (newRange: [number, number]) => {
    setPriceRange(newRange);
    setFilters((prev) => ({
      ...prev,
      minPrice: newRange[0],
      maxPrice: newRange[1],
    }));
  };

  const handleDurationChange = (newRange: [number, number]) => {
    setDurationRange(newRange);
    setFilters((prev) => ({
      ...prev,
      minDuration: newRange[0],
      maxDuration: newRange[1],
    }));
  };

  const handleFormateurChange = (formateurId: number) => {
    setFilters((prev) => ({
      ...prev,
      formateurId: prev.formateurId === formateurId ? undefined : formateurId,
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as any,
    }));
  };

  const clearFilters = () => {
    setFilters({ sortBy: "relevance" });
    setPriceRange([availableFilters?.priceRange.minPrice || 0, availableFilters?.priceRange.maxPrice || 1000000]);
    setDurationRange([availableFilters?.durationRange.minDuration || 0, availableFilters?.durationRange.maxDuration || 1000]);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key !== "sortBy" && value !== undefined);

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Trier par</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filters.sortBy || "relevance"} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Pertinence</SelectItem>
              <SelectItem value="popularity">Popularité</SelectItem>
              <SelectItem value="newest">Plus récent</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Categories */}
      {availableFilters?.categories && availableFilters.categories.length > 0 && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSection("category")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Catégories</CardTitle>
              {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
          {expandedSections.category && (
            <CardContent className="space-y-2">
              {availableFilters.categories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={filters.categoryId === cat.id}
                    onCheckedChange={() => handleCategoryChange(cat.id)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={`cat-${cat.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {cat.name}
                    {cat.count !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">({cat.count})</span>
                    )}
                  </label>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Levels */}
      {availableFilters?.levels && availableFilters.levels.length > 0 && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSection("level")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Niveau</CardTitle>
              {expandedSections.level ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
          {expandedSections.level && (
            <CardContent className="space-y-2">
              {availableFilters.levels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level.value}`}
                    checked={filters.level === level.value}
                    onCheckedChange={() => handleLevelChange(level.value)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={`level-${level.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {level.label}
                  </label>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Price Range */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection("price")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Prix (XOF)</CardTitle>
            {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardHeader>
        {expandedSections.price && (
          <CardContent className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              min={availableFilters?.priceRange.minPrice || 0}
              max={availableFilters?.priceRange.maxPrice || 1000000}
              step={1000}
              disabled={loading}
              className="w-full"
            />
            <div className="flex gap-2 text-sm">
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange([parseInt(e.target.value) || 0, priceRange[1]])}
                placeholder="Min"
                disabled={loading}
                className="flex-1"
              />
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value) || 1000000])}
                placeholder="Max"
                disabled={loading}
                className="flex-1"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Duration Range */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection("duration")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Durée (heures)</CardTitle>
            {expandedSections.duration ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardHeader>
        {expandedSections.duration && (
          <CardContent className="space-y-4">
            <Slider
              value={durationRange}
              onValueChange={handleDurationChange}
              min={availableFilters?.durationRange.minDuration || 0}
              max={availableFilters?.durationRange.maxDuration || 1000}
              step={5}
              disabled={loading}
              className="w-full"
            />
            <div className="flex gap-2 text-sm">
              <Input
                type="number"
                value={durationRange[0]}
                onChange={(e) => handleDurationChange([parseInt(e.target.value) || 0, durationRange[1]])}
                placeholder="Min"
                disabled={loading}
                className="flex-1"
              />
              <Input
                type="number"
                value={durationRange[1]}
                onChange={(e) => handleDurationChange([durationRange[0], parseInt(e.target.value) || 1000])}
                placeholder="Max"
                disabled={loading}
                className="flex-1"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Formateurs */}
      {availableFilters?.formateurs && availableFilters.formateurs.length > 0 && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSection("formateur")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Formateurs</CardTitle>
              {expandedSections.formateur ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
          {expandedSections.formateur && (
            <CardContent className="space-y-2">
              {availableFilters.formateurs.map((formateur) => (
                <div key={formateur.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`formateur-${formateur.id}`}
                    checked={filters.formateurId === formateur.id}
                    onCheckedChange={() => handleFormateurChange(formateur.id)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={`formateur-${formateur.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {formateur.name}
                    {formateur.courseCount !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">({formateur.courseCount})</span>
                    )}
                  </label>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
