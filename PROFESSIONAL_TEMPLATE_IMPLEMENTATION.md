# Implémentation du Modèle Professionnel de Scénarisation

## Vue d'ensemble

Ce document décrit l'implémentation du modèle professionnel de scénarisation pédagogique basé sur le template **Modele_Scenarise_.docx** pour la plateforme DigiLearn.

## Architecture mise en place

### 1. Schéma de base de données

Trois nouvelles tables ont été créées pour supporter le système Studio :

#### `studio_projects`
Stocke les projets de scénarisation avec métadonnées professionnelles :
- `id` : Identifiant unique
- `userId` : Référence à l'utilisateur propriétaire
- `title` : Titre du module
- `description` : Description détaillée
- `slug` : URL-friendly identifier
- `pedagogicalModel` : Modèle pédagogique (addie, qddie, bloom, sac, professional)
- `status` : État du projet (draft, in_progress, completed, archived)
- `targetAudience` : Public cible
- `estimatedDuration` : Durée estimée en minutes
- `language` : Langue du contenu (défaut: fr)
- **Champs de métadonnées professionnels** :
  - `author` : Auteur du module
  - `institution` : Institution responsable
  - `credits` : Crédits ECTS
  - `prerequisites` : Prérequis
  - `generalObjective` : Objectif général du cours

#### `studio_documents`
Gère les documents uploadés pour la génération de scénarios :
- `id` : Identifiant unique
- `projectId` : Référence au projet
- `filename` : Nom du fichier
- `fileUrl` : URL du fichier stocké
- `fileKey` : Clé de stockage S3
- `fileSize` : Taille en octets
- `mimeType` : Type MIME
- `status` : État du traitement (pending, processing, completed, failed)
- `extractedContent` : Contenu extrait du document
- `errorMessage` : Message d'erreur si applicable

#### `studio_scenarios`
Stocke les scénarios générés :
- `id` : Identifiant unique
- `projectId` : Référence au projet
- `title` : Titre du scénario
- `description` : Contenu du scénario généré
- `pedagogicalModel` : Modèle utilisé
- `status` : État (draft, generated, approved, published)
- `generatedAt` : Date de génération
- `approvedAt` : Date d'approbation

### 2. Modèles pédagogiques

Cinq modèles pédagogiques sont implémentés dans `server/pedagogical-models.ts` :

#### ADDIE (Analysis, Design, Development, Implementation, Evaluation)
Structure traditionnelle en 5 phases avec analyse des besoins et évaluation continue.

#### QDDIE (Questioning ADDIE)
Extension du modèle ADDIE avec une phase initiale de questionnement pour clarifier les besoins.

#### Bloom (Taxonomie de Bloom révisée)
Basé sur les 6 niveaux cognitifs : Remember, Understand, Apply, Analyze, Evaluate, Create.

#### SAC (Approche Socio-Constructiviste)
Modèle collaboratif en 5 phases : Contextualisation, Problématisation, Investigation, Socialisation, Institutionnalisation.

#### Professional Template
Modèle professionnel spécifique suivant la structure du document `Modele_Scenarise_.docx` avec :
- **Section 1 : Identification du Module** - Tableau structuré avec métadonnées
- **Section 2 : Scénarisation du Cours** - Séquences pédagogiques détaillées

### 3. Export PDF professionnel

Le module `server/scenario-export-professional.ts` génère des PDF formatés professionnellement :

**Caractéristiques** :
- En-têtes bleus professionnels (#003366)
- Tableaux structurés pour l'identification du module
- Sections numérotées pour chaque séquence
- Mise en page A4 avec marges appropriées
- Support complet des caractères accentués (français)

**Structure du PDF** :
1. Page de titre avec le titre du module
2. Section 1 : Tableau d'identification (auteur, institution, crédits, etc.)
3. Section 2 : Scénarisation avec séquences numérotées
4. Objectifs spécifiques par séquence
5. Ressources numériques et complémentaires
6. Tests de connaissances
7. Évaluation finale

### 4. Intégration LLM

Les prompts LLM sont générés dynamiquement selon le modèle pédagogique sélectionné :

```typescript
const prompt = generateScenarioPrompt(project.pedagogicalModel, context);
const response = await invokeLLM({
  messages: [
    { role: 'system', content: 'Expert en conception pédagogique...' },
    { role: 'user', content: prompt }
  ]
});
```

Les prompts incluent :
- Contexte du module (titre, auteur, institution, durée, crédits)
- Contenu source du document
- Instructions structurées selon le modèle
- Directives de format et de qualité

## Procédures tRPC (à implémenter)

Les procédures suivantes sont définies dans `server/routers/studio.ts` :

### Gestion des projets
- `studio.createProject` : Créer un nouveau projet
- `studio.getProject` : Récupérer les détails d'un projet
- `studio.listProjects` : Lister les projets de l'utilisateur
- `studio.updateProject` : Mettre à jour un projet

### Gestion des documents
- `studio.uploadDocument` : Uploader un document source
- `studio.getProjectDocuments` : Lister les documents d'un projet

### Génération de scénarios
- `studio.generateScenario` : Générer un scénario via LLM
- `studio.exportScenarioPdf` : Exporter un scénario en PDF

## Flux d'utilisation

### 1. Création d'un projet
```typescript
const projectId = await trpc.studio.createProject.mutate({
  title: "Formation Data Science",
  author: "Dr. Jean Dupont",
  institution: "ESCOA",
  pedagogicalModel: "professional",
  credits: 6,
  estimatedDuration: 180, // minutes
  generalObjective: "Maîtriser les fondamentaux de la science des données"
});
```

### 2. Upload de documents
```typescript
const documentId = await trpc.studio.uploadDocument.mutate({
  projectId,
  filename: "syllabus.pdf",
  fileUrl: "/manus-storage/...",
  fileKey: "...",
  mimeType: "application/pdf"
});
```

### 3. Génération du scénario
```typescript
const { scenarioId, content } = await trpc.studio.generateScenario.mutate({
  projectId,
  documentContent: extractedContent
});
```

### 4. Export PDF
```typescript
const { url, filename } = await trpc.studio.exportScenarioPdf.mutate({
  scenarioId
});
```

## Champs de métadonnées professionnels

Le système capture les informations suivantes pour chaque projet :

| Champ | Type | Description |
|-------|------|-------------|
| `author` | string | Auteur/Responsable du module |
| `institution` | string | Institution responsable |
| `credits` | number | Crédits ECTS |
| `prerequisites` | text | Prérequis pour suivre le module |
| `generalObjective` | text | Objectif général du cours |
| `targetAudience` | string | Public cible |
| `estimatedDuration` | number | Durée estimée en minutes |
| `language` | string | Langue du contenu |

## Intégration avec le template existant

Le système s'intègre avec les composants existants :

- **Authentification** : Utilise le système OAuth Manus existant
- **Stockage** : Utilise le système S3 via `storagePut()`
- **LLM** : Utilise `invokeLLM()` pour la génération
- **Base de données** : Utilise Drizzle ORM avec MySQL
- **tRPC** : Intégré au routeur tRPC existant

## Prochaines étapes

1. **Interface utilisateur** : Créer des pages React pour :
   - Création/édition de projets
   - Upload de documents
   - Génération et prévisualisation de scénarios
   - Export et téléchargement

2. **Traitement de documents** : Implémenter l'extraction de contenu :
   - Extraction de texte depuis PDF
   - Parsing de documents Word
   - Gestion des images et tableaux

3. **Validation et approbation** : Ajouter un workflow :
   - Révision des scénarios générés
   - Approbation avant publication
   - Historique des versions

4. **Tests unitaires** : Créer des tests Vitest pour :
   - Génération de prompts
   - Parsing des réponses LLM
   - Export PDF
   - Gestion des projets

## Notes techniques

- **Sécurité** : Toutes les opérations sont protégées par `protectedProcedure`
- **Validation** : Utilise Zod pour la validation des inputs
- **Erreurs** : Utilise TRPCError pour les erreurs cohérentes
- **Performance** : Les documents volumineux sont traités de manière asynchrone
- **Stockage** : Les fichiers PDF générés sont stockés sur S3 avec URLs signées

## Références

- Modèle source : `Modele_Scenarise_.docx`
- Taxonomie de Bloom : https://en.wikipedia.org/wiki/Bloom%27s_taxonomy
- Approche socio-constructiviste : https://en.wikipedia.org/wiki/Social_constructivism
- Modèle ADDIE : https://en.wikipedia.org/wiki/Instructional_design#ADDIE_model
