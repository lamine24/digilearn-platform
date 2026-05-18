/**
 * Audio File Manager
 * Manages temporary files and optimization
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  path: string;
  size: number;
  createdAt: number;
  accessedAt: number;
  type: 'temp' | 'output' | 'cache';
}

export interface CleanupPolicy {
  maxAge: number; // milliseconds
  maxSize: number; // bytes
  maxFiles: number;
}

/**
 * Audio File Manager
 */
export class AudioFileManager {
  private tempDir: string;
  private outputDir: string;
  private cacheDir: string;
  private fileRegistry: Map<string, FileInfo> = new Map();
  private cleanupPolicy: CleanupPolicy;

  constructor(
    tempDir: string = '/tmp/audio-temp',
    outputDir: string = '/tmp/audio-output',
    cacheDir: string = '/tmp/audio-cache',
    cleanupPolicy: CleanupPolicy = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 10 * 1024 * 1024 * 1024, // 10GB
      maxFiles: 1000,
    }
  ) {
    this.tempDir = tempDir;
    this.outputDir = outputDir;
    this.cacheDir = cacheDir;
    this.cleanupPolicy = cleanupPolicy;

    this.ensureDirectories();
    this.initializeRegistry();
  }

  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    for (const dir of [this.tempDir, this.outputDir, this.cacheDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[Audio File Manager] Created directory: ${dir}`);
      }
    }
  }

  /**
   * Initialize file registry from disk
   */
  private initializeRegistry(): void {
    const scanDirectory = (dir: string, type: 'temp' | 'output' | 'cache') => {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.isFile()) {
            this.fileRegistry.set(filePath, {
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime.getTime(),
              accessedAt: stats.atime.getTime(),
              type,
            });
          }
        }
      } catch (error) {
        console.error(`[Audio File Manager] Error scanning directory: ${dir}`, error);
      }
    };

    scanDirectory(this.tempDir, 'temp');
    scanDirectory(this.outputDir, 'output');
    scanDirectory(this.cacheDir, 'cache');

    console.log(`[Audio File Manager] Initialized registry with ${this.fileRegistry.size} files`);
  }

  /**
   * Register a file
   */
  registerFile(filePath: string, type: 'temp' | 'output' | 'cache' = 'temp'): void {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        this.fileRegistry.set(filePath, {
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime.getTime(),
          accessedAt: stats.atime.getTime(),
          type,
        });
        console.log(`[Audio File Manager] Registered file: ${filePath}`);
      }
    } catch (error) {
      console.error(`[Audio File Manager] Error registering file: ${filePath}`, error);
    }
  }

  /**
   * Delete a file
   */
  deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.fileRegistry.delete(filePath);
        console.log(`[Audio File Manager] Deleted file: ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error(`[Audio File Manager] Error deleting file: ${filePath}`, error);
    }
    return false;
  }

  /**
   * Cleanup old files based on policy
   */
  cleanupOldFiles(): { deletedCount: number; freedSpace: number } {
    const now = Date.now();
    let deletedCount = 0;
    let freedSpace = 0;

    const filesToDelete: string[] = [];

    // Find files to delete based on age
    for (const [filePath, info] of this.fileRegistry.entries()) {
      const age = now - info.createdAt;

      if (age > this.cleanupPolicy.maxAge) {
        filesToDelete.push(filePath);
      }
    }

    // Delete files
    for (const filePath of filesToDelete) {
      const info = this.fileRegistry.get(filePath);
      if (info && this.deleteFile(filePath)) {
        deletedCount++;
        freedSpace += info.size;
      }
    }

    console.log(
      `[Audio File Manager] Cleanup: deleted ${deletedCount} files, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`
    );

    return { deletedCount, freedSpace };
  }

  /**
   * Cleanup by size limit
   */
  cleanupBySize(): { deletedCount: number; freedSpace: number } {
    let totalSize = 0;
    let deletedCount = 0;
    let freedSpace = 0;

    // Calculate total size
    for (const info of this.fileRegistry.values()) {
      totalSize += info.size;
    }

    // If over limit, delete oldest files
    if (totalSize > this.cleanupPolicy.maxSize) {
      const sortedFiles = Array.from(this.fileRegistry.values())
        .filter((f) => f.type === 'temp') // Only delete temp files
        .sort((a, b) => a.accessedAt - b.accessedAt);

      for (const info of sortedFiles) {
        if (totalSize <= this.cleanupPolicy.maxSize) break;

        if (this.deleteFile(info.path)) {
          deletedCount++;
          freedSpace += info.size;
          totalSize -= info.size;
        }
      }
    }

    console.log(
      `[Audio File Manager] Size cleanup: deleted ${deletedCount} files, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`
    );

    return { deletedCount, freedSpace };
  }

  /**
   * Cleanup by file count limit
   */
  cleanupByFileCount(): { deletedCount: number; freedSpace: number } {
    let deletedCount = 0;
    let freedSpace = 0;

    if (this.fileRegistry.size > this.cleanupPolicy.maxFiles) {
      const sortedFiles = Array.from(this.fileRegistry.values())
        .filter((f) => f.type === 'temp')
        .sort((a, b) => a.accessedAt - b.accessedAt);

      const toDelete = this.fileRegistry.size - this.cleanupPolicy.maxFiles;

      for (let i = 0; i < toDelete && i < sortedFiles.length; i++) {
        const info = sortedFiles[i];
        if (this.deleteFile(info.path)) {
          deletedCount++;
          freedSpace += info.size;
        }
      }
    }

    console.log(
      `[Audio File Manager] File count cleanup: deleted ${deletedCount} files, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`
    );

    return { deletedCount, freedSpace };
  }

  /**
   * Perform full cleanup
   */
  fullCleanup(): { deletedCount: number; freedSpace: number } {
    let totalDeleted = 0;
    let totalFreed = 0;

    const results = [this.cleanupOldFiles(), this.cleanupBySize(), this.cleanupByFileCount()];

    for (const result of results) {
      totalDeleted += result.deletedCount;
      totalFreed += result.freedSpace;
    }

    console.log(
      `[Audio File Manager] Full cleanup: deleted ${totalDeleted} files, freed ${(totalFreed / 1024 / 1024).toFixed(2)}MB`
    );

    return { deletedCount: totalDeleted, freedSpace: totalFreed };
  }

  /**
   * Get directory statistics
   */
  getDirectoryStats(dir: 'temp' | 'output' | 'cache' | 'all' = 'all'): {
    fileCount: number;
    totalSize: number;
    oldestFile?: FileInfo;
    newestFile?: FileInfo;
  } {
    let files: FileInfo[] = [];

    if (dir === 'all') {
      files = Array.from(this.fileRegistry.values());
    } else {
      files = Array.from(this.fileRegistry.values()).filter((f) => f.type === dir);
    }

    let totalSize = 0;
    let oldestFile: FileInfo | undefined;
    let newestFile: FileInfo | undefined;

    for (const file of files) {
      totalSize += file.size;

      if (!oldestFile || file.createdAt < oldestFile.createdAt) {
        oldestFile = file;
      }

      if (!newestFile || file.createdAt > newestFile.createdAt) {
        newestFile = file;
      }
    }

    return {
      fileCount: files.length,
      totalSize,
      oldestFile,
      newestFile,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    return {
      temp: this.getDirectoryStats('temp'),
      output: this.getDirectoryStats('output'),
      cache: this.getDirectoryStats('cache'),
      total: this.getDirectoryStats('all'),
      policy: this.cleanupPolicy,
    };
  }

  /**
   * Update cleanup policy
   */
  updateCleanupPolicy(policy: Partial<CleanupPolicy>): void {
    this.cleanupPolicy = { ...this.cleanupPolicy, ...policy };
    console.log('[Audio File Manager] Updated cleanup policy:', this.cleanupPolicy);
  }

  /**
   * Get file info
   */
  getFileInfo(filePath: string): FileInfo | undefined {
    return this.fileRegistry.get(filePath);
  }

  /**
   * List all files
   */
  listFiles(type?: 'temp' | 'output' | 'cache'): FileInfo[] {
    const files = Array.from(this.fileRegistry.values());

    if (type) {
      return files.filter((f) => f.type === type);
    }

    return files;
  }
}

/**
 * Global file manager instance
 */
let globalFileManager: AudioFileManager | null = null;

/**
 * Initialize global file manager
 */
export function initializeFileManager(
  tempDir?: string,
  outputDir?: string,
  cacheDir?: string
): AudioFileManager {
  if (!globalFileManager) {
    globalFileManager = new AudioFileManager(tempDir, outputDir, cacheDir);
  }
  return globalFileManager;
}

/**
 * Get global file manager
 */
export function getFileManager(): AudioFileManager {
  if (!globalFileManager) {
    throw new Error('File manager not initialized. Call initializeFileManager first.');
  }
  return globalFileManager;
}
