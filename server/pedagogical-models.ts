/**
 * Pedagogical Models - Templates and prompts for different instructional design models
 */

export interface PedagogicalModelTemplate {
  name: string;
  description: string;
  phases: string[];
  prompt: (context: ScenarioContext) => string;
}

export interface ScenarioContext {
  projectTitle: string;
  targetAudience: string;
  estimatedDuration: number;
  documentContent: string;
  language: string;
}

/**
 * ADDIE Model (Analysis, Design, Development, Implementation, Evaluation)
 */
export const addieModel: PedagogicalModelTemplate = {
  name: "ADDIE",
  description: "Analyse, Conception, Développement, Implémentation, Évaluation",
  phases: ["Analysis", "Design", "Development", "Implementation", "Evaluation"],
  prompt: (context: ScenarioContext) => `
Tu es un expert en conception pédagogique utilisant le modèle ADDIE. 

CONTEXTE:
- Titre du projet: ${context.projectTitle}
- Public cible: ${context.targetAudience}
- Durée estimée: ${context.estimatedDuration} minutes
- Contenu source:
${context.documentContent}

STRUCTURE REQUISE - Respecte strictement cette structure ADDIE:

## 1. ANALYSE (Analysis)
- Besoins d'apprentissage identifiés
- Caractéristiques du public cible
- Contraintes et ressources disponibles
- Objectifs généraux d'apprentissage

## 2. CONCEPTION (Design)
- Objectifs d'apprentissage spécifiques (SMART)
- Résultats d'apprentissage attendus
- Stratégies pédagogiques
- Structure du cours (modules, durée)
- Évaluations formatives et sommatives

## 3. DÉVELOPPEMENT (Development)
- Contenu détaillé pour chaque module
- Ressources pédagogiques (vidéos, documents, exercices)
- Activités d'apprentissage
- Matériels d'évaluation

## 4. IMPLÉMENTATION (Implementation)
- Plan de déploiement
- Préparation des apprenants
- Support et accompagnement
- Calendrier de mise en œuvre

## 5. ÉVALUATION (Evaluation)
- Critères d'évaluation
- Méthodes d'évaluation
- Indicateurs de succès
- Plan d'amélioration continue

Génère un scénario pédagogique complet suivant cette structure ADDIE.
`,
};

/**
 * QDDIE Model (Questioning ADDIE - adds questioning phase)
 */
export const qaddieModel: PedagogicalModelTemplate = {
  name: "QDDIE",
  description: "Questionnement, Analyse, Conception, Développement, Implémentation, Évaluation",
  phases: ["Questioning", "Analysis", "Design", "Development", "Implementation", "Evaluation"],
  prompt: (context: ScenarioContext) => `
Tu es un expert en conception pédagogique utilisant le modèle QDDIE (Questioning ADDIE).

CONTEXTE:
- Titre du projet: ${context.projectTitle}
- Public cible: ${context.targetAudience}
- Durée estimée: ${context.estimatedDuration} minutes
- Contenu source:
${context.documentContent}

STRUCTURE REQUISE - Respecte strictement cette structure QDDIE:

## 1. QUESTIONNEMENT (Questioning)
- Questions clés à explorer
- Problèmes pédagogiques à résoudre
- Hypothèses de départ
- Clarification des besoins réels

## 2. ANALYSE (Analysis)
- Analyse approfondie des besoins
- Profil des apprenants
- Contexte d'apprentissage
- Ressources disponibles

## 3. CONCEPTION (Design)
- Objectifs d'apprentissage SMART
- Résultats d'apprentissage mesurables
- Approches pédagogiques
- Architecture du cours

## 4. DÉVELOPPEMENT (Development)
- Création du contenu
- Développement des ressources
- Conception des activités
- Préparation des évaluations

## 5. IMPLÉMENTATION (Implementation)
- Stratégie de déploiement
- Formation des formateurs
- Support aux apprenants
- Gestion du changement

## 6. ÉVALUATION (Evaluation)
- Évaluation de l'apprentissage
- Évaluation du programme
- Collecte de données
- Recommandations d'amélioration

Génère un scénario pédagogique complet suivant cette structure QDDIE.
`,
};

/**
 * Bloom's Taxonomy Model (Focus on cognitive levels)
 */
export const bloomModel: PedagogicalModelTemplate = {
  name: "Bloom",
  description: "Taxonomie de Bloom - Niveaux cognitifs d'apprentissage",
  phases: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
  prompt: (context: ScenarioContext) => `
Tu es un expert en conception pédagogique utilisant la Taxonomie de Bloom révisée.

CONTEXTE:
- Titre du projet: ${context.projectTitle}
- Public cible: ${context.targetAudience}
- Durée estimée: ${context.estimatedDuration} minutes
- Contenu source:
${context.documentContent}

STRUCTURE REQUISE - Respecte strictement les niveaux de Bloom:

## 1. RETENIR (Remember) - Niveau 1
- Définitions et concepts clés
- Faits essentiels
- Vocabulaire technique
- Activités: Flashcards, quiz, listes

## 2. COMPRENDRE (Understand) - Niveau 2
- Explication des concepts
- Résumés et paraphrases
- Classification et catégorisation
- Activités: Discussions, explications, schémas

## 3. APPLIQUER (Apply) - Niveau 3
- Utilisation des connaissances
- Résolution de problèmes
- Cas pratiques
- Activités: Exercices, simulations, projets

## 4. ANALYSER (Analyze) - Niveau 4
- Décomposition des éléments
- Identification des relations
- Comparaisons et contrastes
- Activités: Analyses critiques, débats, études de cas

## 5. ÉVALUER (Evaluate) - Niveau 5
- Jugement critique
- Justification des décisions
- Évaluation de la qualité
- Activités: Critiques, défenses d'idées, évaluations par pairs

## 6. CRÉER (Create) - Niveau 6
- Production de nouvelles idées
- Synthèse d'éléments
- Création de solutions innovantes
- Activités: Projets créatifs, conception, innovation

Pour chaque niveau, spécifie:
- Les objectifs d'apprentissage
- Les contenus et ressources
- Les activités pédagogiques
- Les critères d'évaluation

Génère un scénario pédagogique complet suivant la Taxonomie de Bloom.
`,
};

/**
 * SAC Model (Socio-Constructivist Approach)
 */
export const sacModel: PedagogicalModelTemplate = {
  name: "SAC",
  description: "Approche Socio-Constructiviste - Apprentissage collaboratif",
  phases: ["Contextualization", "Problematization", "Investigation", "Socialization", "Institutionalization"],
  prompt: (context: ScenarioContext) => `
Tu es un expert en conception pédagogique utilisant l'Approche Socio-Constructiviste (SAC).

CONTEXTE:
- Titre du projet: ${context.projectTitle}
- Public cible: ${context.targetAudience}
- Durée estimée: ${context.estimatedDuration} minutes
- Contenu source:
${context.documentContent}

STRUCTURE REQUISE - Respecte strictement cette structure SAC:

## 1. CONTEXTUALISATION
- Situation réelle et significative
- Lien avec l'expérience des apprenants
- Motivation et engagement
- Ressources et environnement

## 2. PROBLÉMATISATION
- Problème ou question centrale
- Défis à relever
- Hypothèses initiales
- Ressources pour explorer

## 3. INVESTIGATION
- Activités de recherche et exploration
- Collaboration entre apprenants
- Construction des connaissances
- Expériences et expérimentations

## 4. SOCIALISATION
- Partage et discussion des découvertes
- Débats et échanges d'idées
- Confrontation des perspectives
- Négociation du sens

## 5. INSTITUTIONNALISATION
- Formalisation des apprentissages
- Synthèse collective
- Structuration des connaissances
- Transfert et application

Pour chaque phase, spécifie:
- Les activités collaboratives
- Les rôles des apprenants
- Les interactions sociales
- Les productions collectives

Génère un scénario pédagogique complet suivant l'approche SAC.
`,
};

/**
 * Get pedagogical model template by name
 */
export function getPedagogicalModel(modelName: string): PedagogicalModelTemplate {
  const models: Record<string, PedagogicalModelTemplate> = {
    addie: addieModel,
    qddie: qaddieModel,
    bloom: bloomModel,
    sac: sacModel,
  };

  return models[modelName.toLowerCase()] || addieModel;
}

/**
 * Get all available pedagogical models
 */
export function getAllPedagogicalModels(): PedagogicalModelTemplate[] {
  return [addieModel, qaddieModel, bloomModel, sacModel];
}

/**
 * Generate scenario prompt based on pedagogical model
 */
export function generateScenarioPrompt(
  modelName: string,
  context: ScenarioContext
): string {
  const model = getPedagogicalModel(modelName);
  return model.prompt(context);
}
