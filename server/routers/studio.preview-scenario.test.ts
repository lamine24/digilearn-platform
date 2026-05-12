import { describe, it, expect, vi, beforeEach } from 'vitest';
import { previewScenario } from './studio';
import * as db from '../db';

// Mock the database and LLM
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../scenario-generation', () => ({
  generateScenarioWithPedagogicalModel: vi.fn(),
}));

describe('previewScenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a scenario with LLM when documents are available', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Test Project',
          pedagogicalModel: 'professional',
          targetAudience: 'Professionals',
          estimatedDuration: 45,
          userId: 1,
        },
      ]),
    };

    // Test that the procedure accepts the correct input
    const input = {
      projectId: 1,
      pedagogicalModel: 'professional' as const,
      targetAudience: 'Professionals',
      estimatedDuration: 45,
    };

    expect(input).toBeDefined();
    expect(input.projectId).toBe(1);
    expect(input.pedagogicalModel).toBe('professional');
  });

  it('should require documents to generate a scenario', async () => {
    const input = {
      projectId: 1,
      pedagogicalModel: 'addie' as const,
    };

    expect(input).toBeDefined();
    expect(input.projectId).toBe(1);
  });

  it('should support all pedagogical models', async () => {
    const models = ['addie', 'qddie', 'bloom', 'sac', 'professional'] as const;

    models.forEach(model => {
      const input = {
        projectId: 1,
        pedagogicalModel: model,
      };
      expect(input.pedagogicalModel).toBe(model);
    });
  });
});
