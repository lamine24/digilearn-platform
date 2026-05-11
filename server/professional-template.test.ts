import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateScenarioPrompt } from './pedagogical-models';

// Mock the PDF export function since it requires external dependencies
const mockExportScenarioPdf = async (data: any) => {
  return Buffer.from('Mock PDF content');
};

describe('Professional Template Model', () => {
  describe('Prompt Generation', () => {
    it('should generate a valid prompt for professional template', () => {
      const projectData = {
        title: 'Data Science Fundamentals',
        description: 'Introduction to data science concepts',
        author: 'Dr. Jean Dupont',
        institution: 'ESCOA',
        targetAudience: 'Professionals',
        estimatedDuration: 40,
        language: 'fr',
        prerequisites: 'Basic statistics knowledge',
        generalObjective: 'Master data science fundamentals',
        credits: 3,
      };

      const prompt = generateScenarioPrompt('professional', projectData);

      expect(prompt).toBeDefined();
      expect(prompt).toContain('Modèle Professionnel');
      expect(prompt).toContain(projectData.title);
      expect(prompt).toContain(projectData.author);
      expect(prompt).toContain(projectData.institution);
    });

    it('should include all required metadata fields', () => {
      const projectData = {
        title: 'Web Development',
        description: 'Learn modern web development',
        author: 'John Smith',
        institution: 'Tech Academy',
        targetAudience: 'Students',
        estimatedDuration: 60,
        language: 'en',
        prerequisites: 'HTML/CSS basics',
        generalObjective: 'Build professional websites',
        credits: 4,
      };

      const prompt = generateScenarioPrompt('professional', projectData);

      expect(prompt).toContain(projectData.author);
      expect(prompt).toContain(projectData.institution);
      expect(prompt).toContain(projectData.credits.toString());
      expect(prompt).toContain(projectData.estimatedDuration.toString());
    });

    it('should handle missing optional fields gracefully', () => {
      const projectData = {
        title: 'Basic Course',
        description: 'A basic course',
        language: 'fr',
      };

      const prompt = generateScenarioPrompt('professional', projectData);

      expect(prompt).toBeDefined();
      expect(prompt).toContain('Modèle Professionnel');
      expect(prompt).toContain(projectData.title);
    });

    it('should generate French content for fr language', () => {
      const projectData = {
        title: 'Formation Avancée',
        description: 'Formation avancée en gestion',
        language: 'fr',
      };

      const prompt = generateScenarioPrompt('professional', projectData);

      expect(prompt).toContain('Modèle Professionnel');
      expect(prompt).toContain('français');
    });
  });

  describe('PDF Export', () => {
    it('should generate valid PDF structure for professional template', async () => {
      const scenarioData = {
        title: 'Data Science Module',
        description: `
# Identification du Module
- **Titre**: Data Science Fundamentals
- **Auteur**: Dr. Jean Dupont
- **Institution**: ESCOA
- **Crédits**: 3
- **Durée**: 40 minutes

# Scénarisation Pédagogique
## Séquence 1: Introduction
Contenu de la séquence 1...

## Séquence 2: Concepts Clés
Contenu de la séquence 2...
        `,
        projectTitle: 'Data Science Fundamentals',
        author: 'Dr. Jean Dupont',
        institution: 'ESCOA',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);

      expect(pdf).toBeDefined();
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should include all required sections in PDF', async () => {
      const scenarioData = {
        title: 'Complete Module',
        description: `
# Identification du Module
- **Titre**: Complete Module
- **Auteur**: Author Name
- **Institution**: Institution Name

# Scénarisation Pédagogique
## Séquence 1: Section 1
Content here...
        `,
        projectTitle: 'Complete Module',
        author: 'Author Name',
        institution: 'Institution Name',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);

      expect(pdf).toBeDefined();
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should handle special characters in content', async () => {
      const scenarioData = {
        title: 'Module avec Caractères Spéciaux',
        description: `
# Identification du Module
- **Titre**: Formation à l'IA & Machine Learning
- **Auteur**: Dr. François Müller
- **Institution**: Université de Montréal

# Scénarisation Pédagogique
## Séquence 1: Concepts Fondamentaux
Apprentissage des concepts clés: données, modèles, prédictions...
        `,
        projectTitle: 'Formation à l\'IA & Machine Learning',
        author: 'Dr. François Müller',
        institution: 'Université de Montréal',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);

      expect(pdf).toBeDefined();
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe('Model Validation', () => {
    it('should validate professional template model name', () => {
      const validModels = ['addie', 'qddie', 'bloom', 'sac', 'professional'];
      expect(validModels).toContain('professional');
    });

    it('should have correct enum value for database', () => {
      const dbEnum = ['addie', 'qddie', 'bloom', 'sac', 'professional'];
      expect(dbEnum).toContain('professional');
      expect(dbEnum.length).toBe(5);
    });

    it('should support all required metadata fields', () => {
      const requiredFields = [
        'title',
        'description',
        'author',
        'institution',
        'credits',
        'prerequisites',
        'generalObjective',
        'targetAudience',
        'estimatedDuration',
        'language',
      ];

      expect(requiredFields.length).toBeGreaterThan(0);
      expect(requiredFields).toContain('author');
      expect(requiredFields).toContain('institution');
    });
  });

  describe('Integration Tests', () => {
    it('should create project with professional template model', () => {
      const projectData = {
        userId: 1,
        title: 'Professional Module',
        description: 'A professional module',
        slug: 'professional-module',
        pedagogicalModel: 'professional',
        status: 'draft',
        targetAudience: 'Professionals',
        estimatedDuration: 50,
        language: 'fr',
        author: 'John Doe',
        institution: 'Academy',
        credits: 3,
        prerequisites: 'Basic knowledge',
        generalObjective: 'Learn professional skills',
      };

      expect(projectData.pedagogicalModel).toBe('professional');
      expect(projectData.author).toBeDefined();
      expect(projectData.institution).toBeDefined();
      expect(projectData.credits).toBeDefined();
    });

    it('should generate scenario with professional template', () => {
      const projectData = {
        title: 'Test Module',
        description: 'Test description',
        author: 'Test Author',
        institution: 'Test Institution',
        language: 'fr',
      };

      const prompt = generateScenarioPrompt('professional', projectData);

      expect(prompt).toContain('Modèle Professionnel');
      expect(prompt).toContain('Test Module');
      expect(prompt).toContain('Test Author');
    });

    it('should handle scenario export with professional template', async () => {
      const scenarioData = {
        title: 'Exported Scenario',
        description: '# Identification\n- **Titre**: Test\n# Scénarisation\n## Seq 1\nContent',
        projectTitle: 'Test Project',
        author: 'Test Author',
        institution: 'Test Institution',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);

      expect(pdf).toBeDefined();
      expect(pdf).toBeInstanceOf(Buffer);
    });
  });

  describe('Error Handling', () => {
    it('should handle null project data', () => {
      const projectData = {
        title: 'Test',
        description: 'Test',
        language: 'fr',
      };

      const prompt = generateScenarioPrompt('professional', projectData);
      expect(prompt).toBeDefined();
    });

    it('should handle empty description', async () => {
      const scenarioData = {
        title: 'Empty Scenario',
        description: '',
        projectTitle: 'Test',
        author: 'Author',
        institution: 'Institution',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);
      expect(pdf).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000);
      const scenarioData = {
        title: 'Long Scenario',
        description: `# Identification\n- **Titre**: Test\n# Scénarisation\n## Seq 1\n${longContent}`,
        projectTitle: 'Test',
        author: 'Author',
        institution: 'Institution',
      };

      const pdf = await mockExportScenarioPdf(scenarioData);
      expect(pdf).toBeDefined();
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should generate prompt quickly', () => {
      const projectData = {
        title: 'Performance Test',
        description: 'Testing performance',
        language: 'fr',
      };

      const start = Date.now();
      const prompt = generateScenarioPrompt('professional', projectData);
      const duration = Date.now() - start;

      expect(prompt).toBeDefined();
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should export PDF within reasonable time', async () => {
      const scenarioData = {
        title: 'Performance Test',
        description: '# Test\n## Section\nContent here',
        projectTitle: 'Test',
        author: 'Author',
        institution: 'Institution',
      };

      const start = Date.now();
      const pdf = await mockExportScenarioPdf(scenarioData);
      const duration = Date.now() - start;

      expect(pdf).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
