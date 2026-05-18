/**
 * TTS Admin Router
 * API routes for TTS dashboard administration
 */

import { router, protectedProcedure, adminProcedure } from '../_core/router';
import { z } from 'zod';
import { getVoiceManager } from '../voice-manager';
import { globalMonitor } from '../performance-monitor';

export const ttsAdminRouter = router({
  /**
   * Get all voices
   */
  getVoices: protectedProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const voices = voiceManager.getAllVoices();
    return {
      success: true,
      data: voices,
      count: voices.length,
    };
  }),

  /**
   * Get voices by language
   */
  getVoicesByLanguage: protectedProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(async ({ input }) => {
      const voiceManager = getVoiceManager();
      const voices = voiceManager.getVoicesByLanguage(input.languageCode);
      return {
        success: true,
        data: voices,
        count: voices.length,
      };
    }),

  /**
   * Get voices by gender
   */
  getVoicesByGender: protectedProcedure
    .input(z.object({ gender: z.enum(['MALE', 'FEMALE', 'NEUTRAL']) }))
    .query(async ({ input }) => {
      const voiceManager = getVoiceManager();
      const voices = voiceManager.getVoicesByGender(input.gender);
      return {
        success: true,
        data: voices,
        count: voices.length,
      };
    }),

  /**
   * Get all languages
   */
  getLanguages: protectedProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const languages = voiceManager.getAllLanguages();
    return {
      success: true,
      data: languages,
      count: languages.length,
    };
  }),

  /**
   * Get language configuration
   */
  getLanguageConfig: protectedProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(async ({ input }) => {
      const voiceManager = getVoiceManager();
      const language = voiceManager.getLanguage(input.languageCode);
      return {
        success: !!language,
        data: language,
      };
    }),

  /**
   * Get all presets
   */
  getPresets: protectedProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const presets = voiceManager.getAllPresets();
    return {
      success: true,
      data: presets,
      count: presets.length,
    };
  }),

  /**
   * Get preset by ID
   */
  getPreset: protectedProcedure
    .input(z.object({ presetId: z.string() }))
    .query(async ({ input }) => {
      const voiceManager = getVoiceManager();
      const preset = voiceManager.getPreset(input.presetId);
      return {
        success: !!preset,
        data: preset,
      };
    }),

  /**
   * Create custom preset
   */
  createPreset: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        voiceId: z.string(),
        pitch: z.number(),
        speakingRate: z.number(),
        volumeGainDb: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const voiceManager = getVoiceManager();
      const preset = voiceManager.createPreset(
        input.id,
        input.name,
        input.voiceId,
        input.pitch,
        input.speakingRate,
        input.volumeGainDb
      );

      return {
        success: !!preset,
        data: preset,
        message: preset ? 'Preset created successfully' : 'Failed to create preset',
      };
    }),

  /**
   * Get voice manager statistics
   */
  getVoiceStats: protectedProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const stats = voiceManager.getStats();
    return {
      success: true,
      data: stats,
    };
  }),

  /**
   * Get performance statistics
   */
  getPerformanceStats: protectedProcedure.query(async () => {
    const stats = globalMonitor.getStats();
    return {
      success: true,
      data: stats,
    };
  }),

  /**
   * Get metric history
   */
  getMetricHistory: protectedProcedure
    .input(z.object({ metricName: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const history = globalMonitor.getMetricHistory(input.metricName, input.limit);
      return {
        success: true,
        data: history,
        count: history.length,
      };
    }),

  /**
   * Export voice configuration
   */
  exportVoiceConfig: adminProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const voices = voiceManager.getAllVoices();
    const presets = voiceManager.getAllPresets();
    const languages = voiceManager.getAllLanguages();

    return {
      success: true,
      data: {
        voices,
        presets,
        languages,
        exportedAt: new Date().toISOString(),
      },
    };
  }),

  /**
   * Get dashboard summary
   */
  getDashboardSummary: protectedProcedure.query(async () => {
    const voiceManager = getVoiceManager();
    const voiceStats = voiceManager.getStats();
    const performanceStats = globalMonitor.getStats();

    return {
      success: true,
      data: {
        voices: voiceStats,
        performance: performanceStats,
        summary: {
          totalVoices: voiceStats.totalVoices,
          totalLanguages: voiceStats.totalLanguages,
          totalPresets: voiceStats.totalPresets,
          cacheHitRate: performanceStats.cacheHitRate,
          errorRate: performanceStats.errorRate,
          throughput: performanceStats.throughput,
        },
      },
    };
  }),
});
