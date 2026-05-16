import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const analysisController = new AnalysisController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/analysis/architecture/:repositoryId
 * @desc    Trigger architecture analysis
 * @access  Private
 */
router.post('/architecture/:repositoryId', analysisController.analyzeArchitecture);

/**
 * @route   POST /api/v1/analysis/debt/:repositoryId
 * @desc    Trigger technical debt analysis
 * @access  Private
 */
router.post('/debt/:repositoryId', analysisController.analyzeTechnicalDebt);

/**
 * @route   GET /api/v1/analysis/:repositoryId
 * @desc    Get all analyses for a repository
 * @access  Private
 */
router.get('/:repositoryId', analysisController.getAnalyses);

/**
 * @route   GET /api/v1/analysis/:repositoryId/:analysisId
 * @desc    Get a specific analysis
 * @access  Private
 */
router.get('/:repositoryId/:analysisId', analysisController.getAnalysis);

export default router;

// Made with Bob