import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs-extra';
import logger from '../../config/logger';

export interface ExtractionResult {
  extractedPath: string;
  fileCount: number;
  totalSize: number;
  rootDirectory: string;
}

export class ZipExtractor {
  private readonly extractionBaseDir: string;

  constructor(extractionBaseDir: string = './repositories') {
    this.extractionBaseDir = extractionBaseDir;
  }

  /**
   * Extract a ZIP file to a destination directory
   */
  async extract(zipPath: string, repositoryId: string): Promise<ExtractionResult> {
    try {
      logger.info('Starting ZIP extraction', { zipPath, repositoryId });

      // Create extraction directory
      const extractPath = path.join(this.extractionBaseDir, repositoryId);
      await fs.ensureDir(extractPath);

      // Load ZIP file
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Extract all files
      zip.extractAllTo(extractPath, true);

      // Calculate statistics
      let fileCount = 0;
      let totalSize = 0;

      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          fileCount++;
          totalSize += entry.header.size;
        }
      }

      // Find root directory (handle nested ZIP structures)
      const rootDirectory = await this.findRootDirectory(extractPath);

      logger.info('ZIP extraction completed', {
        repositoryId,
        fileCount,
        totalSize,
        rootDirectory,
      });

      return {
        extractedPath: extractPath,
        fileCount,
        totalSize,
        rootDirectory,
      };
    } catch (error) {
      logger.error('ZIP extraction failed', { error, zipPath, repositoryId });
      throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find the root directory of the extracted repository
   * Handles cases where ZIP contains a single root folder
   */
  private async findRootDirectory(extractPath: string): Promise<string> {
    const entries = await fs.readdir(extractPath);

    // If there's only one entry and it's a directory, use it as root
    if (entries.length === 1) {
      const singleEntry = path.join(extractPath, entries[0]);
      const stat = await fs.stat(singleEntry);

      if (stat.isDirectory()) {
        return singleEntry;
      }
    }

    // Otherwise, the extract path itself is the root
    return extractPath;
  }

  /**
   * Clean up extracted files
   */
  async cleanup(repositoryId: string): Promise<void> {
    try {
      const extractPath = path.join(this.extractionBaseDir, repositoryId);
      await fs.remove(extractPath);
      logger.info('Cleaned up extracted repository', { repositoryId });
    } catch (error) {
      logger.error('Cleanup failed', { error, repositoryId });
    }
  }

  /**
   * Validate ZIP file
   */
  async validate(zipPath: string): Promise<boolean> {
    try {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      return entries.length > 0;
    } catch (error) {
      logger.error('ZIP validation failed', { error, zipPath });
      return false;
    }
  }
}

// Made with Bob
