import { Router } from 'express';
import { ArchitectureController } from '../controllers/architecture.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const architectureController = new ArchitectureController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/architecture/:repositoryId
 * @desc    Get architecture map for a repository
 * @access  Private
 */
router.get('/:repositoryId', architectureController.getArchitectureMap);

export default router;

// Made with Bob