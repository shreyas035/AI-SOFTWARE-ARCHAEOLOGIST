import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const comparisonController = new ComparisonController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/comparison/compare
 * @desc    Compare two repositories side-by-side
 * @access  Private
 */
router.post('/compare', comparisonController.compareRepositories);

/**
 * @route   POST /api/v1/comparison/compare-multiple
 * @desc    Compare multiple repositories (batch comparison)
 * @access  Private
 */
router.post('/compare-multiple', comparisonController.compareMultiple);

/**
 * @route   GET /api/v1/comparison/history
 * @desc    Get comparison history
 * @access  Private
 */
router.get('/history', comparisonController.getComparisonHistory);

/**
 * @route   GET /api/v1/comparison/trends/:repositoryId
 * @desc    Get repository metrics trends over time
 * @access  Private
 */
router.get('/trends/:repositoryId', comparisonController.getRepositoryTrends);

/**
 * @route   GET /api/v1/comparison/benchmark/:repositoryId
 * @desc    Compare repository with industry benchmarks
 * @access  Private
 */
router.get('/benchmark/:repositoryId', comparisonController.getBenchmarkComparison);

export default router;

// Made with Bob