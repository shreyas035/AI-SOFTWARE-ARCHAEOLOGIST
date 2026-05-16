import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs-extra';
import logger from '../../config/logger';

export interface CloneResult {
  clonedPath: string;
  branch: string;
  commitHash: string;
  fileCount: number;
}

export class GitHubCloner {
  private readonly cloneBaseDir: string;
  private git: SimpleGit;

  constructor(cloneBaseDir: string = './repositories') {
    this.cloneBaseDir = cloneBaseDir;
    this.git = simpleGit();
  }

  /**
   * Clone a GitHub repository
   */
  async clone(repoUrl: string, repositoryId: string, branch?: string): Promise<CloneResult> {
    try {
      logger.info('Starting GitHub clone', { repoUrl, repositoryId, branch });

      // Create clone directory
      const clonePath = path.join(this.cloneBaseDir, repositoryId);
      await fs.ensureDir(clonePath);

      // Clone options
      const cloneOptions = branch ? ['--branch', branch, '--single-branch'] : [];

      // Clone repository
      await this.git.clone(repoUrl, clonePath, cloneOptions);

      // Get repository info
      const repoGit = simpleGit(clonePath);
      const currentBranch = await repoGit.revparse(['--abbrev-ref', 'HEAD']);
      const commitHash = await repoGit.revparse(['HEAD']);

      // Count files
      const fileCount = await this.countFiles(clonePath);

      logger.info('GitHub clone completed', {
        repositoryId,
        branch: currentBranch,
        commitHash,
        fileCount,
      });

      return {
        clonedPath: clonePath,
        branch: currentBranch,
        commitHash,
        fileCount,
      };
    } catch (error) {
      logger.error('GitHub clone failed', { error, repoUrl, repositoryId });
      throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pull latest changes from a cloned repository
   */
  async pull(repositoryId: string): Promise<void> {
    try {
      const clonePath = path.join(this.cloneBaseDir, repositoryId);
      const repoGit = simpleGit(clonePath);
      await repoGit.pull();
      logger.info('Repository updated', { repositoryId });
    } catch (error) {
      logger.error('Repository pull failed', { error, repositoryId });
      throw new Error(`Failed to pull repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get repository information
   */
  async getInfo(repositoryId: string): Promise<{
    branch: string;
    commitHash: string;
    remoteUrl: string;
  }> {
    try {
      const clonePath = path.join(this.cloneBaseDir, repositoryId);
      const repoGit = simpleGit(clonePath);

      const branch = await repoGit.revparse(['--abbrev-ref', 'HEAD']);
      const commitHash = await repoGit.revparse(['HEAD']);
      const remotes = await repoGit.getRemotes(true);
      const remoteUrl = remotes.find((r) => r.name === 'origin')?.refs.fetch || '';

      return { branch, commitHash, remoteUrl };
    } catch (error) {
      logger.error('Failed to get repository info', { error, repositoryId });
      throw new Error(`Failed to get repository info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up cloned repository
   */
  async cleanup(repositoryId: string): Promise<void> {
    try {
      const clonePath = path.join(this.cloneBaseDir, repositoryId);
      await fs.remove(clonePath);
      logger.info('Cleaned up cloned repository', { repositoryId });
    } catch (error) {
      logger.error('Cleanup failed', { error, repositoryId });
    }
  }

  /**
   * Validate GitHub URL
   */
  validateUrl(url: string): boolean {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(.git)?$/;
    return githubUrlPattern.test(url);
  }

  /**
   * Count files in directory (excluding .git)
   */
  private async countFiles(dirPath: string): Promise<number> {
    let count = 0;

    const countRecursive = async (currentPath: string): Promise<void> => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === '.git') continue;

        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await countRecursive(fullPath);
        } else {
          count++;
        }
      }
    };

    await countRecursive(dirPath);
    return count;
  }
}

// Made with Bob
