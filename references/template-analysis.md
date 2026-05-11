# Analyse du Modèle de Scénarisation Professionnelle

## Structure Générale

Le modèle `Modele_Scenarise_.docx` suit une structure académique et professionnelle en deux sections principales :

### 1. Identification du Module (Section 1)

Tableau d'identification avec les champs suivants :
- **Auteur** : Nom du formateur/créateur
- **Institution** : Établissement ou organisme
- **Intitulé du module** : Titre du cours
- **Unité d'Enseignement** : Catégorie ou domaine
- **Niveau / Cycle** : Niveau d'étude (L1, M1, etc.)
- **Équivalence en crédits** : Nombre de crédits ECTS
- **Volume horaire total** : Durée totale du module
- **Pré-requis** : Conditions préalables
- **Objectif général du cours** : Objectif pédagogique global
- **Objectifs spécifiques** : Objectifs détaillés
- **Résumé du cours** : Description synthétique
- **Ouvrages bibliographiques** : Références et ressources

### 2. Scénarisation du Cours (Section 2)

Structure modulaire avec plusieurs séquences :

#### Pour chaque Séquence (Chapitre) :
- **En-tête** : "Séquence n – Chapitre n :"
- **Métadonnées** : Durée (semaines), Contact direct (heures), Travail personnel estimé (heures)

#### Contenu de chaque séquence :
1. **Objectifs spécifiques de la séquence** : Tableau avec objectifs numérotés (I, II, III, etc.)
2. **Ressources numériques** : Section pour lister les ressources
3. **Ressources complémentaires** : (Capsules audio/vidéo, liens, webographie, bibliographie ciblée)
4. **Tests de connaissances** : Évaluation formative

#### Séance Finale (Séance 10) :
- **Évaluation finale et bilan du module**
- Description : Examen de fin de module et restitution des projets
- Inclut bilan collectif et individuel
- Formule : TH = TOTAL HEURE | H au total = Volume total

## Caractéristiques Clés

1. **Format professionnel** : Mise en page avec en-têtes bleus, tableaux structurés
2. **Modularité** : Chaque séquence suit le même format
3. **Clarté pédagogique** : Distinction claire entre objectifs, ressources et évaluation
4. **Traçabilité** : Métadonnées de durée et de charge de travail
5. **Flexibilité** : Adaptable à différents types de modules et niveaux

## Mapping pour la Génération Automatique

| Élément du Modèle | Source de Données | Génération |
|---|---|---|
| Auteur | Utilisateur/Projet | À remplir par l'utilisateur |
| Institution | Utilisateur/Projet | À remplir par l'utilisateur |
| Intitulé du module | Titre du document/projet | Extrait automatiquement |
| Objectifs généraux | Contenu extrait du document | Généré par LLM |
| Objectifs spécifiques | Contenu extrait par section | Généré par LLM pour chaque séquence |
| Résumé du cours | Contenu extrait | Généré par LLM (synthèse) |
| Séquences/Chapitres | Structure du document | Détecté automatiquement |
| Ressources numériques | Contenu extrait | À identifier dans le contenu |
| Tests de connaissances | Contenu extrait | Généré par LLM |
| Évaluation finale | Contenu extrait | Généré par LLM |

## Implémentation Recommandée

1. Créer un nouveau modèle pédagogique : `PROFESSIONAL_TEMPLATE`
2. Adapter les prompts LLM pour générer la structure complète
3. Modifier l'export PDF/Word pour respecter la mise en page
4. Ajouter des champs de métadonnées au formulaire de projet
