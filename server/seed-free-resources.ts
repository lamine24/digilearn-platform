import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function seedFreeResources() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not initialized");
    return;
  }

  const freeResources = [
    // Khan Academy
    {
      title: "Introduction aux Mathématiques",
      slug: "khan-academy-math-intro",
      description: "Cours complet de mathématiques du primaire au lycée",
      shortDescription: "Mathématiques fondamentales avec vidéos et exercices",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Khan+Academy",
      externalUrl: "https://www.khanacademy.org/math",
      platform: "khan_academy",
      category: "Mathématiques",
      level: "debutant",
      duration: 120,
      language: "fr",
      tags: "maths,fondamentaux,gratuit",
      rating: 4.8,
      enrollmentCount: 50000,
      isActive: true,
    },
    {
      title: "Statistiques et Probabilités",
      slug: "khan-academy-stats",
      description: "Cours complet de statistiques et probabilités",
      shortDescription: "Statistiques, probabilités et analyse de données",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Statistics",
      externalUrl: "https://www.khanacademy.org/math/statistics-probability",
      platform: "khan_academy",
      category: "Statistiques",
      level: "intermediaire",
      duration: 80,
      language: "fr",
      tags: "stats,probabilités,data",
      rating: 4.7,
      enrollmentCount: 35000,
      isActive: true,
    },
    // MIT OpenCourseWare
    {
      title: "Introduction à l'Informatique",
      slug: "mit-ocw-cs-intro",
      description: "Cours d'informatique fondamentale du MIT",
      shortDescription: "Programmation et algorithmique de base",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=MIT+CS",
      externalUrl: "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
      platform: "mit_ocw",
      category: "Informatique",
      level: "debutant",
      duration: 100,
      language: "en",
      tags: "programmation,python,informatique",
      rating: 4.9,
      enrollmentCount: 100000,
      isActive: true,
    },
    {
      title: "Économétrie Appliquée",
      slug: "mit-ocw-econometrics",
      description: "Cours avancé d'économétrie du MIT",
      shortDescription: "Méthodes économétriques et applications",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Econometrics",
      externalUrl: "https://ocw.mit.edu/courses/14-32-econometrics-spring-2007/",
      platform: "mit_ocw",
      category: "Économie",
      level: "avance",
      duration: 90,
      language: "en",
      tags: "économétrie,statistiques,économie",
      rating: 4.6,
      enrollmentCount: 15000,
      isActive: true,
    },
    // StatLearning
    {
      title: "Statistical Learning",
      slug: "statlearning-intro",
      description: "Introduction à l'apprentissage statistique",
      shortDescription: "Machine learning et statistiques appliquées",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=StatLearning",
      externalUrl: "https://www.statlearning.com/",
      platform: "statlearning",
      category: "Data Science",
      level: "intermediaire",
      duration: 150,
      language: "en",
      tags: "machine-learning,statistiques,data-science",
      rating: 4.8,
      enrollmentCount: 80000,
      isActive: true,
    },
    // Open Learning Campus
    {
      title: "Suivi-Évaluation des Projets",
      slug: "olc-monitoring-evaluation",
      description: "Cours complet sur le suivi-évaluation",
      shortDescription: "M&E pour les projets de développement",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=M%26E",
      externalUrl: "https://olc.worldbank.org/",
      platform: "open_learning_campus",
      category: "Développement",
      level: "intermediaire",
      duration: 60,
      language: "fr",
      tags: "suivi-évaluation,développement,projets",
      rating: 4.5,
      enrollmentCount: 25000,
      isActive: true,
    },
    {
      title: "Politiques Publiques et Analyse d'Impact",
      slug: "olc-public-policy",
      description: "Analyse d'impact des politiques publiques",
      shortDescription: "Évaluation d'impact et politiques de développement",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Policy",
      externalUrl: "https://olc.worldbank.org/",
      platform: "open_learning_campus",
      category: "Politiques Publiques",
      level: "avance",
      duration: 80,
      language: "fr",
      tags: "politiques,impact,développement",
      rating: 4.7,
      enrollmentCount: 18000,
      isActive: true,
    },
    // Canal-U
    {
      title: "Économie Politique",
      slug: "canal-u-econ-politique",
      description: "Cours d'économie politique de l'université française",
      shortDescription: "Théories et pratiques de l'économie politique",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Econ",
      externalUrl: "https://www.canal-u.tv/",
      platform: "canal_u",
      category: "Économie",
      level: "intermediaire",
      duration: 70,
      language: "fr",
      tags: "économie,politique,théorie",
      rating: 4.4,
      enrollmentCount: 12000,
      isActive: true,
    },
    {
      title: "Méthodes Quantitatives en Sciences Sociales",
      slug: "canal-u-quantitative",
      description: "Méthodes quantitatives pour la recherche",
      shortDescription: "Statistiques et analyse quantitative",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Quantitative",
      externalUrl: "https://www.canal-u.tv/",
      platform: "canal_u",
      category: "Méthodologie",
      level: "avance",
      duration: 85,
      language: "fr",
      tags: "méthodologie,statistiques,recherche",
      rating: 4.6,
      enrollmentCount: 9000,
      isActive: true,
    },
    // OpenLearn
    {
      title: "Fondamentaux de la Gestion",
      slug: "openlearn-management-basics",
      description: "Cours gratuit de gestion et management de l'Open University",
      shortDescription: "Principes fondamentaux du management",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=OpenLearn",
      externalUrl: "https://www.open.edu/openlearn/",
      platform: "openlearn",
      category: "Gestion",
      level: "debutant",
      duration: 40,
      language: "en",
      tags: "management,gestion,entreprise",
      rating: 4.3,
      enrollmentCount: 22000,
      isActive: true,
    },
    // Saylor Academy
    {
      title: "Économie Microéconomique",
      slug: "saylor-microeconomics",
      description: "Cours complet de microéconomie avec certification gratuite",
      shortDescription: "Principes de microéconomie et théorie des prix",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Saylor",
      externalUrl: "https://www.saylor.org/",
      platform: "saylor_academy",
      category: "Économie",
      level: "intermediaire",
      duration: 110,
      language: "en",
      tags: "économie,microéconomie,certification",
      rating: 4.5,
      enrollmentCount: 18000,
      isActive: true,
    },
    // AUF - Campus Numérique Francophone
    {
      title: "Gouvernance et Politiques Publiques en Afrique",
      slug: "auf-governance-africa",
      description: "Ressources sur la gouvernance africaine et les politiques publiques",
      shortDescription: "Gouvernance et développement en Afrique",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=AUF",
      externalUrl: "https://www.auf.org/",
      platform: "auf",
      category: "Gouvernance",
      level: "avance",
      duration: 60,
      language: "fr",
      tags: "gouvernance,afrique,politiques,développement",
      rating: 4.4,
      enrollmentCount: 8000,
      isActive: true,
    },
    // UNESCO OER Commons
    {
      title: "Ressources Éducatives Libres en Sciences",
      slug: "unesco-oer-sciences",
      description: "Ressources éducatives libres en sciences sous licence Creative Commons",
      shortDescription: "Ressources OER en sciences naturelles",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=UNESCO+OER",
      externalUrl: "https://www.oercommons.org/",
      platform: "unesco_oer",
      category: "Sciences",
      level: "intermediaire",
      duration: 75,
      language: "en",
      tags: "sciences,ressources-libres,oer,creative-commons",
      rating: 4.5,
      enrollmentCount: 14000,
      isActive: true,
    },
    // Bookdown
    {
      title: "R pour l'Analyse Statistique",
      slug: "bookdown-r-statistics",
      description: "Manuel complet d'analyse statistique avec R en accès libre",
      shortDescription: "Programmation R et statistiques appliquées",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Bookdown",
      externalUrl: "https://bookdown.org/",
      platform: "bookdown",
      category: "Data Science",
      level: "intermediaire",
      duration: 120,
      language: "en",
      tags: "r,statistiques,programmation,data-science",
      rating: 4.7,
      enrollmentCount: 45000,
      isActive: true,
    },
    // FUN-MOOC
    {
      title: "Introduction à la Science des Données",
      slug: "fun-mooc-data-science",
      description: "MOOC gratuit sur les fondamentaux de la science des données",
      shortDescription: "Data science et machine learning pour débutants",
      thumbnailUrl: "https://via.placeholder.com/300x200?text=FUN-MOOC",
      externalUrl: "https://www.fun-mooc.fr/",
      platform: "fun_mooc",
      category: "Data Science",
      level: "debutant",
      duration: 50,
      language: "fr",
      tags: "data-science,mooc,machine-learning,gratuit",
      rating: 4.6,
      enrollmentCount: 32000,
      isActive: true,
    },
  ];

  try {
    for (const resource of freeResources) {
      await db.execute(
        sql`
          INSERT IGNORE INTO free_resources (
            title, slug, description, shortDescription, thumbnailUrl, externalUrl,
            platform, category, level, duration, language, tags, rating, enrollmentCount, isActive, createdAt, updatedAt
          ) VALUES (
            ${resource.title}, ${resource.slug}, ${resource.description}, ${resource.shortDescription},
            ${resource.thumbnailUrl}, ${resource.externalUrl}, ${resource.platform}, ${resource.category},
            ${resource.level}, ${resource.duration}, ${resource.language}, ${resource.tags},
            ${resource.rating}, ${resource.enrollmentCount}, ${resource.isActive}, NOW(), NOW()
          )
        `
      );
    }
    console.log("[Seed] Free resources seeded successfully");
  } catch (error: any) {
    if (error.message?.includes("Duplicate entry")) {
      console.log("[Seed] Free resources already exist, skipping");
    } else {
      console.error("[Seed] Error seeding free resources:", error);
    }
  }
}
