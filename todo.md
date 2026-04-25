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
- [ ] Réorganisation des modules (drag & drop)

## Gestion des Ressources par Module
- [x] Création de ressources (upload, types multiples)
- [x] Modification de ressources
- [x] Suppression de ressources
- [x] Téléchargement des ressources par apprenants
- [x] Filigrane sur les PDF téléchargés
- [x] Aperçu des ressources
- [ ] Prévisualisation des ressources pour formateurs (avant publication)

## Tableaux de Bord
- [ ] Dashboard Apprenant : vraies données + graphiques
- [ ] Dashboard Formateur : statistiques complètes
- [ ] Dashboard Admin : KPIs temps réel avec graphiques
- [ ] Gestion des utilisateurs complète

## Paiements & Certificats
- [ ] Page de paiement PayTech fonctionnelle
- [ ] Webhook IPN PayTech
- [ ] Génération PDF certificats avec QR Code
- [ ] Téléchargement certificats
- [ ] Vérification certificats via QR Code

## Notifications & Relances
- [ ] Notifications email (SMTP)
- [ ] Relances après 3 jours inactivité
- [ ] Notifications in-app complètes

## Fonctionnalités Avancées
- [x] Chatbot hybride
- [ ] Espace Alumni avec annuaire
- [ ] Suivi assiduité apprenants
- [ ] Statistiques d'engagement
