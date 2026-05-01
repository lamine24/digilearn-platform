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

- [ ] Réorganisation des ressources par drag & drop (accès depuis EditCourse + test complet)
- [ ] Réorganisation des modules par drag & drop (intégration dans FormateurDashboard + test)
- [ ] Sauvegarde automatique de l'ordre des modules/ressources (wiring complet + UX)
