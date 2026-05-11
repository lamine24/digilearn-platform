/**
 * Studio Router - tRPC procedures for scenario generation and management
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { studioProjects, studioDocuments, studioScenarios } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
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

    const project = await db.insert(studioProjects).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      slug,
      pedagogicalModel: input.pedagogicalModel,
      targetAudience: input.targetAudience,
      estimatedDuration: input.estimatedDuration,
      author: input.author || ctx.user.name || undefined,
      institution: input.institution,
      credits: input.credits,
      prerequisites: input.prerequisites,
      generalObjective: input.generalObjective,
    });

    return { id: project[0].insertId, slug };
  });

/**
 * Get project details
 */
export const getProject = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
    }

    return project;
  });

/**
 * List user's projects
 */
export const listProjects = protectedProcedure.query(async ({ ctx }) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

  const projects = await db.query.studioProjects.findMany({
    where: eq(studioProjects.userId, ctx.user.id),
  });

  return projects;
});

/**
 * Update project
 */
export const updateProject = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      author: z.string().optional(),
      institution: z.string().optional(),
      credits: z.number().optional(),
      prerequisites: z.string().optional(),
      generalObjective: z.string().optional(),
      status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
    }

    await db
      .update(studioProjects)
      .set({
        title: input.title,
        description: input.description,
        author: input.author,
        institution: input.institution,
        credits: input.credits,
        prerequisites: input.prerequisites,
        generalObjective: input.generalObjective,
        status: input.status,
      })
      .where(eq(studioProjects.id, input.projectId));

    return { success: true };
  });

/**
 * Generate scenario using LLM
 */
export const generateScenario = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      documentContent: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
    }

    // Generate prompt based on pedagogical model
    const prompt = generateScenarioPrompt(project.pedagogicalModel, {
      projectTitle: project.title,
      targetAudience: project.targetAudience || 'Apprenants',
      estimatedDuration: project.estimatedDuration || 60,
      documentContent: input.documentContent,
      language: project.language,
      author: project.author,
      institution: project.institution,
      credits: project.credits,
      prerequisites: project.prerequisites,
      generalObjective: project.generalObjective,
    });

    // Call LLM to generate scenario
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en conception pédagogique et en scénarisation de modules de formation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const scenarioContent = response.choices[0].message.content;

    // Save scenario to database
    const scenario = await db.insert(studioScenarios).values({
      projectId: project.id,
      title: `Scénario - ${project.title}`,
      description: scenarioContent,
      pedagogicalModel: project.pedagogicalModel,
      status: 'generated',
      generatedAt: new Date(),
    });

    return {
      scenarioId: scenario[0].insertId,
      content: scenarioContent,
    };
  });

/**
 * Export scenario as PDF
 */
export const exportScenarioPdf = protectedProcedure
  .input(
    z.object({
      scenarioId: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const scenario = await db.query.studioScenarios.findFirst({
      where: eq(studioScenarios.id, input.scenarioId),
      with: {
        project: true,
      },
    });

    if (!scenario) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
    }

    // Verify ownership
    if (scenario.project.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    // Generate PDF
    const pdfBuffer = await exportProfessionalScenarioPdf({
      author: scenario.project.author || 'Non spécifié',
      institution: scenario.project.institution || 'Non spécifiée',
      moduleTitle: scenario.project.title,
      teachingUnit: scenario.project.description || undefined,
      credits: scenario.project.credits,
      totalHours: Math.ceil((scenario.project.estimatedDuration || 60) / 60),
      prerequisites: scenario.project.prerequisites,
      generalObjective: scenario.project.generalObjective || '',
      specificObjectives: [
        'Objectif spécifique 1',
        'Objectif spécifique 2',
        'Objectif spécifique 3',
      ],
      courseSummary: scenario.description?.substring(0, 200) || '',
      sequences: [],
      createdAt: scenario.createdAt,
      pedagogicalModel: scenario.pedagogicalModel,
    });

    // Upload PDF to storage
    const filename = generateProfessionalExportFilename(scenario.project.title);
    const { url } = await storagePut(
      `scenarios/${ctx.user.id}/${scenario.id}/${filename}`,
      pdfBuffer,
      'application/pdf'
    );

    return { url, filename };
  });

/**
 * Upload document for scenario generation
 */
export const uploadDocument = protectedProcedure
  .input(
    z.object({
      projectId: z.number(),
      filename: z.string(),
      fileUrl: z.string(),
      fileKey: z.string(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
    }

    const document = await db.insert(studioDocuments).values({
      projectId: project.id,
      filename: input.filename,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      status: 'pending',
    });

    return { documentId: document[0].insertId };
  });

/**
 * Get project documents
 */
export const getProjectDocuments = protectedProcedure
  .input(z.object({ projectId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const project = await db.query.studioProjects.findFirst({
      where: and(eq(studioProjects.id, input.projectId), eq(studioProjects.userId, ctx.user.id)),
    });

    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
    }

    const documents = await db.query.studioDocuments.findMany({
      where: eq(studioDocuments.projectId, project.id),
    });

    return documents;
  });

/**
 * Studio router
 */
export const studioRouter = router({
  createProject,
  getProject,
  listProjects,
  updateProject,
  generateScenario,
  exportScenarioPdf,
  uploadDocument,
  getProjectDocuments,
});
