import userModel from '../models/userModel.js';

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Purpose: Restrict access based on user roles (admin, author, reader)
 */
const roleAuth = {
    /**
     * Check if user has one of the required roles
     * @param {Array} allowedRoles - List of roles that can access (e.g. ['admin', 'author'])
     */
    checkRole(allowedRoles) {
        return (req, res, next) => {
            // 1. Check if user is logged in (verifyToken should run before this)
            if (!req.user) {
                return res.status(401).send('Access Denied: You must be logged in.');
            }

            // 2. Check if user's role is in the allowed list
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).send(`
                    <h1>403 Forbidden</h1>
                    <p>Access Denied: You do not have permission to perform this action.</p>
                    <p>Required Role: ${allowedRoles.join(' or ')}</p>
                    <p>Your Role: ${req.user.role}</p>
                    <a href="/auth/dashboard">Back to Dashboard</a>
                `);
            }

            // 3. Role is allowed, proceed
            next();
        };
    },

    /**
     * Check if user is Admin OR owns the resource
     * @param {Object} Model - Database model to fetch resource (must have findById)
     * @param {String} idParam - Name of the route parameter containing ID (e.g. 'id')
     */
    checkOwnership(Model, idParam = 'id') {
        return async (req, res, next) => {
            try {
                // 1. Get User ID and Resource ID
                const userId = req.user.id;
                const resourceId = req.params[idParam];

                // 2. Fetch resource from database
                const resource = await Model.findById(resourceId);

                if (!resource) {
                    return res.status(404).send('Resource not found');
                }

                // 3. Admin Bypass: Admins can do anything
                if (req.user.role === 'admin') {
                    // Attach resource to request for controller to use
                    req.resource = resource; 
                    return next();
                }

                // 4. Ownership Check
                // Assuming resource has 'author_id' or 'user_id'
                const ownerId = resource.author_id || resource.user_id;

                if (ownerId !== userId) {
                     return res.status(403).send(`
                        <h1>403 Forbidden</h1>
                        <p>Access Denied: You can only modify your own content.</p>
                        <a href="/auth/dashboard">Back to Dashboard</a>
                    `);
                }

                // 5. Ownership verified
                req.resource = resource;
                next();

            } catch (error) {
                console.error('Ownership Check Error:', error);
                res.status(500).send('Server Error during authorization');
            }
        };
    },

    /**
     * Short-hand for Admin-only access
     */
    checkAdminOnly() {
        return this.checkRole(['admin']);
    }
};

export default roleAuth;
