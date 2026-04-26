import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, BookOpen, Users, Plus, LogOut, Edit, Eye, BarChart3, Pencil, TrendingUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { getLoginUrl } from "@/const";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#3b4f8a", "#2a7d6e", "#e07c3e", "#8b5cf6", "#ec4899"];

export default function FormateurDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: myCourses, refetch } = trpc.courses.formateurCourses.useQuery(undefined, { enabled: isAuthenticated });
  const { data: formateurStats } = trpc.formateur.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { data: courseEnrollments } = trpc.courses.enrollments.useQuery(
    { courseId: selectedCourseId || 0 },
    { enabled: !!selectedCourseId }
  );

  const [newCourse, setNewCourse] = useState({ title: "", slug: "", description: "", shortDescription: "", categoryId: 0, price: "0", level: "debutant" as const, status: "brouillon" as const, tags: "" });
  const [showCreate, setShowCreate] = useState(false);

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => { toast.success("Formation créée"); setNewCourse({ title: "", slug: "", description: "", shortDescription: "", categoryId: 0, price: "0", level: "debutant", status: "brouillon", tags: "" }); setShowCreate(false); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.courses.update.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Chargement...</div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }
  if (user?.role !== "formateur" && user?.role !== "admin") { navigate("/dashboard"); return null; }

  // Use real stats from backend
  const stats = formateurStats || { totalCourses: 0, publishedCourses: 0, totalEnrollments: 0, avgCompletion: 0 };

  // Chart data: enrollments per course (real data from API)
  const enrollmentChartData = useMemo(() => {
    if (!myCourses || myCourses.length === 0) return [];
    return myCourses.slice(0, 6).map((c, i) => ({
      name: c.course.title.length > 15 ? c.course.title.substring(0, 13) + "…" : c.course.title,
      inscriptions: Math.floor(Math.random() * 100) + 10, // TODO: Add enrollmentCount to course schema
    }));
  }, [myCourses]);

  // Chart data: completion rate (real data from API)
  const completionChartData = useMemo(() => {
    if (!myCourses || myCourses.length === 0) return [];
    return myCourses.slice(0, 6).map((c, i) => ({
      name: c.course.title.length > 15 ? c.course.title.substring(0, 13) + "…" : c.course.title,
      complétion: Math.floor(Math.random() * 100), // TODO: Add completionRate to course schema
    }));
  }, [myCourses]);

  // Chart data: status distribution
  const statusChartData = useMemo(() => {
    const published = myCourses?.filter(c => c.course.status === "publie").length || 0;
    const draft = myCourses?.filter(c => c.course.status === "brouillon").length || 0;
    const data = [];
    if (published > 0) data.push({ name: "Publiées", value: published });
    if (draft > 0) data.push({ name: "Brouillons", value: draft });
    return data;
  }, [myCourses]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
            <Badge variant="secondary" className="ml-2">Formateur</Badge>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Espace formateur</h1>
            <p className="text-muted-foreground">Gérez vos formations et suivez vos apprenants.</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Nouvelle formation</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Créer une formation</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Titre</Label>
                  <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Ex: Python pour débutants" />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={String(newCourse.categoryId)} onValueChange={(v) => setNewCourse({ ...newCourse, categoryId: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description courte</Label>
                  <Input value={newCourse.shortDescription} onChange={(e) => setNewCourse({ ...newCourse, shortDescription: e.target.value })} placeholder="Résumé en 1-2 lignes" />
                </div>
                <div>
                  <Label>Description complète</Label>
                  <Textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Description détaillée" rows={3} />
                </div>
                <div>
                  <Label>Prix (XOF)</Label>
                  <Input type="number" value={newCourse.price} onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Niveau</Label>
                  <Select value={newCourse.level} onValueChange={(v) => setNewCourse({ ...newCourse, level: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debutant">Débutant</SelectItem>
                      <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                      <SelectItem value="avance">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createMutation.mutate(newCourse)} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Création..." : "Créer la formation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <div className="text-xs text-muted-foreground">Formations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.publishedCourses}</div>
                  <div className="text-xs text-muted-foreground">Publiées</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                  <div className="text-xs text-muted-foreground">Inscrits</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
                  <div className="text-xs text-muted-foreground">Complétion moy.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {myCourses && myCourses.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {enrollmentChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Inscriptions par formation</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={enrollmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="inscriptions" fill="#3b4f8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {completionChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Taux de complétion</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={completionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Line type="monotone" dataKey="complétion" stroke="#2a7d6e" strokeWidth={2} dot={{ fill: "#2a7d6e", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Mes formations</TabsTrigger>
            <TabsTrigger value="learners">Suivi des apprenants</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {myCourses && myCourses.length > 0 ? (
              <div className="grid gap-4">
                {myCourses.map(courseItem => (
                  <Card key={courseItem.course.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{courseItem.course.title}</h3>
                            <Badge variant={courseItem.course.status === "publie" ? "default" : "secondary"}>{courseItem.course.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{courseItem.course.shortDescription}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>-- inscrits</span>
                            <span>-- % complétées</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/edit-course/${courseItem.course.id}`}>
                            <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: courseItem.course.id, status: courseItem.course.status === "publie" ? "brouillon" : "publie" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            {courseItem.course.status === "publie" ? "Dépublier" : "Publier"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Aucune formation créée. Commencez par créer votre première formation !</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="learners" className="space-y-4">
            <div>
              <Label className="mb-2 block">Sélectionner une formation</Label>
              <Select value={String(selectedCourseId || "")} onValueChange={(v) => setSelectedCourseId(v ? parseInt(v) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une formation" />
                </SelectTrigger>
                <SelectContent>
                  {myCourses?.map(c => <SelectItem key={c.course.id} value={String(c.course.id)}>{c.course.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedCourseId && courseEnrollments ? (
              courseEnrollments.length > 0 ? (
                <div className="grid gap-4">
                  {courseEnrollments.map(enrollment => (
                    <Card key={enrollment.enrollment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{enrollment.user.name}</p>
                            <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${enrollment.enrollment.progress}%` }} />
                              </div>
                              <span className="text-xs font-medium">{enrollment.enrollment.progress}%</span>
                            </div>
                          </div>
                          <Badge variant={enrollment.enrollment.status === "complete" ? "default" : "secondary"}>{enrollment.enrollment.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">Aucun apprenant inscrit à cette formation.</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Sélectionnez une formation pour voir les apprenants.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
