import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState({
    expirationReminderEnabled: true,
    expirationReminderDays: 7,
    expiredNotificationEnabled: true,
    emailFrom: "noreply@digilearn.manus.space",
    supportEmail: "support@digilearn.manus.space",
    maxRetriesOnFailure: 3,
    retryDelayMinutes: 60,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current settings on mount
  const { data: currentSettings, isLoading: isLoadingSettings } = trpc.admin.notificationSettings.useQuery();
  
  const updateMutation = trpc.admin.updateNotificationSettings.useMutation();

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        expirationReminderEnabled: currentSettings.expirationReminderEnabled ?? true,
        expirationReminderDays: currentSettings.expirationReminderDays ?? 7,
        expiredNotificationEnabled: currentSettings.expiredNotificationEnabled ?? true,
        emailFrom: currentSettings.emailFrom ?? "noreply@digilearn.manus.space",
        supportEmail: currentSettings.supportEmail ?? "support@digilearn.manus.space",
        maxRetriesOnFailure: currentSettings.maxRetriesOnFailure ?? 3,
        retryDelayMinutes: currentSettings.retryDelayMinutes ?? 60,
      });
      setIsLoading(false);
    }
  }, [currentSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await updateMutation.mutateAsync({
        expirationReminderEnabled: settings.expirationReminderEnabled,
        expirationReminderDays: settings.expirationReminderDays,
        expiredNotificationEnabled: settings.expiredNotificationEnabled,
        emailFrom: settings.emailFrom,
        supportEmail: settings.supportEmail,
        maxRetriesOnFailure: settings.maxRetriesOnFailure,
        retryDelayMinutes: settings.retryDelayMinutes,
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Paramètres de Notifications</h1>
          <p className="text-gray-600">Configurez les notifications par email pour les abonnements premium</p>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Paramètres sauvegardés avec succès
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {saveError && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {saveError}
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="expiration" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expiration">Rappels d'Expiration</TabsTrigger>
            <TabsTrigger value="email">Configuration Email</TabsTrigger>
            <TabsTrigger value="retry">Retry & Logs</TabsTrigger>
          </TabsList>

          {/* Expiration Reminders Tab */}
          <TabsContent value="expiration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Rappels d'Expiration d'Abonnement
                </CardTitle>
                <CardDescription>
                  Configurez les notifications pour les abonnements expiration imminente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable Expiration Reminders */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Activer les rappels d'expiration</Label>
                    <p className="text-sm text-gray-600">
                      Envoyer des emails de rappel avant l'expiration de l'abonnement
                    </p>
                  </div>
                  <Switch
                    checked={settings.expirationReminderEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, expirationReminderEnabled: checked })
                    }
                  />
                </div>

                {/* Days Before Expiration */}
                {settings.expirationReminderEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="days">Nombre de jours avant expiration</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.expirationReminderDays}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            expirationReminderDays: parseInt(e.target.value) || 7,
                          })
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">
                        Les rappels seront envoyés {settings.expirationReminderDays} jour
                        {settings.expirationReminderDays > 1 ? "s" : ""} avant l'expiration
                      </span>
                    </div>
                  </div>
                )}

                {/* Enable/Disable Expired Notifications */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Notifier après expiration</Label>
                    <p className="text-sm text-gray-600">
                      Envoyer une notification quand l'abonnement a expiré
                    </p>
                  </div>
                  <Switch
                    checked={settings.expiredNotificationEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, expiredNotificationEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Configuration Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Configuration Email
                </CardTitle>
                <CardDescription>
                  Configurez les adresses email utilisées pour les notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* From Email */}
                <div className="space-y-2">
                  <Label htmlFor="from-email">Adresse email d'envoi</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                    placeholder="noreply@digilearn.manus.space"
                  />
                  <p className="text-sm text-gray-600">
                    Adresse utilisée comme expéditeur des emails de notification
                  </p>
                </div>

                {/* Support Email */}
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@digilearn.manus.space"
                  />
                  <p className="text-sm text-gray-600">
                    Adresse de support affichée dans les emails
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retry & Logs Tab */}
          <TabsContent value="retry" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Retry & Logs</CardTitle>
                <CardDescription>
                  Configurez la politique de retry pour les emails échoués
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max Retries */}
                <div className="space-y-2">
                  <Label htmlFor="max-retries">Nombre maximum de tentatives</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxRetriesOnFailure}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxRetriesOnFailure: parseInt(e.target.value) || 3,
                      })
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-gray-600">
                    Nombre de fois où relancer l'envoi d'un email échoué
                  </p>
                </div>

                {/* Retry Delay */}
                <div className="space-y-2">
                  <Label htmlFor="retry-delay">Délai entre les tentatives (minutes)</Label>
                  <Input
                    id="retry-delay"
                    type="number"
                    min="5"
                    max="1440"
                    step="5"
                    value={settings.retryDelayMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        retryDelayMinutes: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-gray-600">
                    Attendre {settings.retryDelayMinutes} minute
                    {settings.retryDelayMinutes > 1 ? "s" : ""} avant de relancer
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => window.history.back()}>
            Retour
          </Button>
          <Button onClick={handleSave} disabled={isSaving || updateMutation.isPending}>
            {(isSaving || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving || updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder les paramètres"}
          </Button>
        </div>
      </div>
    </div>
  );
}
