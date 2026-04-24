import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  GraduationCap, Users, Linkedin, Building2, Briefcase, ArrowLeft
} from "lucide-react";

export default function Alumni() {
  const { isAuthenticated } = useAuth();
  const { data: alumni } = trpc.alumni.directory.useQuery();

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
            {isAuthenticated && <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Mon espace</Link>}
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Annuaire Alumni DigiLearn</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Découvrez les professionnels formés par DigiLearn et développez votre réseau.
          </p>
        </div>

        {alumni?.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Annuaire en construction</h3>
              <p className="text-sm text-muted-foreground">Les premiers alumni seront bientôt visibles ici.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni?.map((item) => (
              <Card key={item.profile.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {(item.user.name || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.user.name || "Alumni"}</h3>
                      {item.profile.jobTitle && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {item.profile.jobTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.profile.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Building2 className="h-3.5 w-3.5" /> {item.profile.company}
                    </div>
                  )}
                  {item.profile.graduationYear && (
                    <Badge variant="secondary" className="text-xs mb-2">Promotion {item.profile.graduationYear}</Badge>
                  )}
                  {item.profile.linkedinUrl && (
                    <a href={item.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                      <Linkedin className="h-3.5 w-3.5" /> Profil LinkedIn
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
