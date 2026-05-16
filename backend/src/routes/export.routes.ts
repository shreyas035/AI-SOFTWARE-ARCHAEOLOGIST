import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/export/repository/:repositoryId
 * @desc    Export repository data and analysis results
 * @access  Private
 */
router.post('/repository/:repositoryId', exportController.exportRepository);

/**
 * @route   GET /api/v1/export/summary/:repositoryId
 * @desc    Generate executive summary report
 * @access  Private
 */
router.get('/summary/:repositoryId', exportController.generateSummary);

/**
 * @route   POST /api/v1/export/share/:repositoryId
 * @desc    Create shareable link for repository analysis
 * @access  Private
 */
router.post('/share/:repositoryId', exportController.createShareLink);

/**
 * @route   POST /api/v1/export/comparison
 * @desc    Export comparison report
 * @access  Private
 */
router.post('/comparison', exportController.exportComparison);

/**
 * @route   GET /api/v1/export/analysis/:analysisId
 * @desc    Export specific analysis results
 * @access  Private
 */
router.get('/analysis/:analysisId', exportController.exportAnalysis);

/**
 * @route   POST /api/v1/export/bulk
 * @desc    Bulk export multiple repositories
 * @access  Private
 */
router.post('/bulk', exportController.bulkExport);

export default router;

// Made with Bob