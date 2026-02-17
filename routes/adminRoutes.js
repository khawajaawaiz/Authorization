import express from 'express';
import adminController from '../controllers/adminController.js';
import verifyToken from '../middleware/auth.js';
import roleAuth from '../middleware/roleAuth.js';

const router = express.Router();

// All routes here require:
// 1. Login (verifyToken)
// 2. Admin Role (roleAuth.checkAdminOnly)

router.use(verifyToken);
router.use(roleAuth.checkAdminOnly());

// 1. List Users
router.get('/users', adminController.getAllUsers);

// 2. Change Role
router.post('/users/role', adminController.changeUserRole);

// 3. Delete User
router.post('/users/:id/delete', adminController.deleteUser);

export default router;
