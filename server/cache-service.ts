/**
 * Cache Service for Video Generation
 * Implements intelligent caching for narrations, compositions, and render results
 */

import crypto from 'crypto';

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  size: number; // bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // 0-1
  missRate: number; // 0-1
  averageEntrySize: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheConfig {
  maxSize: number; // bytes
  maxEntries: number;
  ttl: number; // milliseconds
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
}

/**
 * In-memory cache with TTL and eviction policies
 */
export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB default
      maxEntries: config.maxEntries || 1000,
      ttl: config.ttl || 24 * 60 * 60 * 1000, // 24 hours default
      evictionPolicy: config.evictionPolicy || 'LRU',
    };
  }

  /**
   * Generate cache key from data
   */
  private generateKey(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Get entry size in bytes
   */
  private getEntrySize(entry: CacheEntry<T>): number {
    return JSON.stringify(entry.value).length;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.ttl);
    const size = this.getEntrySize({ key, value, createdAt: now, expiresAt, hits: 0 });

    // Check if we need to evict entries
    if (this.shouldEvict(size)) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    console.log(`[Cache] Set key: ${key} (size: ${this.formatSize(size)})`);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      console.log(`[Cache] Miss: ${key}`);
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      console.log(`[Cache] Expired: ${key}`);
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hits++;
    console.log(`[Cache] Hit: ${key} (hits: ${entry.hits})`);

    return entry.value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('[Cache] Cleared');
  }

  /**
   * Get or compute value
   */
  async getOrCompute(
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    console.log(`[Cache] Computing: ${key}`);
    const value = await compute();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Check if eviction is needed
   */
  private shouldEvict(newSize: number): boolean {
    const currentSize = this.getTotalSize();
    const entryCount = this.cache.size;

    return (
      currentSize + newSize > this.config.maxSize ||
      entryCount >= this.config.maxEntries
    );
  }

  /**
   * Evict entries based on policy
   */
  private evict(): void {
    console.log(`[Cache] Evicting entries (policy: ${this.config.evictionPolicy})`);

    const entries = Array.from(this.cache.values());

    let toEvict: CacheEntry<T>[];

    switch (this.config.evictionPolicy) {
      case 'LRU': // Least Recently Used
        toEvict = entries.sort((a, b) => a.createdAt - b.createdAt).slice(0, 10);
        break;

      case 'LFU': // Least Frequently Used
        toEvict = entries.sort((a, b) => a.hits - b.hits).slice(0, 10);
        break;

      case 'FIFO': // First In First Out
        toEvict = entries.slice(0, 10);
        break;

      default:
        toEvict = entries.slice(0, 10);
    }

    for (const entry of toEvict) {
      this.cache.delete(entry.key);
      console.log(`[Cache] Evicted: ${entry.key}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = this.getTotalSize();
    const totalRequests = this.hits + this.misses;

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      averageEntrySize: entries.length > 0 ? totalSize / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.createdAt)) : undefined,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.createdAt)) : undefined,
    };
  }

  /**
   * Get total cache size
   */
  private getTotalSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Format size in human-readable format
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log(`
[Cache Statistics]
  Total Entries: ${stats.totalEntries}
  Total Size: ${this.formatSize(stats.totalSize)}
  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%
  Miss Rate: ${(stats.missRate * 100).toFixed(2)}%
  Avg Entry Size: ${this.formatSize(stats.averageEntrySize)}
    `);
  }
}

/**
 * Specialized cache for narrations
 */
export class NarrationCache extends CacheService<{ audioUrl: string; duration: number }> {
  constructor() {
    super({
      maxSize: 50 * 1024 * 1024, // 50MB for narrations
      maxEntries: 500,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      evictionPolicy: 'LFU',
    });
  }

  /**
   * Generate key from text and language
   */
  generateKey(text: string, language: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${text}:${language}`);
    return `narration:${hash.digest('hex')}`;
  }
}

/**
 * Specialized cache for compositions
 */
export class CompositionCache extends CacheService<{ compositionUrl: string; duration: number }> {
  constructor() {
    super({
      maxSize: 100 * 1024 * 1024, // 100MB for compositions
      maxEntries: 200,
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      evictionPolicy: 'LRU',
    });
  }

  /**
   * Generate key from capsule data
   */
  generateKey(capsuleId: string, version: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${capsuleId}:${version}`);
    return `composition:${hash.digest('hex')}`;
  }
}

/**
 * Specialized cache for render results
 */
export class RenderResultCache extends CacheService<{
  videoUrl: string;
  duration: number;
  fileSize: number;
}> {
  constructor() {
    super({
      maxSize: 200 * 1024 * 1024, // 200MB for render results
      maxEntries: 100,
      ttl: 60 * 24 * 60 * 60 * 1000, // 60 days
      evictionPolicy: 'LFU',
    });
  }

  /**
   * Generate key from render parameters
   */
  generateKey(
    capsuleId: string,
    quality: string,
    fps: number,
    codec: string
  ): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${capsuleId}:${quality}:${fps}:${codec}`);
    return `render:${hash.digest('hex')}`;
  }
}

/**
 * Global cache manager
 */
export class CacheManager {
  static narrationCache = new NarrationCache();
  static compositionCache = new CompositionCache();
  static renderResultCache = new RenderResultCache();

  /**
   * Get all cache statistics
   */
  static getAllStats() {
    return {
      narration: this.narrationCache.getStats(),
      composition: this.compositionCache.getStats(),
      renderResult: this.renderResultCache.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    this.narrationCache.clear();
    this.compositionCache.clear();
    this.renderResultCache.clear();
    console.log('[Cache Manager] All caches cleared');
  }

  /**
   * Print all statistics
   */
  static printAllStats(): void {
    console.log('\n=== Cache Statistics ===');
    console.log('\n[Narration Cache]');
    this.narrationCache.printStats();
    console.log('\n[Composition Cache]');
    this.compositionCache.printStats();
    console.log('\n[Render Result Cache]');
    this.renderResultCache.printStats();
  }
}
