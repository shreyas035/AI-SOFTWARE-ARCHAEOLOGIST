import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const onboardingController = new OnboardingController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/onboarding/:repositoryId
 * @desc    Get onboarding path for a repository
 * @access  Private
 */
router.get('/:repositoryId', onboardingController.getOnboardingPath);

export default router;

// Made with Bob