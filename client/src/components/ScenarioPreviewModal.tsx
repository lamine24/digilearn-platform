import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Edit2, Download } from "lucide-react";
import { useState } from "react";

interface ScenarioPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: {
    title: string;
    description: string;
    learningObjectives?: string;
    contentStructure?: string;
    interactiveElements?: string;
    pedagogicalModel?: string;
  } | null;
  isLoading?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onModify?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
}

export function ScenarioPreviewModal({
  open,
  onOpenChange,
  scenario,
  isLoading = false,
  onSave,
  onCancel,
  onModify,
  onExport,
  isSaving = false,
  isExporting = false,
}: ScenarioPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!scenario) return null;

  // Parse JSON content if it's a string
  const parseContent = (content: string | undefined) => {
    if (!content) return "";
    try {
      if (typeof content === "string" && content.startsWith("{")) {
        return JSON.stringify(JSON.parse(content), null, 2);
      }
      return content;
    } catch {
      return content;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Prévisualisation du Scénario
          </DialogTitle>
          <DialogDescription>
            Vérifiez le contenu généré avant de le sauvegarder définitivement
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Génération en cours...</span>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="objectives">Objectifs</TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="interactive">Interactif</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(90vh-300px)] mt-4">
                <TabsContent value="overview" className="pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Modèle Pédagogique</h3>
                        <p className="text-sm text-muted-foreground">{scenario.pedagogicalModel || "Non spécifié"}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                          {scenario.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="objectives" className="pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Objectifs d'Apprentissage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                        {parseContent(scenario.learningObjectives) || "Aucun objectif défini"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Structure du Contenu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded max-h-96 overflow-auto">
                        {parseContent(scenario.contentStructure) || "Aucune structure définie"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="interactive" className="pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Éléments Interactifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                        {parseContent(scenario.interactiveElements) || "Aucun élément interactif défini"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  onCancel?.();
                  onOpenChange(false);
                }}
                disabled={isSaving || isExporting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>

              {onModify && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onModify();
                    onOpenChange(false);
                  }}
                  disabled={isSaving || isExporting}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}

              {onExport && (
                <Button
                  variant="outline"
                  onClick={onExport}
                  disabled={isSaving || isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Export en cours..." : "Exporter"}
                </Button>
              )}

              <Button
                onClick={() => {
                  onSave?.();
                  onOpenChange(false);
                }}
                disabled={isSaving || isExporting}
              >
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
