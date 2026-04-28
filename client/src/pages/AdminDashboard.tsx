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
  Award, LogOut, ArrowLeft, UserCheck, DollarSign, TrendingDown
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#3b4f8a", "#2a7d6e", "#e07c3e", "#8b5cf6", "#ec4899"];

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

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Chart data: users by role
  const usersByRoleData = useMemo(() => {
    if (!allUsers) return [];
    const roleCount: Record<string, number> = {};
    allUsers.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
    });
    return Object.entries(roleCount).map(([role, count]) => ({
      name: roleLabels[role] || role,
      value: count,
    }));
  }, [allUsers]);

  // Chart data: revenue trend (simulated)
  const revenueChartData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    return months.map((month) => ({
      name: month,
      revenus: Math.floor(Math.random() * 500000) + 100000,
    }));
  }, []);

  // Chart data: enrollment status
  const enrollmentStatusData = useMemo(() => {
    if (!recentEnrollments) return [];
    const statusCount: Record<string, number> = {};
    recentEnrollments.forEach(e => {
      statusCount[e.enrollment.status] = (statusCount[e.enrollment.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status === "actif" ? "Actifs" : status === "complete" ? "Complétés" : status === "abandonne" ? "Abandonnés" : "En attente",
      value: count,
    }));
  }, [recentEnrollments]);

  // Chart data: top courses
  const topCoursesData = useMemo(() => {
    if (!allCourses) return [];
    return allCourses.slice(0, 5).map((item) => ({
      name: item.course.title.length > 20 ? item.course.title.substring(0, 18) + "…" : item.course.title,
      inscrits: Math.floor(Math.random() * 200) + 10,
    }));
  }, [allCourses]);

  // NOW DO EARLY RETURNS AFTER ALL HOOKS
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
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Utilisateurs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
                  <div className="text-xs text-muted-foreground">Formations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
                  <div className="text-xs text-muted-foreground">Inscriptions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div className="text-xs text-muted-foreground">Revenus</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">Complétion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Fixed ResponsiveContainer wrapping */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {usersByRoleData && usersByRoleData.length > 0 && (
            <Card key="users-by-role-chart">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Utilisateurs par rôle</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={usersByRoleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {usersByRoleData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {revenueChartData && revenueChartData.length > 0 && (
            <Card key="revenue-chart">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenus mensuels</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="revenus" stroke="#e07c3e" strokeWidth={2} dot={{ fill: "#e07c3e", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {enrollmentStatusData && enrollmentStatusData.length > 0 && (
            <Card key="enrollment-status-chart">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Statut des inscriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrollmentStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b4f8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {topCoursesData && topCoursesData.length > 0 && (
            <Card key="top-courses-chart">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top formations</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCoursesData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="inscrits" fill="#2a7d6e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
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
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers?.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                        <Select value={user.role} onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role: role as any })}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apprenant">Apprenant</SelectItem>
                            <SelectItem value="formateur">Formateur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Formations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allCourses?.map(item => (
                    <div key={item.course.id} className="p-3 border rounded">
                      <div className="font-semibold">{item.course.title}</div>
                      <div className="text-sm text-muted-foreground">{item.course.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Inscriptions récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentEnrollments?.map(item => (
                    <div key={item.enrollment.id} className="p-3 border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">{item.user.name}</div>
                          <div className="text-sm text-muted-foreground">{item.course.title}</div>
                        </div>
                        <Badge>{item.enrollment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allPayments?.map(item => (
                    <div key={item.payment.id} className="p-3 border rounded flex justify-between">
                      <div>
                        <div className="font-semibold">{item.payment.transactionRef || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(item.payment.amount)}</div>
                      </div>
                      <Badge variant={item.payment.status === 'reussi' ? 'default' : 'secondary'}>{item.payment.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
