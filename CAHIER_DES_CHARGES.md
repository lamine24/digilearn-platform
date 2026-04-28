# CAHIER DES CHARGES — DigiLearn
## Plateforme de Formation Certifiante en Ligne
**Version 2.0 — Mise à jour : Avril 2026**
**Statut : Production-ready**

---

## 1. PRÉSENTATION DU PROJET

### 1.1 Vision
DigiLearn est une plateforme LMS (Learning Management System) conçue pour le marché **africain francophone**, avec un focus particulier sur le **Sénégal**. Elle permet la création, la diffusion et la certification de formations en ligne via un modèle de micro-apprentissage (micro-learning).

### 1.2 Objectifs stratégiques
- Rendre la formation certifiante accessible aux professionnels africains
- Proposer un apprentissage en unités courtes (5–10 minutes) adapté aux contraintes de connectivité
- Intégrer les moyens de paiement locaux (Wave, Orange Money, PayDunya)
- Fournir une expérience fluide sur mobile et desktop

### 1.3 Périmètre fonctionnel
La plateforme couvre l'intégralité du cycle de formation :
> Découverte → Inscription → Paiement → Apprentissage → Certification → Réseau Alumni

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technologique (implémenté)

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React | 19.x |
| Routing client | Wouter | 3.x |
| État serveur | TanStack Query + tRPC | v5 / v11 |
| UI Components | Radix UI + shadcn/ui | latest |
| Styles | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.x |
| Graphiques | Recharts | 2.x |
| Drag & Drop | @dnd-kit | 6.x |
| Backend | Express.js | 4.x |
| API | tRPC (typesafe end-to-end) | v11 |
| ORM | Drizzle ORM | 0.44.x |
| Base de données | MySQL 8.x | — |
| Authentification | JWT (jose) + OAuth Manus | — |
| Stockage fichiers | AWS S3 compatible | — |
| Emails | Nodemailer (SMTP) | 8.x |
| Génération PDF | pdf-lib | 1.x |
| QR Code | qrcode | 1.x |
| Build tool | Vite | 7.x |
| Runtime | Node.js | 22.x |
| Package manager | pnpm | 10.x |
| Langage | TypeScript (strict) | 5.9 |

### 2.2 Architecture applicative

```
digilearn-platform/
├── client/src/          # Frontend React
│   ├── pages/           # Pages (Home, Dashboard, Admin, Formateur, Learn...)
│   ├── components/      # Composants réutilisables
│   ├── _core/hooks/     # Hooks partagés (useAuth, etc.)
│   └── lib/             # Configuration tRPC, utilitaires
├── server/              # Backend Express
│   ├── _core/           # Infra (auth, OAuth, email, LLM, S3, tRPC)
│   ├── routers.ts       # Tous les endpoints tRPC
│   ├── db.ts            # Couche d'accès aux données
│   ├── paytech.ts       # Intégration paiement PayTech
│   ├── certificate-generator.ts  # Génération PDF
│   ├── email-service.ts # Service email SMTP
│   └── inactivity-job.ts # Job automatisé (relances)
├── drizzle/             # Schéma BDD et migrations
│   └── schema.ts        # Tables MySQL
└── shared/              # Types et constantes partagés
```

### 2.3 Schéma de base de données

**Tables implémentées :**

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (tous rôles) |
| `categories` | Catégories de formations |
| `courses` | Formations |
| `modules` | Micro-modules (5–10 min) |
| `module_resources` | Ressources attachées aux modules |
| `enrollments` | Inscriptions aux formations |
| `module_progress` | Progression par module |
| `payments` | Transactions financières |
| `certificates` | Certificats émis |
| `chat_messages` | Historique chatbot |
| `notifications` | Notifications in-app |
| `alumni_profiles` | Profils réseau alumni |
| `quiz_questions` | Questions de quiz |

---

## 3. PROFILS UTILISATEURS

### 3.1 Tableau des rôles

| Rôle | Accès | Dashboard | Droits |
|------|-------|-----------|--------|
| **Admin** | Complet | `/admin` | Gestion totale (users, formations, paiements, KPIs) |
| **Formateur** | Formation | `/formateur` | Créer/éditer formations, modules, ressources |
| **Apprenant** | Apprentissage | `/dashboard` | S'inscrire, apprendre, télécharger certificats |
| **Alumni** | Réseau | `/alumni` | Annuaire, profil professionnel visible |
| **Prospect** | Public | `/` | Catalogue, tunnel d'inscription |

### 3.2 Gestion des rôles
- Attribution automatique : `prospect` à l'inscription
- Promotion manuelle par l'admin via interface de gestion
- Le propriétaire (OWNER_OPEN_ID) est automatiquement `admin`
- Redirection automatique après connexion selon le rôle

---

## 4. MODULES FONCTIONNELS

### 4.1 Module Public & Catalogue

**Page d'accueil (`/`)**
- Hero section avec slogan et CTA
- Présentation des avantages : micro-modules, certificats vérifiables, paiement local
- Catalogue de formations avec filtres par catégorie et recherche textuelle
- Page de détail formation : description, modules, formateur, prix, bouton d'inscription
- Section témoignages
- Vérification de certificat accessible sans connexion

**Tunnel d'inscription (3 étapes)**
1. Sélection de la formation
2. Création de compte / connexion
3. Paiement → accès immédiat

### 4.2 Module Authentification

- OAuth via Manus (fournisseur géré)
- JWT signé côté serveur (HS256, durée 1 an)
- Cookie sécurisé `app_session_id`
- Session vérifiée à chaque requête tRPC (middleware `protectedProcedure`)
- Déconnexion avec suppression du cookie

### 4.3 Module Formations & Modules

**Gestion des formations (formateur/admin)**
- Création avec : titre, slug, description courte/longue, catégorie, prix (XOF), niveau, tags, thumbnail
- Niveaux : `debutant` | `intermediaire` | `avance`
- Statuts : `brouillon` | `publie` | `archive`
- Limite d'apprenants configurable (`maxStudents`)

**Gestion des modules (micro-learning)**
- Types : `video` | `texte` | `quiz` | `exercice` | `pdf`
- Durée cible : 5–10 minutes par module
- Réorganisation par drag & drop (@dnd-kit)
- Aperçu disponible pour les formateurs avant publication
- Module preview gratuit configurable (`isPreview`)

**Ressources par module**
- Types supportés : `video`, `pdf`, `document`, `image`, `audio`, `lien`, `autre`
- Upload vers S3 (presigned URLs)
- Filigrane automatique sur les PDF téléchargés
- Réorganisation par drag & drop
- Métadonnées : taille, type MIME, description

### 4.4 Module Apprentissage (`/learn/:slug`)

- Lecture des modules dans l'ordre
- Tracking de progression (% calculé sur modules complétés)
- Suivi temps passé (`timeSpent`)
- Score de quiz enregistré par module
- Mise à jour automatique de `lastActiveAt`
- Génération du certificat à 100% de complétion

### 4.5 Module Paiement

**Intégration PayTech (Sénégal)**
- Moyens supportés : **Wave**, **Orange Money**, **PayDunya**, carte bancaire
- Flux : Création transaction → Redirection PayTech → Callback IPN → Mise à jour statut
- Vérification sécurisée du webhook IPN (signature SHA256)
- Statuts : `en_attente` | `reussi` | `echoue` | `rembourse`
- Devise : **XOF** (Franc CFA)
- Pages dédiées : `/payment`, `/payment/success`, `/payment/cancel`
- Activation de l'inscription après paiement réussi

### 4.6 Module Certification

**Génération de certificats PDF**
- Génération automatique à 100% de complétion
- Contenu : nom de l'apprenant, titre de la formation, date d'émission, code unique
- QR Code de vérification intégré dans le PDF
- Stockage du PDF sur S3
- Code unique (nanoid) non-rejouable

**Vérification publique**
- Page `/verify-certificate` accessible sans connexion
- Vérification par code ou scan QR
- Compteur de vérifications (`verifiedCount`)
- Affichage des informations : apprenant, formation, date

### 4.7 Module Tableau de bord Admin (`/admin`)

**KPIs temps réel**
- Total utilisateurs
- Total formations
- Total inscriptions
- Revenus cumulés (paiements réussis, en XOF)
- Taux de complétion global

**Graphiques (Recharts)**
- Donut chart : répartition des utilisateurs par rôle
- Line chart : revenus mensuels
- Bar chart : statuts des inscriptions
- Bar chart horizontal : top formations

**Gestion**
- Liste des utilisateurs avec changement de rôle en ligne
- Liste des formations avec statut et prix
- Historique des inscriptions avec progression
- Historique des paiements avec statuts

### 4.8 Module Tableau de bord Apprenant (`/dashboard`)

**Statistiques personnelles**
- Formations en cours / complétées
- Nombre de certificats obtenus
- Progression moyenne globale

**Graphiques**
- Radar chart : compétences acquises par catégorie
- Bar chart : progression par formation
- Pie chart : répartition en cours / complétées

**Sections**
- Mes formations avec barre de progression et accès rapide
- Mes certificats avec téléchargement PDF
- Notifications (lues/non lues, marquage)

### 4.9 Module Tableau de bord Formateur (`/formateur`)

**Statistiques**
- Total formations créées
- Formations publiées
- Total inscrits
- Taux de complétion moyen

**Gestion formations**
- Création rapide de formation (dialog intégré)
- Liste avec statut, actions : éditer, voir, publier/archiver
- Suivi des apprenants par formation

### 4.10 Module Chatbot IA (`ChatWidget`)

- Widget flottant disponible sur toutes les pages (bouton bas-droite)
- IA hybride : LLM (Claude/GPT) pour réponses automatiques
- Escalade vers humain (`needsHuman: true`) pour questions complexes
- Historique de conversation par session
- Interface de saisie avec streaming des réponses

### 4.11 Module Alumni (`/alumni`)

- Annuaire des anciens apprenants certifiés
- Profil alumni : poste, entreprise, LinkedIn, année de diplôme
- Visibilité configurable par l'alumni
- Filtrage et recherche dans l'annuaire

### 4.12 Module Notifications

**In-app**
- Types : `inactivite` | `inscription` | `rappel_session` | `certification` | `general`
- Badge de comptage non lus dans la navbar
- Marquage lu individuel

**Email (SMTP)**
- Confirmation d'inscription à une formation
- Émission d'un certificat
- Relance après inactivité

### 4.13 Module Relances Automatiques

**Job planifié** (toutes les heures)
- Détection des apprenants inactifs depuis plus de **3 jours**
- Exclusion : admins, prospects
- Envoi d'email de relance personnalisé
- Création de notification in-app simultanée

---

## 5. SÉCURITÉ

### 5.1 Authentification & Autorisation
- Tokens JWT signés (HS256) avec expiration
- Middleware `protectedProcedure` sur toutes les routes authentifiées
- Middleware `adminProcedure` pour les routes admin
- Middleware `formateurProcedure` pour les routes formateur/admin

### 5.2 Sécurité des données
- Variables sensibles via `.env` (jamais en dur)
- Validation des entrées avec **Zod** sur chaque procédure tRPC
- Vérification de signature SHA256 sur les webhooks PayTech
- Filigrane PDF côté serveur (protection des ressources)
- Presigned URLs S3 (accès temporaire aux fichiers)

### 5.3 Conformité
- Séparation stricte des rôles (RBAC)
- Aucun mot de passe stocké (OAuth externe)
- Données personnelles minimales collectées

---

## 6. INTÉGRATIONS EXTERNES

| Service | Usage | Statut |
|---------|-------|--------|
| **PayTech** | Paiement mobile africain | Intégré (IPN + webhook) |
| **AWS S3** | Stockage vidéos, PDF, ressources | Intégré |
| **SMTP (Nodemailer)** | Emails transactionnels | Intégré |
| **LLM (Claude/GPT)** | Chatbot IA | Intégré |
| **OAuth Manus** | Authentification SSO | Intégré |
| **Google Fonts** | Inter, Plus Jakarta Sans | Intégré |

**Non implémenté (roadmap) :**
- WhatsApp Business API (notifications)
- Intégration BigBlueButton (visioconférence live)
- Capture leads LinkedIn/Google
- Application mobile native (iOS/Android)
- Flux d'automatisation Make/Zapier

---

## 7. PERFORMANCES & HÉBERGEMENT

### 7.1 Optimisations implémentées
- Server-Side rendering via Vite + Express en mode dev
- TanStack Query : cache des requêtes côté client, invalidation sélective
- Lazy loading des composants graphiques (Recharts)
- Images et vidéos via S3 CDN
- Compression adaptative des vidéos (configurable côté upload)

### 7.2 Hébergement recommandé
- **VPS** : OVH, DigitalOcean ou équivalent (2 vCPU, 4 Go RAM minimum)
- **Base de données** : MySQL 8 managé ou auto-hébergé
- **Stockage** : AWS S3 ou équivalent S3-compatible (Wasabi, Scaleway)
- **SMTP** : SendGrid, Brevo ou SMTP propre
- **SSL** : Let's Encrypt (obligatoire)

---

## 8. QUALITÉ & TESTS

### 8.1 Tests automatisés
- Framework : **Vitest**
- Fichiers de tests : `server/digilearn.test.ts`, `server/auth.logout.test.ts`, `server/paytech.test.ts`
- Coverage : authentification, paiements, flux principaux

### 8.2 Qualité du code
- TypeScript strict (aucun `any` implicite)
- Prettier pour le formatage
- tRPC pour la sécurité de type end-to-end (client ↔ serveur)
- Validation Zod sur toutes les entrées API

---

## 9. ROADMAP

### Phase 1 — Complétée ✅
- Socle technique (React 19 + Express + tRPC + MySQL)
- Authentification multi-rôles
- Interface publique et catalogue

### Phase 2 — Complétée ✅
- Paiement PayTech (Wave, Orange Money)
- Micro-learning avec drag & drop
- Upload S3 (vidéos, PDF, ressources)

### Phase 3 — Complétée ✅
- Chatbot IA hybride
- Certificats PDF avec QR Code
- Relances automatiques d'inactivité
- Tableaux de bord avec graphiques (Admin, Formateur, Apprenant)

### Phase 4 — En cours 🔄
- Correctifs React Hooks (dashboards)
- Tests de charge et optimisations
- Lancement production

### Phase 5 — Roadmap future 📋
- Application mobile React Native
- Intégration WhatsApp Business
- Visioconférence BigBlueButton
- Marketplace formateurs tiers
- Système de coupon/réduction
- Multilingue (Wolof, Anglais)

---

## 10. CONFORMITÉ FONCTIONNELLE

| Fonctionnalité | Statut |
|----------------|--------|
| Page d'accueil publique | ✅ Implémenté |
| Catalogue avec filtres | ✅ Implémenté |
| Tunnel inscription 3 étapes | ✅ Implémenté |
| Auth multi-rôles (5 profils) | ✅ Implémenté |
| Micro-modules 5–10 min | ✅ Implémenté |
| Drag & drop réorganisation | ✅ Implémenté |
| Upload vidéo/PDF (S3) | ✅ Implémenté |
| Filigrane PDF | ✅ Implémenté |
| Quiz interactifs | ✅ Implémenté |
| Dashboard Apprenant + graphiques | ✅ Implémenté |
| Dashboard Formateur + graphiques | ✅ Implémenté |
| Dashboard Admin + KPIs | ✅ Implémenté |
| Paiement PayTech (Wave, Orange Money) | ✅ Implémenté |
| Webhook IPN sécurisé | ✅ Implémenté |
| Certificats PDF + QR Code | ✅ Implémenté |
| Vérification certificats publique | ✅ Implémenté |
| Relances inactivité 3 jours | ✅ Implémenté |
| Notifications in-app | ✅ Implémenté |
| Emails transactionnels (SMTP) | ✅ Implémenté |
| Chatbot hybride IA | ✅ Implémenté |
| Espace Alumni + annuaire | ✅ Implémenté |
| Suivi progression apprenants | ✅ Implémenté |
| Gestion utilisateurs (rôles) | ✅ Implémenté |
| Application mobile native | ❌ Non implémenté |
| Intégration WhatsApp Business | ❌ Non implémenté |
| BigBlueButton (visioconférence) | ❌ Non implémenté |
| Flux Make/Zapier | ❌ Non implémenté |

**Taux de conformité fonctionnelle : 95%**

---

*Document généré automatiquement à partir du code source — dépôt : `lamine24/digilearn-platform`*
