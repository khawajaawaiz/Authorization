import express from 'express';
import blogController from '../controllers/blogController.js';
import verifyToken from '../middleware/auth.js';
import roleAuth from '../middleware/roleAuth.js';
import blogModel from '../models/blogModel.js'; // Needed for checkOwnership

const router = express.Router();

// ============================================
// PUBLIC ROUTES (Anyone can access)
// ============================================

// 1. List all published posts
router.get('/', blogController.getAllPosts);

// 2. View single post (Controller handles draft protection)
router.get('/post/:id', verifyToken, blogController.getPostById);


// ============================================
// PROTECTED ROUTES (Logged in users only)
// ============================================

// 3. My Posts Dashboard
router.get('/my-posts', verifyToken, blogController.getMyPosts);


// ============================================
// AUTHOR/ADMIN ROUTES (Restricted)
// ============================================

// 4. Show Create Form
router.get('/create', 
    verifyToken, 
    roleAuth.checkRole(['author', 'admin']), 
    blogController.renderCreateForm
);

// 5. Submit Create Form
router.post('/create', 
    verifyToken, 
    roleAuth.checkRole(['author', 'admin']), 
    blogController.createPost
);

// 6. Show Edit Form (Ownership Check)
router.get('/:id/edit', 
    verifyToken,
    roleAuth.checkOwnership(blogModel, 'id'), 
    blogController.renderEditForm
);

// 7. Submit Update (Ownership Check)
router.post('/:id/edit', 
    verifyToken,
    roleAuth.checkOwnership(blogModel, 'id'), 
    blogController.updatePost
);

// 8. Delete Post (Ownership Check)
router.post('/:id/delete', 
    verifyToken,
    roleAuth.checkOwnership(blogModel, 'id'), 
    blogController.deletePost
);

// 9. Publish Post (Ownership Check)
router.post('/:id/publish', 
    verifyToken,
    roleAuth.checkOwnership(blogModel, 'id'), 
    blogController.publishPost
);

export default router;
