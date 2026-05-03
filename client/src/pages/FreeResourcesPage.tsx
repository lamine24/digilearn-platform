import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { FreeResourceCard } from "@/components/FreeResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter } from "lucide-react";

const platformOptions = [
  { value: "khan_academy", label: "Khan Academy" },
  { value: "mit_ocw", label: "MIT OpenCourseWare" },
  { value: "statlearning", label: "StatLearning" },
  { value: "open_learning_campus", label: "Open Learning Campus" },
  { value: "canal_u", label: "Canal-U" },
];

const levelOptions = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
];

const sortOptions = [
  { value: "recent", label: "Plus récents" },
  { value: "rating", label: "Mieux notés" },
  { value: "popular", label: "Plus populaires" },
];

export function FreeResourcesPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "popular">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: resources = [], isLoading } = trpc.freeResources.list.useQuery({
    search: searchQuery || undefined,
    platform: selectedPlatform || undefined,
    category: selectedCategory || undefined,
    level: selectedLevel || undefined,
    sortBy,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  const { data: platforms = [] } = trpc.freeResources.getPlatforms.useQuery();
  const { data: categories = [] } = trpc.freeResources.getCategories.useQuery();
  const { data: totalCount = 0 } = trpc.freeResources.getCount.useQuery();

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleViewDetails = (slug: string) => {
    navigate(`/free-resource/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ressources Éducatives Libres</h1>
          <p className="text-lg text-gray-600">
            Accédez à des milliers de cours gratuits de Khan Academy, MIT OpenCourseWare, StatLearning et autres plateformes
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher des ressources..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Platforms */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <h3 className="font-semibold text-gray-900">Plateforme</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPlatform === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPlatform(null);
                  setCurrentPage(1);
                }}
              >
                Toutes
              </Button>
              {platformOptions.map((platform) => (
                <Button
                  key={platform.value}
                  variant={selectedPlatform === platform.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedPlatform(platform.value);
                    setCurrentPage(1);
                  }}
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <h3 className="font-semibold text-gray-900">Catégorie</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setCurrentPage(1);
                }}
              >
                Toutes les catégories
              </Button>
              {categories.map((category: any) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Levels */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <h3 className="font-semibold text-gray-900">Niveau</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLevel === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedLevel(null);
                  setCurrentPage(1);
                }}
              >
                Tous les niveaux
              </Button>
              {levelOptions.map((level) => (
                <Button
                  key={level.value}
                  variant={selectedLevel === level.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLevel(level.value);
                    setCurrentPage(1);
                  }}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <h3 className="font-semibold text-gray-900">Trier par</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSortBy(option.value as any);
                    setCurrentPage(1);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucune ressource ne correspond à votre recherche</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {resources.map((resource: any) => (
                <FreeResourceCard
                  key={resource.id}
                  {...resource}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  Précédent
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
