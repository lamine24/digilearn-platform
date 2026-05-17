/**
 * Text Analysis and Segmentation Utilities
 * Analyzes text content and segments it for optimal TTS processing
 */

export interface TextMetrics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordLength: number;
  averageSentenceLength: number;
  readabilityScore: number;
}

export interface TextSegment {
  text: string;
  type: 'sentence' | 'paragraph' | 'section' | 'clause';
  startIndex: number;
  endIndex: number;
  characterCount: number;
  wordCount: number;
}

export interface EmphasisPoint {
  index: number;
  text: string;
  type: 'keyword' | 'important' | 'definition' | 'example';
  confidence: number;
}

/**
 * Analyze text and return metrics
 */
export function analyzeText(text: string): TextMetrics {
  // Character count
  const characterCount = text.length;

  // Word count
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  // Sentence count
  const sentences = text.match(/[.!?]+/g) || [];
  const sentenceCount = sentences.length;

  // Paragraph count
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Average word length
  const averageWordLength = characterCount / Math.max(wordCount, 1);

  // Average sentence length
  const averageSentenceLength = wordCount / Math.max(sentenceCount, 1);

  // Flesch Reading Ease score (simplified)
  const readabilityScore = calculateReadabilityScore(
    characterCount,
    wordCount,
    sentenceCount
  );

  return {
    characterCount,
    wordCount,
    sentenceCount,
    paragraphCount,
    averageWordLength,
    averageSentenceLength,
    readabilityScore,
  };
}

/**
 * Calculate Flesch Reading Ease score
 */
function calculateReadabilityScore(
  characters: number,
  words: number,
  sentences: number
): number {
  if (words === 0 || sentences === 0) return 0;

  // Simplified Flesch Reading Ease formula
  const score =
    206.835 -
    1.015 * (words / Math.max(sentences, 1)) -
    84.6 * (characters / Math.max(words, 1));

  return Math.max(0, Math.min(100, score));
}

/**
 * Segment text by sentences
 */
export function segmentBySentences(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  let match;
  let index = 0;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 0) {
      segments.push({
        text: sentence,
        type: 'sentence',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        characterCount: sentence.length,
        wordCount: sentence.split(/\s+/).length,
      });
    }
  }

  return segments;
}

/**
 * Segment text by paragraphs
 */
export function segmentByParagraphs(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length > 0) {
      const startIndex = text.indexOf(trimmed, currentIndex);
      const endIndex = startIndex + trimmed.length;

      segments.push({
        text: trimmed,
        type: 'paragraph',
        startIndex,
        endIndex,
        characterCount: trimmed.length,
        wordCount: trimmed.split(/\s+/).length,
      });

      currentIndex = endIndex;
    }
  }

  return segments;
}

/**
 * Segment text into optimal chunks for TTS
 */
export function segmentForTTS(
  text: string,
  maxCharacters: number = 500,
  preferSentences: boolean = true
): TextSegment[] {
  const segments: TextSegment[] = [];

  if (preferSentences) {
    const sentences = segmentBySentences(text);
    let currentSegment = '';
    let currentStartIndex = 0;

    for (const sentence of sentences) {
      if ((currentSegment + sentence.text).length <= maxCharacters) {
        currentSegment += (currentSegment ? ' ' : '') + sentence.text;
      } else {
        if (currentSegment) {
          const startIndex = text.indexOf(currentSegment);
          segments.push({
            text: currentSegment,
            type: 'section',
            startIndex,
            endIndex: startIndex + currentSegment.length,
            characterCount: currentSegment.length,
            wordCount: currentSegment.split(/\s+/).length,
          });
        }
        currentSegment = sentence.text;
      }
    }

    if (currentSegment) {
      const startIndex = text.lastIndexOf(currentSegment);
      segments.push({
        text: currentSegment,
        type: 'section',
        startIndex,
        endIndex: startIndex + currentSegment.length,
        characterCount: currentSegment.length,
        wordCount: currentSegment.split(/\s+/).length,
      });
    }
  } else {
    // Simple character-based segmentation
    for (let i = 0; i < text.length; i += maxCharacters) {
      const chunk = text.substring(i, i + maxCharacters);
      segments.push({
        text: chunk,
        type: 'section',
        startIndex: i,
        endIndex: i + chunk.length,
        characterCount: chunk.length,
        wordCount: chunk.split(/\s+/).length,
      });
    }
  }

  return segments;
}

/**
 * Detect emphasis points in text
 */
export function detectEmphasisPoints(text: string): EmphasisPoint[] {
  const points: EmphasisPoint[] = [];

  // Keywords (capitalized words, technical terms)
  const keywordRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  let match;

  while ((match = keywordRegex.exec(text)) !== null) {
    points.push({
      index: match.index,
      text: match[0],
      type: 'keyword',
      confidence: 0.7,
    });
  }

  // Important phrases (words in quotes)
  const importantRegex = /"([^"]+)"/g;
  while ((match = importantRegex.exec(text)) !== null) {
    points.push({
      index: match.index,
      text: match[1],
      type: 'important',
      confidence: 0.9,
    });
  }

  // Definitions (text after "is" or "means")
  const definitionRegex = /(?:is|means|defined as)\s+([^.!?]+)/gi;
  while ((match = definitionRegex.exec(text)) !== null) {
    points.push({
      index: match.index,
      text: match[1].trim(),
      type: 'definition',
      confidence: 0.8,
    });
  }

  // Examples (text after "example" or "e.g.")
  const exampleRegex = /(?:example|e\.g\.|such as)\s+([^.!?]+)/gi;
  while ((match = exampleRegex.exec(text)) !== null) {
    points.push({
      index: match.index,
      text: match[1].trim(),
      type: 'example',
      confidence: 0.75,
    });
  }

  return points.sort((a, b) => a.index - b.index);
}

/**
 * Extract key phrases from text
 */
export function extractKeyPhrases(text: string, minLength: number = 3): string[] {
  const phrases = new Set<string>();

  // Extract noun phrases (simplified)
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - minLength + 1; i++) {
    const phrase = words.slice(i, i + minLength).join(' ');
    if (phrase.length > 0 && !phrase.match(/^[a-z]/)) {
      phrases.add(phrase);
    }
  }

  return Array.from(phrases);
}

/**
 * Calculate text complexity
 */
export function calculateComplexity(text: string): {
  level: 'simple' | 'moderate' | 'complex';
  score: number;
  factors: {
    wordLength: number;
    sentenceLength: number;
    vocabulary: number;
  };
} {
  const metrics = analyzeText(text);

  const wordLengthScore = metrics.averageWordLength / 5; // Normalize to 0-2
  const sentenceLengthScore = metrics.averageSentenceLength / 15; // Normalize to 0-2
  const vocabularyScore = metrics.wordCount / metrics.characterCount; // Unique words ratio

  const totalScore = (wordLengthScore + sentenceLengthScore + vocabularyScore) / 3;

  let level: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (totalScore < 0.5) {
    level = 'simple';
  } else if (totalScore > 1.0) {
    level = 'complex';
  }

  return {
    level,
    score: Math.min(totalScore, 2),
    factors: {
      wordLength: wordLengthScore,
      sentenceLength: sentenceLengthScore,
      vocabulary: vocabularyScore,
    },
  };
}

/**
 * Normalize text for TTS
 */
export function normalizeForTTS(text: string): string {
  // Remove extra whitespace
  let normalized = text.replace(/\s+/g, ' ').trim();

  // Expand common abbreviations
  normalized = normalized.replace(/\b(Dr|Mr|Mrs|Ms|Prof)\./g, '$1');
  normalized = normalized.replace(/\b(etc|e\.g|i\.e)\./g, (match) => {
    const expansions: Record<string, string> = {
      'etc.': 'et cetera',
      'e.g.': 'for example',
      'i.e.': 'that is',
    };
    return expansions[match] || match;
  });

  // Handle numbers
  normalized = normalized.replace(/(\d+)\.(\d+)/g, '$1 point $2');
  normalized = normalized.replace(/(\d{3,})/g, (match) => {
    // Add spaces for readability: 1000 -> one thousand
    return match;
  });

  // Handle special characters
  normalized = normalized.replace(/[&]/g, 'and');
  normalized = normalized.replace(/[@]/g, 'at');
  normalized = normalized.replace(/[#]/g, 'number');

  return normalized;
}

/**
 * Split text into optimal chunks for narration
 */
export function splitForNarration(
  text: string,
  maxDurationSeconds: number = 30,
  speakingRateWordsPerMinute: number = 150
): string[] {
  const maxWordsPerChunk = Math.floor((maxDurationSeconds * speakingRateWordsPerMinute) / 60);
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);

    if (currentChunk.length >= maxWordsPerChunk) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Detect language from text
 */
export function detectLanguage(text: string): 'fr' | 'en' | 'es' | 'de' | 'unknown' {
  // Simple language detection based on common words
  const frenchWords = ['le', 'la', 'de', 'et', 'est', 'un', 'une', 'pour', 'que'];
  const englishWords = ['the', 'is', 'and', 'to', 'a', 'of', 'in', 'for', 'that'];
  const spanishWords = ['el', 'la', 'de', 'y', 'es', 'un', 'una', 'para', 'que'];
  const germanWords = ['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'für', 'dass'];

  const words = text.toLowerCase().split(/\s+/);
  const wordSet = new Set(words);

  const frenchCount = frenchWords.filter((w) => wordSet.has(w)).length;
  const englishCount = englishWords.filter((w) => wordSet.has(w)).length;
  const spanishCount = spanishWords.filter((w) => wordSet.has(w)).length;
  const germanCount = germanWords.filter((w) => wordSet.has(w)).length;

  const counts = {
    fr: frenchCount,
    en: englishCount,
    es: spanishCount,
    de: germanCount,
  };

  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 0) return 'unknown';

  const detected = Object.entries(counts).find(([_, count]) => count === maxCount)?.[0];
  return (detected as 'fr' | 'en' | 'es' | 'de') || 'unknown';
}

/**
 * Format text analysis for logging
 */
export function formatTextAnalysis(metrics: TextMetrics): string {
  return `
    Characters: ${metrics.characterCount}
    Words: ${metrics.wordCount}
    Sentences: ${metrics.sentenceCount}
    Paragraphs: ${metrics.paragraphCount}
    Avg Word Length: ${metrics.averageWordLength.toFixed(2)}
    Avg Sentence Length: ${metrics.averageSentenceLength.toFixed(2)}
    Readability Score: ${metrics.readabilityScore.toFixed(2)}
  `;
}
