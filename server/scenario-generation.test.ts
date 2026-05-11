import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateScenarioWithPedagogicalModel,
  ScenarioGenerationInput,
} from "./scenario-generation";
import * as studioDb from "./studio-db";
import { invokeLLM } from "./_core/llm";

// Mock dependencies
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./studio-db", () => ({
  createScenario: vi.fn(),
}));

describe("Scenario Generation with Pedagogical Models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInput: ScenarioGenerationInput = {
    projectId: 1,
    projectTitle: "Formation Python Avancée",
    pedagogicalModel: "addie",
    targetAudience: "Développeurs Python intermédiaires",
    estimatedDuration: 120,
    documents: [
      {
        id: 1,
        fileName: "python-advanced.pptx",
        extractedContent:
          "Contenu sur les décorateurs, générateurs et programmation asynchrone en Python",
      },
    ],
    language: "fr",
  };

  it("should generate scenario with ADDIE model", async () => {
    const mockScenarioContent = `
## 1. ANALYSE
- Besoins: Formation sur Python avancé
- Public: Développeurs intermédiaires
- Durée: 120 minutes

## 2. CONCEPTION
- Objectifs SMART définis
- Modules structurés

## 3. DÉVELOPPEMENT
- Contenu détaillé
- Ressources pédagogiques

## 4. IMPLÉMENTATION
- Plan de déploiement

## 5. ÉVALUATION
- Critères d'évaluation
    `;

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockScenarioContent,
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({
      id: 1,
      projectId: 1,
      title: "Scénario ADDIE - Formation Python Avancée",
    });

    const result = await generateScenarioWithPedagogicalModel(mockInput);

    expect(result.success).toBe(true);
    expect(result.model).toBe("addie");
    expect(result.scenario).toContain("ANALYSE");
    expect(result.scenario).toContain("CONCEPTION");
    expect(result.title).toContain("ADDIE");
    expect(studioDb.createScenario).toHaveBeenCalled();
  });

  it("should generate scenario with QDDIE model", async () => {
    const qaddieInput = { ...mockInput, pedagogicalModel: "qddie" };

    const mockScenarioContent = `
## 1. QUESTIONNEMENT
- Questions clés à explorer
- Problèmes pédagogiques

## 2. ANALYSE
- Analyse approfondie

## 3. CONCEPTION
- Objectifs d'apprentissage

## 4. DÉVELOPPEMENT
- Création du contenu

## 5. IMPLÉMENTATION
- Stratégie de déploiement

## 6. ÉVALUATION
- Évaluation de l'apprentissage
    `;

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockScenarioContent,
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({
      id: 2,
      projectId: 1,
      title: "Scénario QDDIE - Formation Python Avancée",
    });

    const result = await generateScenarioWithPedagogicalModel(qaddieInput);

    expect(result.success).toBe(true);
    expect(result.model).toBe("qddie");
    expect(result.scenario).toContain("QUESTIONNEMENT");
    expect(result.title).toContain("QDDIE");
  });

  it("should generate scenario with Bloom model", async () => {
    const bloomInput = { ...mockInput, pedagogicalModel: "bloom" };

    const mockScenarioContent = `
## 1. RETENIR (Remember)
- Définitions et concepts clés

## 2. COMPRENDRE (Understand)
- Explication des concepts

## 3. APPLIQUER (Apply)
- Utilisation des connaissances

## 4. ANALYSER (Analyze)
- Décomposition des éléments

## 5. ÉVALUER (Evaluate)
- Jugement critique

## 6. CRÉER (Create)
- Production de nouvelles idées
    `;

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockScenarioContent,
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({
      id: 3,
      projectId: 1,
      title: "Scénario Bloom - Formation Python Avancée",
    });

    const result = await generateScenarioWithPedagogicalModel(bloomInput);

    expect(result.success).toBe(true);
    expect(result.model).toBe("bloom");
    expect(result.scenario).toContain("RETENIR");
    expect(result.scenario).toContain("CRÉER");
    expect(result.title).toContain("Bloom");
  });

  it("should generate scenario with SAC model", async () => {
    const sacInput = { ...mockInput, pedagogicalModel: "sac" };

    const mockScenarioContent = `
## 1. CONTEXTUALISATION
- Situation réelle et significative

## 2. PROBLÉMATISATION
- Problème ou question centrale

## 3. INVESTIGATION
- Activités de recherche

## 4. SOCIALISATION
- Partage et discussion

## 5. INSTITUTIONNALISATION
- Formalisation des apprentissages
    `;

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockScenarioContent,
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({
      id: 4,
      projectId: 1,
      title: "Scénario SAC - Formation Python Avancée",
    });

    const result = await generateScenarioWithPedagogicalModel(sacInput);

    expect(result.success).toBe(true);
    expect(result.model).toBe("sac");
    expect(result.scenario).toContain("CONTEXTUALISATION");
    expect(result.scenario).toContain("SOCIALISATION");
    expect(result.title).toContain("SAC");
  });

  it("should include document content in generation", async () => {
    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Scénario généré",
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({ id: 1 });

    await generateScenarioWithPedagogicalModel(mockInput);

    // Verify that invokeLLM was called with messages containing document content
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages.length).toBeGreaterThan(0);

    // Check that system message contains pedagogical model reference
    const systemMessage = callArgs.messages.find(
      (m: any) => m.role === "system"
    );
    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain("ADDIE");
  });

  it("should throw error when no documents provided", async () => {
    const invalidInput = { ...mockInput, documents: [] };

    await expect(
      generateScenarioWithPedagogicalModel(invalidInput)
    ).rejects.toThrow("At least one document is required");
  });

  it("should throw error when projectId is missing", async () => {
    const invalidInput = { ...mockInput, projectId: 0 };

    await expect(
      generateScenarioWithPedagogicalModel(invalidInput)
    ).rejects.toThrow("Project ID and title are required");
  });

  it("should use default ADDIE model when not specified", async () => {
    const inputWithoutModel = { ...mockInput, pedagogicalModel: "" };

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Scénario ADDIE par défaut",
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({ id: 1 });

    const result = await generateScenarioWithPedagogicalModel(inputWithoutModel);

    expect(result.model).toBe("addie");
  });

  it("should extract and combine multiple document contents", async () => {
    const multiDocInput = {
      ...mockInput,
      documents: [
        {
          id: 1,
          fileName: "part1.pdf",
          extractedContent: "Contenu partie 1",
        },
        {
          id: 2,
          fileName: "part2.pdf",
          extractedContent: "Contenu partie 2",
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Scénario combiné",
          },
        },
      ],
    });

    (studioDb.createScenario as any).mockResolvedValue({ id: 1 });

    await generateScenarioWithPedagogicalModel(multiDocInput);

    const callArgs = (invokeLLM as any).mock.calls[0][0];
    const systemMessage = callArgs.messages.find(
      (m: any) => m.role === "system"
    );

    // Verify both documents are included
    expect(systemMessage.content).toContain("part1.pdf");
    expect(systemMessage.content).toContain("part2.pdf");
  });
});
