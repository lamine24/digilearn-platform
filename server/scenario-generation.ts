/**
 * Scenario Generation Service
 * Generates pedagogical scenarios based on extracted document content
 * and selected pedagogical model
 */

import { invokeLLM } from "./_core/llm";
import {
  getPedagogicalModel,
  ScenarioContext,
  generateScenarioPrompt,
} from "./pedagogical-models";
import * as studioDb from "./studio-db";

export interface ScenarioGenerationInput {
  projectId: number;
  projectTitle: string;
  pedagogicalModel: string;
  targetAudience: string;
  estimatedDuration: number;
  documents: Array<{
    id: number;
    fileName: string;
    extractedContent: string;
  }>;
  language: string;
}

export interface ScenarioGenerationResult {
  success: boolean;
  scenario: string;
  title: string;
  description: string;
  model: string;
  message: string;
}

/**
 * Extract and combine content from multiple documents
 */
function extractDocumentContent(
  documents: Array<{
    id: number;
    fileName: string;
    extractedContent: string;
  }>
): string {
  return documents
    .map((doc) => {
      const header = `\n### Document: ${doc.fileName}\n`;
      const content = doc.extractedContent || "(Contenu non disponible)";
      return header + content;
    })
    .join("\n");
}

/**
 * Generate scenario using LLM with pedagogical model
 */
export async function generateScenarioWithPedagogicalModel(
  input: ScenarioGenerationInput
): Promise<ScenarioGenerationResult> {
  try {
    // Validate inputs
    if (!input.projectId || !input.projectTitle) {
      throw new Error("Project ID and title are required");
    }

    if (!input.documents || input.documents.length === 0) {
      throw new Error("At least one document is required");
    }

    // Extract document content
    const documentContent = extractDocumentContent(input.documents);

    // Create scenario context
    const context: ScenarioContext = {
      projectTitle: input.projectTitle,
      targetAudience: input.targetAudience || "Tous les niveaux",
      estimatedDuration: input.estimatedDuration || 60,
      documentContent,
      language: input.language || "fr",
    };

    // Generate prompt based on pedagogical model
    const systemPrompt = generateScenarioPrompt(
      input.pedagogicalModel || "addie",
      context
    );

    // Call LLM to generate scenario with retry logic
    console.log(
      `[Scenario Generation] Generating scenario for model: ${input.pedagogicalModel}`
    );

    let response;
    let lastError: any;
    const maxRetries = 3;
    const retryDelayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Génère maintenant le scénario pédagogique complet basé sur les documents fournis et le modèle ${input.pedagogicalModel?.toUpperCase() || "ADDIE"}.`,
        },
      ],
    });

        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        console.warn(
          `[Scenario Generation] Attempt ${attempt}/${maxRetries} failed:`,
          (error as Error).message
        );
        if (attempt < maxRetries) {
          console.log(
            `[Scenario Generation] Retrying in ${retryDelayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    if (!response) {
      throw new Error(
        `Failed to generate scenario after ${maxRetries} attempts: ${(lastError as Error).message}`
      );
    }

    const scenarioContent =
      typeof response.choices[0]?.message?.content === "string"
        ? response.choices[0].message?.content
        : "";

    if (!scenarioContent || scenarioContent.trim().length === 0) {
      throw new Error("No scenario content generated from LLM");
    }

    // Extract title from pedagogical model
    const model = getPedagogicalModel(input.pedagogicalModel || "addie");
    const title = `Scénario ${model.name} - ${input.projectTitle}`;

    // Save scenario to database
    const savedScenario = await studioDb.createScenario({
      projectId: input.projectId,
      title,
      description: scenarioContent.substring(0, 500),
      generatedBy: "mistral",
      learningObjectives: [],
      contentStructure: {
        model: input.pedagogicalModel || "addie",
        targetAudience: input.targetAudience,
        estimatedDuration: input.estimatedDuration,
      },
    });

    console.log(
      `[Scenario Generation] Scenario created successfully`
    );

    return {
      success: true,
      scenario: scenarioContent,
      title,
      description: scenarioContent.substring(0, 500),
      model: input.pedagogicalModel || "addie",
      message: `Scénario généré avec succès selon le modèle ${model.name}`,
    };
  } catch (error) {
    console.error("[Scenario Generation] Error:", error);
    throw error;
  }
}

/**
 * Generate scenario from extracted document content
 * This is called after document extraction is complete
 */
export async function generateScenarioFromExtractedContent(
  projectId: number,
  projectTitle: string,
  pedagogicalModel: string,
  targetAudience: string,
  estimatedDuration: number,
  documents: Array<{
    id: number;
    fileName: string;
    extractedContent: string;
  }>,
  language: string = "fr"
): Promise<ScenarioGenerationResult> {
  return generateScenarioWithPedagogicalModel({
    projectId,
    projectTitle,
    pedagogicalModel,
    targetAudience,
    estimatedDuration,
    documents,
    language,
  });
}
