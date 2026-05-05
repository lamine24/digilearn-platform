import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RefreshCw, Trash2, RotateCcw, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AdminSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions, refetch } = trpc.admin.subscriptions.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = trpc.admin.subscriptionStats.useQuery();

  // Search subscriptions
  const { data: searchResults } = trpc.admin.searchSubscriptions.useQuery(
    { query: searchQuery, limit: 100 },
    { enabled: searchQuery.length > 0 }
  );

  // Mutations
  const renewMutation = trpc.admin.renewSubscription.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const cancelMutation = trpc.admin.cancelSubscription.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const subscriptions = (searchQuery.length > 0 ? searchResults : subscriptionsData?.subscriptions) || [];
  const total = subscriptionsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getDaysRemaining = (endDate: string | Date | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Gestion des Abonnements Premium</h1>
          <p className="text-gray-600">Visualisez et gérez tous les abonnements utilisateurs</p>
        </div>

        {/* Statistics Cards */}
        {isLoadingStats ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Abonnements Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Expirant Bientôt (7j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.expiringCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Abonnements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revenu Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue} XOF</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Search and Refresh */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email ou ID de paiement..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoadingSubscriptions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Abonnements</CardTitle>
            <CardDescription>
              {searchQuery.length > 0
                ? `${subscriptions.length} résultat(s) trouvé(s)`
                : `Page ${currentPage + 1} sur ${totalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSubscriptions ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (subscriptions as any[]).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun abonnement trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Jours Restants</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Renouvellement Auto</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(subscriptions as any[]).map((sub: any) => {
                      const daysRemaining = getDaysRemaining(sub.endDate);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.userName || "N/A"}</TableCell>
                          <TableCell>{sub.userEmail || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(sub.status)}>
                              {sub.status === "active" ? "Actif" : sub.status === "cancelled" ? "Annulé" : "Expiré"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(sub.startDate)}</TableCell>
                          <TableCell>{formatDate(sub.endDate)}</TableCell>
                          <TableCell>
                            {daysRemaining !== null ? (
                              <span className={daysRemaining < 7 ? "text-orange-600 font-semibold" : ""}>
                                {daysRemaining} jours
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>{sub.price} {sub.currency}</TableCell>
                          <TableCell>
                            <Badge variant={sub.autoRenew ? "default" : "outline"}>
                              {sub.autoRenew ? "Oui" : "Non"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Détails de l'Abonnement</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Utilisateur</p>
                                      <p className="font-semibold">{sub.userName}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Email</p>
                                      <p className="font-semibold">{sub.userEmail}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">ID Paiement</p>
                                      <p className="font-semibold">{sub.paymentId}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Statut</p>
                                      <Badge className={getStatusColor(sub.status)}>
                                        {sub.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Période</p>
                                      <p className="font-semibold">
                                        {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Montant</p>
                                      <p className="font-semibold">{sub.price} {sub.currency}</p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {sub.status === "active" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => renewMutation.mutate({ userId: sub.userId })}
                                    disabled={renewMutation.isPending}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => cancelMutation.mutate({ userId: sub.userId })}
                                    disabled={cancelMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!searchQuery && totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = currentPage + i - 2;
                if (pageNum < 0 || pageNum >= totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
