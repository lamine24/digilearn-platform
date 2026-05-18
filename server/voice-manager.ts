/**
 * Voice Manager
 * Manages multilingual voices and voice preferences
 */

export interface Voice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalness: 'STANDARD' | 'NEURAL';
  description: string;
  sampleUrl?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  voice: Voice;
  pitch: number;
  speakingRate: number;
  volumeGainDb: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  defaultVoice: Voice;
  alternativeVoices: Voice[];
}

/**
 * Voice Manager
 */
export class VoiceManager {
  private voices: Map<string, Voice> = new Map();
  private presets: Map<string, VoicePreset> = new Map();
  private languages: Map<string, LanguageConfig> = new Map();

  constructor() {
    this.initializeVoices();
    this.initializeLanguages();
    this.initializePresets();
  }

  /**
   * Initialize available voices
   */
  private initializeVoices(): void {
    const voicesData = [
      // French
      { id: 'fr-female-a', name: 'Amélie', language: 'French', languageCode: 'fr-FR', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'fr-male-b', name: 'Julien', language: 'French', languageCode: 'fr-FR', gender: 'MALE' as const, naturalness: 'NEURAL' as const },
      { id: 'fr-neutral-c', name: 'Claude', language: 'French', languageCode: 'fr-FR', gender: 'NEUTRAL' as const, naturalness: 'NEURAL' as const },

      // English
      { id: 'en-female-c', name: 'Emma', language: 'English', languageCode: 'en-US', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'en-male-a', name: 'James', language: 'English', languageCode: 'en-US', gender: 'MALE' as const, naturalness: 'NEURAL' as const },
      { id: 'en-neutral-e', name: 'Alex', language: 'English', languageCode: 'en-US', gender: 'NEUTRAL' as const, naturalness: 'NEURAL' as const },

      // Spanish
      { id: 'es-female-a', name: 'María', language: 'Spanish', languageCode: 'es-ES', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'es-male-b', name: 'Carlos', language: 'Spanish', languageCode: 'es-ES', gender: 'MALE' as const, naturalness: 'NEURAL' as const },

      // German
      { id: 'de-female-a', name: 'Anna', language: 'German', languageCode: 'de-DE', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'de-male-b', name: 'Klaus', language: 'German', languageCode: 'de-DE', gender: 'MALE' as const, naturalness: 'NEURAL' as const },

      // Portuguese
      { id: 'pt-female-a', name: 'Fernanda', language: 'Portuguese', languageCode: 'pt-BR', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'pt-male-b', name: 'Ricardo', language: 'Portuguese', languageCode: 'pt-BR', gender: 'MALE' as const, naturalness: 'NEURAL' as const },

      // Japanese
      { id: 'ja-female-b', name: 'Yuki', language: 'Japanese', languageCode: 'ja-JP', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'ja-male-c', name: 'Takeshi', language: 'Japanese', languageCode: 'ja-JP', gender: 'MALE' as const, naturalness: 'NEURAL' as const },

      // Chinese
      { id: 'zh-female-a', name: 'Wei', language: 'Chinese', languageCode: 'zh-CN', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'zh-male-b', name: 'Ming', language: 'Chinese', languageCode: 'zh-CN', gender: 'MALE' as const, naturalness: 'NEURAL' as const },

      // Arabic
      { id: 'ar-female-a', name: 'Layla', language: 'Arabic', languageCode: 'ar-XA', gender: 'FEMALE' as const, naturalness: 'NEURAL' as const },
      { id: 'ar-male-b', name: 'Karim', language: 'Arabic', languageCode: 'ar-XA', gender: 'MALE' as const, naturalness: 'NEURAL' as const },
    ];

    for (const voiceData of voicesData) {
      const voice: Voice = {
        ...voiceData,
        description: `${voiceData.name} - ${voiceData.gender} voice for ${voiceData.language}`,
      };
      this.voices.set(voice.id, voice);
    }

    console.log(`[Voice Manager] Initialized ${this.voices.size} voices`);
  }

  /**
   * Initialize language configurations
   */
  private initializeLanguages(): void {
    const languages = [
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        defaultVoiceId: 'fr-female-a',
        alternativeVoiceIds: ['fr-male-b', 'fr-neutral-c'],
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        defaultVoiceId: 'en-female-c',
        alternativeVoiceIds: ['en-male-a', 'en-neutral-e'],
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        defaultVoiceId: 'es-female-a',
        alternativeVoiceIds: ['es-male-b'],
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        defaultVoiceId: 'de-female-a',
        alternativeVoiceIds: ['de-male-b'],
      },
      {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        defaultVoiceId: 'pt-female-a',
        alternativeVoiceIds: ['pt-male-b'],
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        defaultVoiceId: 'ja-female-b',
        alternativeVoiceIds: ['ja-male-c'],
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        defaultVoiceId: 'zh-female-a',
        alternativeVoiceIds: ['zh-male-b'],
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        defaultVoiceId: 'ar-female-a',
        alternativeVoiceIds: ['ar-male-b'],
      },
    ];

    for (const lang of languages) {
      const defaultVoice = this.voices.get(lang.defaultVoiceId);
      const alternativeVoices = lang.alternativeVoiceIds
        .map((id) => this.voices.get(id))
        .filter((v) => v !== undefined) as Voice[];

      if (defaultVoice) {
        this.languages.set(lang.code, {
          code: lang.code,
          name: lang.name,
          nativeName: lang.nativeName,
          defaultVoice,
          alternativeVoices,
        });
      }
    }

    console.log(`[Voice Manager] Initialized ${this.languages.size} languages`);
  }

  /**
   * Initialize voice presets
   */
  private initializePresets(): void {
    const presets = [
      {
        id: 'professional-female',
        name: 'Professional Female',
        voiceId: 'fr-female-a',
        pitch: 0,
        speakingRate: 1.0,
        volumeGainDb: 0,
      },
      {
        id: 'professional-male',
        name: 'Professional Male',
        voiceId: 'fr-male-b',
        pitch: 0,
        speakingRate: 1.0,
        volumeGainDb: 0,
      },
      {
        id: 'slow-clear',
        name: 'Slow & Clear',
        voiceId: 'fr-female-a',
        pitch: 0,
        speakingRate: 0.8,
        volumeGainDb: 2,
      },
      {
        id: 'fast-energetic',
        name: 'Fast & Energetic',
        voiceId: 'fr-male-b',
        pitch: 2,
        speakingRate: 1.2,
        volumeGainDb: 1,
      },
      {
        id: 'calm-soothing',
        name: 'Calm & Soothing',
        voiceId: 'fr-female-a',
        pitch: -2,
        speakingRate: 0.9,
        volumeGainDb: -1,
      },
    ];

    for (const preset of presets) {
      const voice = this.voices.get(preset.voiceId);
      if (voice) {
        this.presets.set(preset.id, {
          id: preset.id,
          name: preset.name,
          voice,
          pitch: preset.pitch,
          speakingRate: preset.speakingRate,
          volumeGainDb: preset.volumeGainDb,
        });
      }
    }

    console.log(`[Voice Manager] Initialized ${this.presets.size} presets`);
  }

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): Voice | undefined {
    return this.voices.get(voiceId);
  }

  /**
   * Get all voices
   */
  getAllVoices(): Voice[] {
    return Array.from(this.voices.values());
  }

  /**
   * Get voices by language
   */
  getVoicesByLanguage(languageCode: string): Voice[] {
    return Array.from(this.voices.values()).filter(
      (v) => v.languageCode === languageCode
    );
  }

  /**
   * Get voices by gender
   */
  getVoicesByGender(gender: 'MALE' | 'FEMALE' | 'NEUTRAL'): Voice[] {
    return Array.from(this.voices.values()).filter((v) => v.gender === gender);
  }

  /**
   * Get language configuration
   */
  getLanguage(languageCode: string): LanguageConfig | undefined {
    const lang = Array.from(this.languages.values()).find(
      (l) => l.defaultVoice.languageCode === languageCode
    );
    return lang;
  }

  /**
   * Get all languages
   */
  getAllLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values());
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: string): VoicePreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Get all presets
   */
  getAllPresets(): VoicePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Create custom preset
   */
  createPreset(
    id: string,
    name: string,
    voiceId: string,
    pitch: number,
    speakingRate: number,
    volumeGainDb: number
  ): VoicePreset | null {
    const voice = this.voices.get(voiceId);
    if (!voice) {
      console.warn(`[Voice Manager] Voice not found: ${voiceId}`);
      return null;
    }

    const preset: VoicePreset = {
      id,
      name,
      voice,
      pitch,
      speakingRate,
      volumeGainDb,
    };

    this.presets.set(id, preset);
    console.log(`[Voice Manager] Created preset: ${name}`);
    return preset;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalVoices: number;
    totalLanguages: number;
    totalPresets: number;
    voicesByGender: Record<string, number>;
    voicesByLanguage: Record<string, number>;
  } {
    const voicesByGender: Record<string, number> = {};
    const voicesByLanguage: Record<string, number> = {};

    const voicesArray = Array.from(this.voices.values());
    for (const voice of voicesArray) {
      voicesByGender[voice.gender] = (voicesByGender[voice.gender] || 0) + 1;
      voicesByLanguage[voice.language] = (voicesByLanguage[voice.language] || 0) + 1;
    }

    return {
      totalVoices: this.voices.size,
      totalLanguages: this.languages.size,
      totalPresets: this.presets.size,
      voicesByGender,
      voicesByLanguage,
    };
  }
}

/**
 * Global voice manager instance
 */
let globalVoiceManager: VoiceManager | null = null;

/**
 * Get global voice manager
 */
export function getVoiceManager(): VoiceManager {
  if (!globalVoiceManager) {
    globalVoiceManager = new VoiceManager();
  }
  return globalVoiceManager;
}

/**
 * Create new voice manager
 */
export function createVoiceManager(): VoiceManager {
  return new VoiceManager();
}
