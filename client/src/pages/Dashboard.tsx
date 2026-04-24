import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  GraduationCap, BookOpen, Award, Bell, ChevronRight,
  LogOut, BarChart3, CheckCircle2, Download
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#3b4f8a", "#2a7d6e", "#e07c3e", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: enrollments } = trpc.enrollments.myEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: certificates } = trpc.certificates.myCertificates.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifs } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated });
  const markReadMutation = trpc.notifications.markRead.useMutation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">Chargement...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (user?.role === "admin") { navigate("/admin"); return null; }
  if (user?.role === "formateur") { navigate("/formateur"); return null; }

  const activeEnrollments = enrollments?.filter(e => e.enrollment.status === "actif") || [];
  const completedEnrollments = enrollments?.filter(e => e.enrollment.status === "complete") || [];
  const totalProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + e.enrollment.progress, 0) / activeEnrollments.length)
    : 0;

  // Radar chart data: competencies by category
  const radarData = useMemo(() => {
    const categoryMap = new Map<string, { total: number; completed: number }>();
    enrollments?.forEach(e => {
      const cat = e.category?.name || "Général";
      const entry = categoryMap.get(cat) || { total: 0, completed: 0 };
      entry.total += 1;
      if (e.enrollment.status === "complete") entry.completed += 1;
      else entry.completed += e.enrollment.progress / 100;
      categoryMap.set(cat, entry);
    });
    return Array.from(categoryMap.entries()).map(([name, { total, completed }]) => ({
      subject: name,
      score: Math.round((completed / total) * 100),
      fullMark: 100,
    }));
  }, [enrollments]);

  // Bar chart: progress per course
  const barData = useMemo(() => {
    return (enrollments || []).slice(0, 8).map(e => ({
      name: e.course.title.length > 20 ? e.course.title.substring(0, 18) + "…" : e.course.title,
      progression: e.enrollment.progress,
    }));
  }, [enrollments]);

  // Pie chart: status distribution
  const pieData = useMemo(() => {
    const active = activeEnrollments.length;
    const completed = completedEnrollments.length;
    const data = [];
    if (active > 0) data.push({ name: "En cours", value: active });
    if (completed > 0) data.push({ name: "Complétées", value: completed });
    return data;
  }, [activeEnrollments, completedEnrollments]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium">Tableau de bord</Link>
            <Link href="/alumni" className="text-sm font-medium text-muted-foreground hover:text-foreground">Alumni</Link>
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {(unreadCount?.count || 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadCount?.count}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Bonjour, {user?.name || "Apprenant"} !</h1>
          <p className="text-muted-foreground">Continuez votre parcours d'apprentissage.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeEnrollments.length}</div>
                  <div className="text-xs text-muted-foreground">En cours</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{completedEnrollments.length}</div>
                  <div className="text-xs text-muted-foreground">Complétées</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{certificates?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Certificats</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalProgress}%</div>
                  <div className="text-xs text-muted-foreground">Progression</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        {enrollments && enrollments.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Radar: competencies */}
            {radarData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Compétences acquises</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="#3b4f8a" fill="#3b4f8a" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Bar: progression per course */}
            {barData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Progression par formation</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="progression" fill="#2a7d6e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Pie: status distribution */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Répartition des formations</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Mes formations</TabsTrigger>
            <TabsTrigger value="certificates">Certificats</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications {(unreadCount?.count || 0) > 0 && <Badge variant="destructive" className="ml-1 text-xs">{unreadCount?.count}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {enrollments?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Aucune formation en cours</h3>
                  <p className="text-sm text-muted-foreground mb-4">Explorez notre catalogue pour commencer votre apprentissage.</p>
                  <Link href="/"><Button>Explorer le catalogue</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {enrollments?.map((item) => (
                  <Card key={item.enrollment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{item.category?.name || "Général"}</Badge>
                        <Badge variant={item.enrollment.status === "complete" ? "default" : "outline"} className="text-xs">
                          {item.enrollment.status === "complete" ? "Complété" : "En cours"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-3">{item.course.title}</h3>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="font-medium">{item.enrollment.progress}%</span>
                        </div>
                        <Progress value={item.enrollment.progress} className="h-2" />
                      </div>
                      <Link href={`/learn/${item.course.slug}`}>
                        <Button size="sm" className="w-full">
                          {item.enrollment.status === "complete" ? "Revoir" : "Continuer"} <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {certificates?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Aucun certificat</h3>
                  <p className="text-sm text-muted-foreground">Complétez une formation pour obtenir votre certificat.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {certificates?.map((item) => (
                  <Card key={item.cert.id} className="border-emerald-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold">{item.course.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Code: <span className="font-mono">{item.cert.certificateCode}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Émis le {new Date(item.cert.issuedAt).toLocaleDateString("fr-FR")}
                      </div>
                      {item.cert.pdfUrl && (
                        <a href={item.cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="mr-1 h-4 w-4" /> Télécharger le certificat
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {notifs?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Aucune notification</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifs?.map((n) => (
                  <Card key={n.id} className={n.isRead ? "opacity-60" : ""}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</div>
                      </div>
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate({ id: n.id })}>
                          Marquer lu
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
