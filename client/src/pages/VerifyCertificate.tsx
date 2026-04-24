import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { GraduationCap, Shield, CheckCircle2, XCircle, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function VerifyCertificate() {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const { data, isLoading, error } = trpc.certificates.verify.useQuery(
    { code: searchCode },
    { enabled: !!searchCode, retry: false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) setSearchCode(code.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
        </div>
      </nav>

      <div className="container py-16 max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>

        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vérifier un certificat</h1>
          <p className="text-muted-foreground">Entrez le code du certificat DigiLearn pour vérifier son authenticité.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            placeholder="Ex: DL-CERT-XXXXXXXXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-base h-12"
          />
          <Button type="submit" size="lg" disabled={isLoading || !code.trim()}>
            <Search className="mr-2 h-4 w-4" /> Vérifier
          </Button>
        </form>

        {isLoading && <div className="text-center text-muted-foreground animate-pulse">Vérification en cours...</div>}

        {error && searchCode && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-destructive mb-1">Certificat non trouvé</h3>
              <p className="text-sm text-muted-foreground">Le code "{searchCode}" ne correspond à aucun certificat DigiLearn.</p>
            </CardContent>
          </Card>
        )}

        {data && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-emerald-700">Certificat authentique</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Titulaire</span><span className="font-medium">{data.userName}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Formation</span><span className="font-medium">{data.courseName}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Date d'émission</span><span className="font-medium">{new Date(data.issuedAt).toLocaleDateString("fr-FR")}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Code</span><span className="font-mono text-xs">{data.code}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground">Vérifications</span><span className="font-medium">{data.verifiedCount} fois</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
