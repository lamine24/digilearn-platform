import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  GraduationCap, BookOpen, Award, Users, BarChart3, Brain,
  Code, Target, TrendingUp, Calculator, ArrowRight, CheckCircle2,
  Play, Star, ChevronRight, Shield, Zap
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, any> = { BarChart3, TrendingUp, Code, Target, Brain, Calculator };

function formatPrice(price: string, currency: string) {
  const num = Number(price);
  if (num === 0) return "Gratuit";
  return `${num.toLocaleString("fr-FR")} ${currency}`;
}

function levelLabel(level: string) {
  return { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" }[level] || level;
}

function levelColor(level: string) {
  return { debutant: "bg-emerald-100 text-emerald-700", intermediaire: "bg-amber-100 text-amber-700", avance: "bg-rose-100 text-rose-700" }[level] || "";
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: coursesData } = trpc.courses.published.useQuery({});
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCourses = selectedCategory
    ? coursesData?.filter(c => c.category?.slug === selectedCategory)
    : coursesData;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#catalogue" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Catalogue</a>
            <a href="#avantages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Avantages</a>
            <a href="#temoignages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Témoignages</a>
            <Link href="/verify-certificate" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Vérifier un certificat</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Mon espace <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { window.location.href = getLoginUrl(); }}>Se connecter</Button>
                <Button onClick={() => { window.location.href = getLoginUrl(); }}>
                  S'inscrire <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Plateforme de formation certifiante
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              Développez vos compétences avec{" "}
              <span className="gradient-text">DigiLearn</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Formations certifiantes en Data Science, Finance, Développement Web et Intelligence Artificielle.
              Un apprentissage par micro-modules conçu pour les professionnels africains.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#catalogue">
                <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/25">
                  Explorer le catalogue <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Link href="/verify-certificate">
                <Button size="lg" variant="outline" className="text-base px-8 h-12">
                  Vérifier un certificat <Shield className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Micro-modules 5-10 min</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Certificats vérifiables</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Paiement local</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "6+", label: "Formations", icon: BookOpen },
              { value: "20+", label: "Micro-modules", icon: Play },
              { value: "6", label: "Domaines", icon: BarChart3 },
              { value: "100%", label: "En ligne", icon: Zap },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Nos domaines de formation</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des parcours structurés pour développer des compétences recherchées sur le marché africain et international.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>Tous</Button>
            {categoriesData?.map((cat) => {
              const Icon = iconMap[cat.iconName || ""] || BookOpen;
              return (
                <Button key={cat.slug} variant={selectedCategory === cat.slug ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.slug)}>
                  <Icon className="mr-1.5 h-3.5 w-3.5" /> {cat.name}
                </Button>
              );
            })}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses?.map((item) => (
              <Link key={item.course.id} href={`/course/${item.course.slug}`}>
                <Card className="group h-full hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">{item.category?.name || "Général"}</Badge>
                      <Badge className={`text-xs ${levelColor(item.course.level)}`}>{levelLabel(item.course.level)}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{item.course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.course.shortDescription || item.course.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Play className="h-3 w-3" /> {item.course.duration} min</span>
                      <span className="font-bold text-primary">{formatPrice(item.course.price, item.course.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Pourquoi choisir DigiLearn ?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Une plateforme conçue pour l'excellence pédagogique et l'accessibilité en Afrique de l'Ouest.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Micro-learning", desc: "Des modules de 5 à 10 minutes pour un apprentissage efficace, adapté à votre rythme." },
              { icon: Award, title: "Certifications vérifiables", desc: "Certificats PDF avec QR Code de vérification, reconnus par les employeurs." },
              { icon: Shield, title: "Paiement sécurisé", desc: "Intégration PayTech pour Wave, Orange Money et paiements locaux." },
              { icon: Brain, title: "Chatbot intelligent", desc: "Un assistant IA disponible 24/7 pour vous guider dans votre parcours." },
              { icon: Users, title: "Réseau Alumni", desc: "Accédez à un annuaire dynamique de professionnels formés par DigiLearn." },
              { icon: BarChart3, title: "Suivi de progression", desc: "Tableaux de bord visuels pour suivre vos compétences et votre avancement." },
            ].map((item) => (
              <Card key={item.title} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section id="temoignages" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ce qu'en disent nos apprenants</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Aminata D.", role: "Data Analyst, Dakar", text: "DigiLearn m'a permis de maîtriser Python et pandas en quelques semaines. Les micro-modules sont parfaits pour apprendre entre deux réunions." },
              { name: "Ousmane K.", role: "Chef de projet, Abidjan", text: "La certification Gestion de Projet Agile m'a ouvert des portes. Le format est adapté aux réalités africaines." },
              { name: "Fatou S.", role: "Chercheuse, Saint-Louis", text: "Les cours de statistiques et d'économétrie sont d'un niveau académique remarquable. Je recommande vivement." },
            ].map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Prêt à transformer votre carrière ?</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">Rejoignez DigiLearn et accédez à des formations certifiantes de qualité.</p>
              <Button size="lg" variant="secondary" className="text-base px-8 h-12 shadow-lg" onClick={() => { window.location.href = getLoginUrl(); }}>
                Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><GraduationCap className="h-4 w-4 text-primary-foreground" /></div>
                <span className="font-bold">DigiLearn</span>
              </div>
              <p className="text-sm text-muted-foreground">Plateforme de formation certifiante par Digistat-Analysis.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Formation</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#catalogue" className="block hover:text-foreground transition-colors">Catalogue</a>
                <Link href="/verify-certificate" className="block hover:text-foreground transition-colors">Vérifier un certificat</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Plateforme</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#avantages" className="block hover:text-foreground transition-colors">Avantages</a>
                <a href="#temoignages" className="block hover:text-foreground transition-colors">Témoignages</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Digistat-Analysis</p>
                <p>Sénégal</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DigiLearn par Digistat-Analysis. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
