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
  GraduationCap, BookOpen, Users, Plus, LogOut, Edit, Eye, BarChart3
} from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";

export default function FormateurDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: myCourses, refetch } = trpc.courses.formateurCourses.useQuery(undefined, { enabled: isAuthenticated });
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { data: courseEnrollments } = trpc.courses.enrollments.useQuery(
    { courseId: selectedCourseId || 0 },
    { enabled: !!selectedCourseId }
  );

  const [newCourse, setNewCourse] = useState({ title: "", slug: "", description: "", shortDescription: "", categoryId: 0, price: "0", level: "debutant" as const, status: "brouillon" as const, tags: "" });
  const [showCreate, setShowCreate] = useState(false);

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => { toast.success("Formation créée"); setShowCreate(false); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Chargement...</div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }
  if (user?.role !== "formateur" && user?.role !== "admin") { navigate("/dashboard"); return null; }

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
                  <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} />
                </div>
                <div>
                  <Label>Description courte</Label>
                  <Input value={newCourse.shortDescription} onChange={(e) => setNewCourse({ ...newCourse, shortDescription: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={newCourse.categoryId.toString()} onValueChange={(v) => setNewCourse({ ...newCourse, categoryId: Number(v) })}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prix (XOF)</Label>
                    <Input type="number" value={newCourse.price} onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Niveau</Label>
                    <Select value={newCourse.level} onValueChange={(v: any) => setNewCourse({ ...newCourse, level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debutant">Débutant</SelectItem>
                        <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                        <SelectItem value="avance">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tags (séparés par virgule)</Label>
                    <Input value={newCourse.tags} onChange={(e) => setNewCourse({ ...newCourse, tags: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate(newCourse)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Création..." : "Créer la formation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Mes formations</TabsTrigger>
            <TabsTrigger value="students">Suivi des apprenants</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {myCourses?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Aucune formation</h3>
                  <p className="text-sm text-muted-foreground">Créez votre première formation.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myCourses?.map((item) => (
                  <Card key={item.course.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{item.category?.name || "Général"}</Badge>
                        <Badge variant={item.course.status === "publie" ? "default" : "outline"} className="text-xs">{item.course.status}</Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{item.course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.course.shortDescription}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedCourseId(item.course.id)}>
                          <Users className="mr-1 h-3 w-3" /> Apprenants
                        </Button>
                        <Link href={`/course/${item.course.slug}`}>
                          <Button size="sm" variant="outline"><Eye className="mr-1 h-3 w-3" /> Voir</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suivi des apprenants</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {myCourses?.map((item) => (
                    <Button
                      key={item.course.id}
                      size="sm"
                      variant={selectedCourseId === item.course.id ? "default" : "outline"}
                      onClick={() => setSelectedCourseId(item.course.id)}
                    >
                      {item.course.title}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedCourseId ? (
                  <p className="text-muted-foreground text-sm">Sélectionnez une formation pour voir les apprenants.</p>
                ) : courseEnrollments?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun apprenant inscrit.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium">Apprenant</th>
                          <th className="pb-3 font-medium">Statut</th>
                          <th className="pb-3 font-medium">Progression</th>
                          <th className="pb-3 font-medium">Date d'inscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseEnrollments?.map((item) => (
                          <tr key={item.enrollment.id} className="border-b last:border-0">
                            <td className="py-3">{item.user.name || "—"}</td>
                            <td className="py-3"><Badge variant="outline" className="text-xs">{item.enrollment.status}</Badge></td>
                            <td className="py-3">{item.enrollment.progress}%</td>
                            <td className="py-3 text-muted-foreground">{new Date(item.enrollment.enrolledAt).toLocaleDateString("fr-FR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
