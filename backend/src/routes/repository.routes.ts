import { Router } from 'express';
import multer from 'multer';
import { RepositoryController } from '../controllers/repository.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const repositoryController = new RepositoryController();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/repositories/upload
 * @desc    Upload and process a repository (ZIP file)
 * @access  Private
 */
router.post('/upload', uploadLimiter, upload.single('file'), repositoryController.uploadRepository);

/**
 * @route   POST /api/v1/repositories/clone
 * @desc    Clone a repository from GitHub
 * @access  Private
 */
router.post('/clone', repositoryController.cloneRepository);

/**
 * @route   GET /api/v1/repositories
 * @desc    Get all repositories for the authenticated user
 * @access  Private
 */
router.get('/', repositoryController.getRepositories);

/**
 * @route   GET /api/v1/repositories/:id
 * @desc    Get a specific repository by ID
 * @access  Private
 */
router.get('/:id', repositoryController.getRepository);

/**
 * @route   GET /api/v1/repositories/:id/status
 * @desc    Get repository processing status
 * @access  Private
 */
router.get('/:id/status', repositoryController.getRepositoryStatus);

/**
 * @route   GET /api/v1/repositories/:id/summary
 * @desc    Get repository summary
 * @access  Private
 */
router.get('/:id/summary', repositoryController.getRepositorySummary);

/**
 * @route   DELETE /api/v1/repositories/:id
 * @desc    Delete a repository
 * @access  Private
 */
router.delete('/:id', repositoryController.deleteRepository);

export default router;

// Made with Bob