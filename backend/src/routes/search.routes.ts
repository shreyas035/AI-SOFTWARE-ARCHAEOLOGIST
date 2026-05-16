import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const searchController = new SearchController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/search/code/:repositoryId
 * @desc    Search for code patterns in a repository
 * @access  Private
 */
router.post('/code/:repositoryId', searchController.searchCode);

/**
 * @route   GET /api/v1/search/functions/:repositoryId
 * @desc    Search for function definitions
 * @access  Private
 */
router.get('/functions/:repositoryId', searchController.searchFunctions);

/**
 * @route   GET /api/v1/search/classes/:repositoryId
 * @desc    Search for class definitions
 * @access  Private
 */
router.get('/classes/:repositoryId', searchController.searchClasses);

/**
 * @route   GET /api/v1/search/imports/:repositoryId
 * @desc    Search for import statements
 * @access  Private
 */
router.get('/imports/:repositoryId', searchController.searchImports);

/**
 * @route   GET /api/v1/search/todos/:repositoryId
 * @desc    Search for TODO/FIXME comments
 * @access  Private
 */
router.get('/todos/:repositoryId', searchController.searchTodos);

/**
 * @route   GET /api/v1/search/repositories
 * @desc    Advanced repository search with filters
 * @access  Private
 */
router.get('/repositories', searchController.searchRepositories);

/**
 * @route   GET /api/v1/search/suggestions/:repositoryId
 * @desc    Get search suggestions for a repository
 * @access  Private
 */
router.get('/suggestions/:repositoryId', searchController.getSearchSuggestions);

export default router;

// Made with Bob