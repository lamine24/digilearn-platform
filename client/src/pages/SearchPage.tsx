import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel, type FilterState } from "@/components/FilterPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";

export function SearchPage() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch available filters
  const filtersQuery = trpc.search.filters.useQuery();

  // Fetch search results
  const searchQuery_trpc = trpc.search.courses.useQuery(
    {
      query: searchQuery,
      categoryId: filters.categoryId,
      level: filters.level as any,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minDuration: filters.minDuration,
      maxDuration: filters.maxDuration,
      formateurId: filters.formateurId,
      sortBy: (filters.sortBy as any) || "relevance",
      limit: pageSize,
      offset: currentPage * pageSize,
    },
    {
      staleTime: 30000,
    }
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const totalPages = Math.ceil((searchQuery_trpc.data?.total || 0) / pageSize);
  const hasResults = (searchQuery_trpc.data?.results?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Rechercher des cours</h1>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Rechercher par titre, description, tags..."
            loading={searchQuery_trpc.isLoading}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <FilterPanel
                onFilterChange={handleFilterChange}
                availableFilters={filtersQuery.data}
                loading={searchQuery_trpc.isLoading}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {searchQuery_trpc.isLoading ? (
                    <Skeleton className="h-6 w-48" />
                  ) : (
                    <>
                      {searchQuery_trpc.data?.total || 0} résultat
                      {(searchQuery_trpc.data?.total || 0) !== 1 ? "s" : ""} trouvé
                      {searchQuery && ` pour "${searchQuery}"`}
                    </>
                  )}
                </h2>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  aria-label="Affichage grille"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  aria-label="Affichage liste"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {searchQuery_trpc.isLoading && (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : ""}`}>
                {Array.from({ length: pageSize }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!searchQuery_trpc.isLoading && !hasResults && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Aucun cours trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos critères de recherche ou vos filtres
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({});
                  }}
                >
                  Réinitialiser la recherche
                </Button>
              </div>
            )}

            {/* Results Grid/List */}
            {!searchQuery_trpc.isLoading && hasResults && (
              <>
                <div
                  className={`gap-4 ${
                    viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2" : "space-y-4"
                  }`}
                >
                  {searchQuery_trpc.data?.results.map((course) => (
                    <Card
                      key={course.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/courses/${course.slug}`)}
                    >
                      {course.thumbnailUrl && (
                        <div className="w-full h-48 bg-muted overflow-hidden rounded-t-lg">
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                            {course.category && (
                              <CardDescription className="text-xs mt-1">
                                {course.category.name}
                              </CardDescription>
                            )}
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">
                            {course.price === "0.00" ? "Gratuit" : `${course.price} ${course.currency}`}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {course.shortDescription || course.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="capitalize">{course.level}</span>
                          {course.duration && <span>{course.duration}h</span>}
                          {course.enrollmentCount !== undefined && (
                            <span>{course.enrollmentCount} inscrits</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNum = i;
                        if (totalPages > 5) {
                          if (currentPage < 3) {
                            pageNum = i;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
