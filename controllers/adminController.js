import { query } from '../config/db.js';

const adminController = {
    // 1. Get All Users
    async getAllUsers(req, res) {
        try {
            // Simple query to get all users
            const sql = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
            const result = await query(sql);
            
            res.render('admin/users', { 
                users: result.rows,
                user: req.user,
                success: req.query.success // For displaying success messages
            });

        } catch (error) {
            console.error('Admin Get Users Error:', error);
            res.status(500).send('Error fetching users');
        }
    },

    // 2. Change User Role
    async changeUserRole(req, res) {
        try {
            const { userId, newRole } = req.body;
            
            // Validate role
            const validRoles = ['admin', 'author', 'reader'];
            if (!validRoles.includes(newRole)) {
                return res.status(400).send('Invalid role');
            }

            // Prevent changing own role (to avoid locking yourself out)
            if (parseInt(userId) === req.user.id) {
                return res.status(400).send('You cannot change your own role.');
            }

            const sql = 'UPDATE users SET role = $1 WHERE id = $2';
            await query(sql, [newRole, userId]);

            res.redirect('/admin/users?success=Role updated successfully');

        } catch (error) {
            console.error('Change Role Error:', error);
            res.status(500).send('Error updating role');
        }
    },

    // 3. Delete User
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;

            // Prevent deleting yourself
            if (parseInt(userId) === req.user.id) {
                return res.status(400).send('You cannot delete your own account.');
            }

            // Delete user (cascade will handle posts if set up, or we might need to delete posts first)
            // Assuming ON DELETE CASCADE is NOT set in simple setup, we might error.
            // But usually for simple apps, let's try direct delete. If it fails due to FK, we need to delete posts first.
            // Let's manually delete posts first to be safe.
            await query('DELETE FROM blog_posts WHERE author_id = $1', [userId]);
            await query('DELETE FROM users WHERE id = $1', [userId]);

            res.redirect('/admin/users?success=User deleted successfully');

        } catch (error) {
            console.error('Delete User Error:', error);
            res.status(500).send('Error deleting user');
        }
    }
};

export default adminController;
