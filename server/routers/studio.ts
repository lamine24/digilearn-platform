/**
 * Studio Router - tRPC procedures for scenario generation and management
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { studioProjects, studioDocuments, studioScenarios } from '../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';
import { storagePut } from '../storage';
import { generateScenarioPrompt } from '../pedagogical-models';
import { exportProfessionalScenarioPdf, generateProfessionalExportFilename } from '../scenario-export-professional';
import { TRPCError } from '@trpc/server';

/**
 * Create a new studio project
 */
export const createProject = protectedProcedure
  .input(
    z.object({
      title: z.string().min(1).max(500),
      description: z.string().optional(),
      pedagogicalModel: z.enum(['addie', 'qddie', 'bloom', 'sac', 'professional']).default('professional'),
      targetAudience: z.string().optional(),
      estimatedDuration: z.number().optional(),
      author: z.string().optional(),
      institution: z.string().optional(),
      credits: z.number().optional(),
      prerequisites: z.string().optional(),
      generalObjective: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await db.insert(studioProjects).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      slug,
      pedagogicalModel: input.pedagogicalModel,
      targetAudience: input.targetAudience,
      estimatedDuration: input.estimatedDuration,
      author: input.author,
      institution: input.institution,
      credits: input.credits,
      prerequisites: input.prerequisites,
      generalObjective: input.generalObjective,
    });

    return { slug, title: input.title };
  });

/**
 * Get a single studio project
 */
export const getProject = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const result = await db.select().from(studioProjects)
      .where(and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)))
      .limit(1);

    if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

    return result[0];
  });

/**
 * Get a studio project by slug
 */
export const getProjectBySlug = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const result = await db.select().from(studioProjects)
      .where(and(eq(studioProjects.slug, input.slug), eq(studioProjects.userId, ctx.user.id)))
      .limit(1);

    if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

    return result[0];
  });

/**
 * List all studio projects for the current user
 */
export const listProjects = protectedProcedure.query(async ({ ctx }) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

  const projects = await db.select().from(studioProjects)
    .where(eq(studioProjects.userId, ctx.user.id))
    .orderBy(desc(studioProjects.createdAt));

  return projects;
});

/**
 * Get all studio projects for the current user (alias for listProjects)
 */
export const getUserProjects = protectedProcedure.query(async ({ ctx }) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

  const projects = await db.select().from(studioProjects)
    .where(eq(studioProjects.userId, ctx.user.id))
    .orderBy(desc(studioProjects.createdAt));

  return projects;
});

/**
 * Update a studio project
 */
export const updateProject = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      pedagogicalModel: z.enum(['addie', 'qddie', 'bloom', 'sac', 'professional']).optional(),
      targetAudience: z.string().optional(),
      estimatedDuration: z.number().optional(),
      author: z.string().optional(),
      institution: z.string().optional(),
      credits: z.number().optional(),
      prerequisites: z.string().optional(),
      generalObjective: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

    const updated = await db
      .update(studioProjects)
      .set({
        title: input.title || project.title,
        description: input.description || project.description,
        pedagogicalModel: input.pedagogicalModel || project.pedagogicalModel,
        targetAudience: input.targetAudience || project.targetAudience,
        estimatedDuration: input.estimatedDuration || project.estimatedDuration,
        author: input.author || project.author,
        institution: input.institution || project.institution,
        credits: input.credits || project.credits,
        prerequisites: input.prerequisites || project.prerequisites,
        generalObjective: input.generalObjective || project.generalObjective,
      })
      .where(eq(studioProjects.id, input.projectId));

    return updated;
  });

/**
 * Generate a scenario with LLM
 */
export const generateScenario = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      pedagogicalModel: z.enum(['addie', 'qddie', 'bloom', 'sac', 'professional']).optional(),
      targetAudience: z.string().optional(),
      estimatedDuration: z.number().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const project = await db.query.studioProjects.findFirst({
        where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
      });

      if (!project) throw new Error('Project not found');

      const documents = await db.query.studioDocuments.findMany({
        where: eq(studioDocuments.projectId, input.projectId),
      });

      const { generateScenarioWithPedagogicalModel } = await import('../scenario-generation');
      const scenario = await generateScenarioWithPedagogicalModel({
        projectId: input.projectId,
        pedagogicalModel: input.pedagogicalModel || project.pedagogicalModel,
        targetAudience: input.targetAudience || project.targetAudience || '',
        estimatedDuration: input.estimatedDuration || project.estimatedDuration || 0,
        documents: documents || [],
      });

      return scenario;
    } catch (error) {
      console.error('Scenario generation failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erreur lors de la génération du scénario: ${(error as Error).message}`,
      });
    }
  });

/**
 * Export scenario to PDF
 */
export const exportScenarioPdf = protectedProcedure
  .input(z.object({ scenarioId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const result = await db.select().from(studioScenarios)
        .where(eq(studioScenarios.id, input.scenarioId))
        .limit(1);

      const scenario = result[0];
      if (!scenario) throw new Error('Scenario not found');

      const pdfBuffer = await exportProfessionalScenarioPdf(scenario);
      const filename = generateProfessionalExportFilename(scenario.title);
      const { url } = await storagePut(`scenarios/${filename}.pdf`, pdfBuffer, 'application/pdf');

      return { url, filename };
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erreur lors de l'export PDF: ${(error as Error).message}`,
      });
    }
  });

/**
 * Upload document for scenario generation
 */
export const uploadDocument = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      filename: z.string(),
      description: z.string().optional(),
      fileUrl: z.string(),
      mimeType: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const document = await db.insert(studioDocuments).values({
      projectId: input.projectId,
      filename: input.filename,
      description: input.description,
      fileUrl: input.fileUrl,
      mimeType: input.mimeType,
      status: 'pending',
    });

    return document;
  });

/**
 * Get project documents
 */
export const getProjectDocuments = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const documents = await db.select().from(studioDocuments)
      .where(eq(studioDocuments.projectId, input.projectId));

    return documents;
  });

/**
 * Get project scenarios
 */
export const getProjectScenarios = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const scenarios = await db.select().from(studioScenarios)
      .where(eq(studioScenarios.projectId, input.projectId));

    return scenarios;
  });

/**
 * Get project capsules (video content)
 */
export const getProjectCapsules = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    // For now, return empty array as capsules table doesn't exist yet
    // This can be extended when video capsule feature is implemented
    return [];
  });

/**
 * Generate a scenario preview with LLM
 */
export const previewScenario = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      pedagogicalModel: z.enum(['addie', 'qddie', 'bloom', 'sac', 'professional']).optional(),
      targetAudience: z.string().optional(),
      estimatedDuration: z.number().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Get project
      const projectResult = await db.select().from(studioProjects)
        .where(and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)))
        .limit(1);
      const project = projectResult[0];
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      // Get documents
      const documents = await db.select().from(studioDocuments)
        .where(eq(studioDocuments.projectId, input.projectId));

      if (documents.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No documents found for this project. Please upload documents first.' });
      }

      // Generate scenario using LLM
      const { generateScenarioWithPedagogicalModel } = await import('../scenario-generation');
      const result = await generateScenarioWithPedagogicalModel({
        projectId: input.projectId,
        projectTitle: project.title,
        pedagogicalModel: input.pedagogicalModel || project.pedagogicalModel || 'professional',
        targetAudience: input.targetAudience || project.targetAudience || '',
        estimatedDuration: input.estimatedDuration || project.estimatedDuration || 0,
        documents: documents.map(doc => ({
          id: doc.id,
          fileName: doc.fileName,
          extractedContent: doc.extractedContent || '',
        })),
        language: 'fr',
      });

      return {
        success: true,
        preview: {
          title: result.title,
          description: result.scenario,
          pedagogicalModel: input.pedagogicalModel || 'professional',
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erreur lors de la génération de l'aperçu: ${(error as Error).message}`,
      });
    }
  });

/**
 * Delete a scenario
 */
export const deleteScenario = protectedProcedure
  .input(z.object({ scenarioId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Verify the scenario exists and belongs to the user's project
    const scenario = await db
      .select()
      .from(studioScenarios)
      .where(eq(studioScenarios.id, input.scenarioId))
      .limit(1);

    if (!scenario.length) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
    }

    // Verify the project belongs to the user
    const project = await db
      .select()
      .from(studioProjects)
      .where(eq(studioProjects.id, scenario[0].projectId))
      .limit(1);

    if (!project.length || project[0].userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
    }

    // Delete the scenario
    await db.delete(studioScenarios).where(eq(studioScenarios.id, input.scenarioId));

    return { success: true };
  });

export const studioRouter = router({
  createProject,
  getProject,
  getProjectBySlug,
  listProjects,
  getUserProjects,
  updateProject,
  previewScenario,
  generateScenario,
  exportScenarioPdf,
  uploadDocument,
  getProjectDocuments,
  getProjectScenarios,
  getProjectCapsules,
  deleteScenario,
});
