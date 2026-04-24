import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, Users, BookOpen, CreditCard, BarChart3, TrendingUp,
  Award, LogOut, ArrowLeft, UserCheck, DollarSign
} from "lucide-react";
import { getLoginUrl } from "@/const";

function formatCurrency(amount: string | number) {
  return `${Number(amount).toLocaleString("fr-FR")} XOF`;
}

const roleLabels: Record<string, string> = {
  admin: "Administrateur", formateur: "Formateur", apprenant: "Apprenant", alumni: "Alumni", prospect: "Prospect"
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700", formateur: "bg-blue-100 text-blue-700",
  apprenant: "bg-emerald-100 text-emerald-700", alumni: "bg-purple-100 text-purple-700",
  prospect: "bg-gray-100 text-gray-700"
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: recentEnrollments } = trpc.admin.recentEnrollments.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.users.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allPayments } = trpc.admin.allPayments.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allCourses } = trpc.courses.all.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Rôle mis à jour"); refetchUsers(); },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Chargement...</div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }
  if (user?.role !== "admin") { navigate("/dashboard"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
            <Badge variant="destructive" className="ml-2">Admin</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Site public</Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord administrateur</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="text-xs text-muted-foreground">Utilisateurs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <BookOpen className="h-5 w-5 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
              <div className="text-xs text-muted-foreground">Formations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <UserCheck className="h-5 w-5 text-emerald-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
              <div className="text-xs text-muted-foreground">Inscriptions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 text-amber-600 mb-2" />
              <div className="text-2xl font-bold text-sm">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <div className="text-xs text-muted-foreground">Revenus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
              <div className="text-xs text-muted-foreground">Taux complétion</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="courses">Formations</TabsTrigger>
            <TabsTrigger value="enrollments">Inscriptions</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="text-lg">Gestion des utilisateurs</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Nom</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Rôle</th>
                        <th className="pb-3 font-medium">Inscrit le</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers?.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-3">{u.name || "—"}</td>
                          <td className="py-3 text-muted-foreground">{u.email || "—"}</td>
                          <td className="py-3">
                            <Badge className={`text-xs ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3">
                            <Select
                              value={u.role}
                              onValueChange={(val) => updateRoleMutation.mutate({ userId: u.id, role: val as any })}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="formateur">Formateur</SelectItem>
                                <SelectItem value="apprenant">Apprenant</SelectItem>
                                <SelectItem value="alumni">Alumni</SelectItem>
                                <SelectItem value="prospect">Prospect</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader><CardTitle className="text-lg">Formations</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Titre</th>
                        <th className="pb-3 font-medium">Catégorie</th>
                        <th className="pb-3 font-medium">Prix</th>
                        <th className="pb-3 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCourses?.map((item) => (
                        <tr key={item.course.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{item.course.title}</td>
                          <td className="py-3 text-muted-foreground">{item.category?.name || "—"}</td>
                          <td className="py-3">{formatCurrency(item.course.price)}</td>
                          <td className="py-3">
                            <Badge variant={item.course.status === "publie" ? "default" : "secondary"} className="text-xs">
                              {item.course.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader><CardTitle className="text-lg">Inscriptions récentes</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Apprenant</th>
                        <th className="pb-3 font-medium">Formation</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Progression</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEnrollments?.map((item) => (
                        <tr key={item.enrollment.id} className="border-b last:border-0">
                          <td className="py-3">{item.user.name || "—"}</td>
                          <td className="py-3">{item.course.title}</td>
                          <td className="py-3"><Badge variant="outline" className="text-xs">{item.enrollment.status}</Badge></td>
                          <td className="py-3">{item.enrollment.progress}%</td>
                          <td className="py-3 text-muted-foreground">{new Date(item.enrollment.enrolledAt).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle className="text-lg">Paiements</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Utilisateur</th>
                        <th className="pb-3 font-medium">Formation</th>
                        <th className="pb-3 font-medium">Montant</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPayments?.map((item) => (
                        <tr key={item.payment.id} className="border-b last:border-0">
                          <td className="py-3">{item.user.name || "—"}</td>
                          <td className="py-3">{item.course.title}</td>
                          <td className="py-3 font-medium">{formatCurrency(item.payment.amount)}</td>
                          <td className="py-3">
                            <Badge variant={item.payment.status === "reussi" ? "default" : "secondary"} className="text-xs">
                              {item.payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{new Date(item.payment.createdAt).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
