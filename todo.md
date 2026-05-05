# DigiLearn - TODO

## Infrastructure & Configuration
- [x] Schéma de base de données complet
- [x] Configuration des secrets PayTech
- [x] Stockage sécurisé S3

## Frontend Public
- [x] Page d'accueil publique
- [x] Catalogue de formations avec filtres
- [x] Page de détail d'une formation
- [x] Tunnel d'inscription 3 étapes
- [x] Design responsive

## Authentification
- [x] Authentification multi-rôles
- [x] Redirection automatique par rôle

## Gestion des Modules (PRIORITAIRE)
- [x] Création de modules (tous types)
- [x] Modification de modules (éditer, mettre à jour)
- [x] Suppression de modules
- [x] Support Zoom/Visioconférence (lien, date/heure)
- [x] Upload de vidéos (S3 streaming) - endpoint /api/upload implémenté
- [x] Upload de ressources (PDF, documents) - endpoint /api/upload implémenté
- [x] Aperçu des modules pour formateurs
- [x] Réorganisation des modules (drag & drop avec @dnd-kit)

## Gestion des Ressources par Module
- [x] Création de ressources (upload, types multiples)
- [x] Modification de ressources
- [x] Suppression de ressources
- [x] Téléchargement des ressources par apprenants
- [x] Filigrane sur les PDF téléchargés
- [x] Aperçu des ressources
- [x] Prévisualisation des ressources pour formateurs (avant publication)

## Tableaux de Bord
- [x] Dashboard Apprenant : vraies données + graphiques (Radar, Bar, Pie charts)
- [x] Dashboard Formateur : statistiques complètes (Bar, Line charts, suivi apprenants)
- [x] Dashboard Admin : KPIs temps réel avec graphiques (Pie, Line, Bar charts)
- [x] Gestion des utilisateurs complète

## Paiements & Certificats
- [x] Page de paiement PayTech fonctionnelle (redirection, formulaire)
- [x] Webhook IPN PayTech (vérification signature, mise à jour statut)
- [x] Génération PDF certificats avec QR Code (pdf-lib)
- [x] Téléchargement certificats (endpoint + UI avec bouton dans Learn)
- [x] Vérification certificats via QR Code (page de vérification fonctionnelle)

## Notifications & Relances
- [x] Notifications email (SMTP avec nodemailer)
- [x] Relances après 3 jours inactivité (job automatisé)
- [x] Notifications in-app complètes

## Fonctionnalités Avancées
- [x] Chatbot hybride
- [x] Espace Alumni avec annuaire (page + procédure tRPC)
- [x] Suivi assiduité apprenants (job d'inactivité + tracking)
- [x] Statistiques d'engagement (dashboards avec graphiques)


## 🐛 Bugs Corrigés (Session Actuelle)
- [x] Formateur ne peut pas ajouter de formations (page CreateCourse créée)
- [x] Formateur ne peut pas ajouter de modules aux formations (formulaire dans EditCourse OK)
- [x] Impossible d'ajouter des ressources aux modules (formulaire dans EditCourse OK)
- [x] Erreurs dans les formulaires de création (lien EditCourse corrigé)


## 🆕 Nouvelles Fonctionnalités (Session Actuelle)
- [x] Barre de progression pour upload de ressources (composant FileUpload)
- [x] Glisser-déposer (drag & drop) pour fichiers (intégré dans FileUpload)
- [x] Validation des types de fichiers (multer + frontend)
- [x] Affichage des erreurs d'upload en temps réel (messages d'erreur)

- [x] Réorganisation des ressources par drag & drop (composant SimpleResourceReorder + page ReorderResources)
- [x] Réorganisation des modules par drag & drop (intégration dans FormateurDashboard)
- [x] Sauvegarde automatique de l'ordre des modules/ressources (procédures tRPC reorder)


## 🌐 Intégration des Cours Externes
- [x] Schéma ExternalCourse dans la base de données
- [x] Procédures tRPC pour gérer les cours externes (list, getBySlug, create, update, delete)
- [x] UI Admin pour ajouter des cours externes (AdminExternalCourses page)
- [x] Modèle d'abonnement mensuel/annuel/à vie (10 000 FCFA, 100 000 FCFA, 500 000 FCFA)
- [x] Intégration PayTech pour les abonnements (endpoint /api/paytech/subscription/init)
- [x] Page d'abonnement avec 3 plans (SubscriptionPage)
- [x] Affichage des cours externes dans le catalogue (ExternalCoursesCatalog)
- [x] Vérification de l'abonnement avant accès (procédure tRPC isSubscribed)
- [x] Redirection vers le cours externe (lien externe dans nouvelle fenêtre)
- [x] Tests unitaires pour external courses et subscriptions
- [x] Migrations de base de données (tables externalCourses et subscriptions créées automatiquement au démarrage)
- [x] Vérification complète du flux d'abonnement en production (tests unitaires + seed de données)


## 🔍 Recherche et Filtrage Avancés (Nouvelle Session)
- [x] Helpers de recherche full-text en base de données (search-db.ts)
- [x] Procédures tRPC pour recherche et filtrage (search-router.ts avec searchCourses, getFilters, getSuggestions)
- [x] Composant FilterPanel réutilisable (catégorie, niveau, prix, durée, formateur)
- [x] Composant SearchBar avec suggestions et autocomplete
- [x] Page de recherche avec résultats en temps réel (SearchPage avec pagination)
- [x] Intégration de la recherche dans le catalogue existant (lien "Rechercher" dans Home)
- [x] Tri par pertinence, popularité, prix (croissant/décroissant), date
- [x] Tests unitaires pour recherche et filtrage (search.test.ts)
- [x] Sauvegarde des préférences de filtrage (localStorage avec hook useSearchPreferences)
- [x] Historique de recherche utilisateur (avec limite de 20 entrées, getUniqueQueries, getRecentSearches)


## 📄 Page de Détails Cours Externes (Nouvelle Session)
- [x] Helpers DB pour récupérer cours similaires et détails (getSimilarCourses, getRelatedCourses, getCourseStats)
- [x] Procédures tRPC pour détails et recommandations (getDetail, getSimilar, getRelated, getStats)
- [x] Page ExternalCourseDetail avec layout professionnel (header, détails, recommandations, CTA)
- [x] Composants réutilisables (RatingBadge, PlatformBadge, CourseAccessButton)
- [x] Intégration dans le catalogue (liens vers détails via /external-course/:slug)
- [x] Tests unitaires pour page de détails (external-course-detail.test.ts)


## ⭐ Système de Favoris (Nouvelle Session)
- [x] Schéma DB pour favoris (table favorites avec userId, courseId, externalCourseId, courseType)
- [x] Helpers DB pour ajouter/retirer/lister les favoris (addFavorite, removeFavorite, isFavorited, getUserFavorites, etc.)
- [x] Procédures tRPC pour gérer les favoris (add, remove, list, isFavorited, listCourses, listExternalCourses, count, clear)
- [x] Composant FavoriteButton réutilisable avec icône cœur (tailles sm/md/lg, variantes)
- [x] Intégration des favoris dans le catalogue de cours (ExternalCoursesCatalog avec FavoriteButton)
- [x] Intégration des favoris dans les pages de détails (ExternalCourseDetail avec FavoriteButton)
- [x] Page de favoris avec liste complète et gestion (FavoritesPage avec onglets Tous/Internes/Externes)
- [x] Tests unitaires pour le système de favoris (favorites.test.ts avec 11 tests)


## 📚 Intégration des Ressources Éducatives Libres (Nouvelle Session)
- [x] Schéma DB pour ressources libres (table freeResources avec Khan Academy, MIT OCW, StatLearning, Open Learning Campus, Canal-U)
- [x] Helpers DB pour récupérer et filtrer les ressources libres (getFreeResources, searchFreeResources, etc.)
- [x] Procédures tRPC pour lister, filtrer et rechercher les ressources libres (list, getBySlug, getByPlatform, search, etc.)
- [x] Composant de catalogue pour ressources libres (FreeResourceCard avec badges et infos)
- [x] Page de ressources libres avec filtrage avancé (FreeResourcesPage avec plateforme/catégorie/niveau/tri)
- [x] Intégration dans le catalogue principal (lien "Ressources Libres" dans Home)
- [x] Tests unitaires pour les ressources libres (free-resources.test.ts avec 12 tests)
- [x] Seed de données de test (9 ressources seedées au démarrage)


## 📚 Enrichissement des Ressources Libres (Nouvelle Session)
- [x] Ajouter 8 nouvelles plateformes au seed (OpenLearn, Saylor Academy, AUF, UNESCO OER Commons, Bookdown, FUN-MOOC)
- [x] Mettre à jour l'UI pour afficher les nouvelles plateformes (platformOptions + description header)
- [x] Ajouter des tests pour les nouvelles ressources (86 tests passent)
- [x] Vérifier l'intégration complète (TypeScript compilation OK, 16 ressources seedées)


## 🎜 Prévisualisation des Cours dans le Catalogue (Nouvelle Session)
- [x] Composant modal CoursePreviewModal avec layout professionnel
- [x] Lecteur vidéo intégré (YouTube avec extraction d'ID automatique)
- [x] Affichage des informations clés (durée, niveau, instructeur, évaluation)
- [x] Avis et commentaires utilisateurs dans la prévisualisation (onglet avis)
- [x] Boutons d'action (S'inscrire, Ajouter aux favoris, Partager)
- [x] Intégration dans le catalogue (ExternalCoursesCatalog avec bouton Aperçu)
- [x] Animations fluides et transitions (Dialog + Tabs)
- [x] Tests unitaires pour la prévisualisation (course-preview.test.ts avec 18 tests)


## 🔄 Refactoring Phase (Session Actuelle)
- [x] Supprimer la section "Cours Externes" (pages, routes, composants)
- [x] Supprimer les tables de base de données liées aux cours externes (externalCourses, subscriptions)
- [x] Ajouter des boutons "Retour à l'accueil" dans toutes les pages (BackButton component)
- [x] Ajouter plus de ressources libres au seed (30+ ressources au total)
- [x] Implémenter le partage sur les réseaux sociaux (Facebook, LinkedIn, Twitter, WhatsApp, Email)
- [x] Refactoriser le modèle d'abonnement à un seul plan 10 000 FCFA/mois
- [x] Tester tous les flux et corriger les bugs (8/8 tests premium passent)


## 🔗 Intégration du Webhook PayTech (Session Actuelle)
- [x] Examiner l'implémentation existante du webhook PayTech
- [x] Améliorer le gestionnaire IPN pour activer les abonnements premium
- [x] Ajouter le suivi des paiements et la gestion d'erreurs
- [x] Créer les utilitaires de sécurité et de vérification du webhook
- [x] Implémenter l'idempotence des webhooks (éviter les doublons)
- [x] Ajouter la limitation de débit (rate limiting) pour les webhooks
- [x] Écrire les tests d'intégration du webhook (15 tests, tous passants)
- [x] Vérifier le flux end-to-end du paiement premium
- [x] Intégrer les notifications utilisateur après activation de l'abonnement

**Résumé :** Le webhook PayTech est maintenant complètement intégré pour automatiser l'activation des abonnements premium après paiement réussi. Les mesures de sécurité incluent la vérification de signature, l'idempotence, la limitation de débit et la gestion des erreurs avec retry.


## 🔐 Contrôle d'Accès Premium (Session Actuelle)
- [x] Créer les utilitaires de vérification d'abonnement premium
- [x] Implémenter le wrapper tRPC pour les procédures premium
- [x] Ajouter les hooks React pour l'accès au contenu premium
- [x] Protéger les endpoints des ressources et cours premium
- [x] Créer les composants de portail d'accès premium (PremiumGate, PremiumBadge, etc.)
- [x] Écrire les tests de contrôle d'accès (20 tests, tous passants)
- [x] Tester le flux end-to-end de restriction d'accès


## 🚪 Intégration PremiumGate dans les Pages (Session Actuelle)
- [x] Intégrer PremiumGate dans FreeResourceDetail
- [x] Intégrer PremiumGate dans SearchPage
- [x] Ajouter redirection d'authentification pour utilisateurs non authentifiés
- [x] Créer tests pour PremiumGate (composant, états de chargement, utilisateurs premium/non-premium)
- [x] Vérifier que le serveur de développement fonctionne sans erreurs TypeScript
