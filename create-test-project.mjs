import { getDb } from './server/_core/db.js';
import { sql } from 'drizzle-orm';

async function createTestProject() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Create a test project
    const projectData = {
      userId: 1, // Mamadou Lamine KANE (admin user)
      title: 'Formation Python Avancée - DigiLearn',
      description: 'Une formation complète sur les concepts avancés de Python incluant la programmation orientée objet, les décorateurs, et les générateurs.',
      slug: 'formation-python-avancee-' + Date.now(),
      pedagogicalModel: 'addie',
      targetAudience: 'Développeurs Python intermédiaires',
      estimatedDuration: 120,
      language: 'fr',
      status: 'draft'
    };

    const result = await db.execute(
      sql`INSERT INTO studio_projects (userId, title, description, slug, pedagogicalModel, targetAudience, estimatedDuration, language, status)
          VALUES (${projectData.userId}, ${projectData.title}, ${projectData.description}, ${projectData.slug}, ${projectData.pedagogicalModel}, ${projectData.targetAudience}, ${projectData.estimatedDuration}, ${projectData.language}, ${projectData.status})`
    );

    console.log('✅ Projet créé avec succès!');
    console.log('📋 Détails du projet:');
    console.log(`   Titre: ${projectData.title}`);
    console.log(`   Slug: ${projectData.slug}`);
    console.log(`   Modèle: ${projectData.pedagogicalModel}`);
    console.log(`   Durée estimée: ${projectData.estimatedDuration} minutes`);
    console.log(`   Public cible: ${projectData.targetAudience}`);
    console.log(`   Statut: ${projectData.status}`);
    
    // Fetch the created project
    const projects = await db.execute(
      sql`SELECT * FROM studio_projects WHERE slug = ${projectData.slug} LIMIT 1`
    );

    if (projects && projects.length > 0) {
      const project = projects[0];
      console.log('\n📊 Projet enregistré:');
      console.log(`   ID: ${project.id}`);
      console.log(`   Créé: ${project.createdAt}`);
      console.log(`   Mis à jour: ${project.updatedAt}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createTestProject();
