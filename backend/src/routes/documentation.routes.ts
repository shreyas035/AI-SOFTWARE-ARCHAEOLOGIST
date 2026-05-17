import { Router } from 'express';
import { DocumentationController } from '../controllers/documentation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const documentationController = new DocumentationController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/documentation/:repositoryId
 * @desc    Get generated documentation for a repository
 * @access  Private
 * @query   type - Filter by documentation type (readme, api, architecture, onboarding)
 */
router.get('/:repositoryId', documentationController.getDocumentation);

/**
 * @route   POST /api/v1/documentation/:repositoryId/generate
 * @desc    Generate documentation for a repository
 * @access  Private
 */
router.post('/:repositoryId/generate', documentationController.generateDocumentation);

export default router;

// Made with Bob