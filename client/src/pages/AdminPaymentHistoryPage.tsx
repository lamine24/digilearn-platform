import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = "date" | "amount" | "status" | null;
type SortOrder = "asc" | "desc";

export function AdminPaymentHistoryPage() {
  const [page, setPage] = useState(0);
  const [userFilter, setUserFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const limit = 20;

  // Fetch payment history
  const { data: paymentData, isLoading } = trpc.admin.paymentHistory.useQuery({
    limit,
    offset: page * limit,
    userId: userFilter ? parseInt(userFilter) : undefined,
    status: statusFilter || undefined,
    minAmount: minAmount || undefined,
    maxAmount: maxAmount || undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  // Fetch statistics
  const { data: stats } = trpc.admin.paymentStatistics.useQuery({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  // Export mutation
  const exportMutation = trpc.admin.exportPaymentHistory.useMutation();

  // Sort payments locally
  const sortedPayments = useMemo(() => {
    const payments = paymentData?.payments || [];
    if (!sortField) return payments;

    return [...payments].sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "amount":
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [paymentData?.payments, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        status: statusFilter || undefined,
      });

      // Create a blob and download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const payments = sortedPayments;
  const total = paymentData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Historique des Paiements</h1>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{stats.totalTransactions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Montant Total</p>
            <p className="text-2xl font-bold">{stats.totalAmount} XOF</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Réussies</p>
            <p className="text-2xl font-bold text-green-600">{stats.successfulTransactions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Échouées</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedTransactions}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className="text-sm font-medium">Utilisateur (ID)</label>
            <Input
              type="number"
              placeholder="ID utilisateur"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="success">Réussi</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Montant Min</label>
            <Input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Montant Max</label>
            <Input
              type="number"
              placeholder="999999"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date Début</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserFilter("");
                setStatusFilter("");
                setMinAmount("");
                setMaxAmount("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center">
                    Montant
                    {getSortIcon("amount")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Méthode</th>
                <th className="px-4 py-3 text-left font-medium">Transaction ID</th>
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon("date")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{payment.id}</td>
                    <td className="px-4 py-3">{payment.userId}</td>
                    <td className="px-4 py-3 font-medium">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {payment.transactionId || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page + 1} sur {totalPages} ({total} total)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
