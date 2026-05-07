import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Lock, CreditCard, BookOpen } from "lucide-react";

export function PremiumAccessGuide() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Accès aux Ressources Premium</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Toutes les ressources libres de DigiLearn sont des contenus premium. Pour y accéder, veuillez suivre ces étapes :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Étape 1 */}
            <div className="flex gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Cliquer sur "Infos"</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Consultez les détails de la ressource pour mieux comprendre son contenu
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="flex gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Cliquer sur "S'abonner"</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Choisissez un plan d'abonnement adapté à vos besoins (Mensuel, Trimestriel, Annuel)
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="flex gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Accéder à la ressource</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Une fois abonné, le bouton "Accéder" devient actif et vous pouvez consulter la ressource
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Avantages de l'abonnement</p>
                <ul className="text-xs text-green-800 mt-1 space-y-1">
                  <li>✓ Accès illimité à toutes les ressources libres</li>
                  <li>✓ Certificats de complétion téléchargeables</li>
                  <li>✓ Suivi de votre progression personnalisé</li>
                  <li>✓ Support prioritaire</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex gap-2">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Paiement sécurisé</p>
                <p className="text-xs text-amber-800 mt-1">
                  Tous les paiements sont traités de manière sécurisée via Paytech. Vos données bancaires sont protégées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
