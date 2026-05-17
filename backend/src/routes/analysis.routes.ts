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

/**
 * @route   GET /api/v1/analysis/debt/:repositoryId
 * @desc    Get latest technical debt report
 * @access  Private
 */
router.get('/debt/:repositoryId', async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const report = await prisma.technicalDebtReport.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' }
    });

    if (!report) {
      res.status(404).json({ success: false, message: 'No debt report found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analysis/onboarding/:repositoryId
 * @desc    Get onboarding path
 * @access  Private
 */
router.get('/onboarding/:repositoryId', async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const path = await prisma.onboardingPath.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' }
    });

    if (!path) {
      res.status(404).json({ success: false, message: 'No onboarding path found' });
      return;
    }

    res.json({ success: true, data: path });
  } catch (error) {
    next(error);
  }
});

export default router;

// Made with Bob