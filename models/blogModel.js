import { query } from '../config/db.js';

const blogModel = {
    /**
     * Create a new blog post
     * @param {string} title 
     * @param {string} content 
     * @param {number} authorId 
     * @param {string} status - 'draft' or 'published'
     */
    async create(title, content, authorId, status = 'draft') {
        const sql = `
            INSERT INTO blog_posts (title, content, author_id, status, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `;
        const values = [title, content, authorId, status];
        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating blog post:', error);
            throw error;
        }
    },

    /**
     * Find all posts with optional filtering
     * @param {Object} filters - { status: 'published', author_id: 123 }
     */
    async findAll(filters = {}) {
        let sql = `
            SELECT p.*, u.username as author_name 
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramIndex = 1;

        if (filters.status) {
            sql += ` AND p.status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.author_id) {
            sql += ` AND p.author_id = $${paramIndex}`;
            values.push(filters.author_id);
            paramIndex++;
        }

        sql += ` ORDER BY p.created_at DESC`;

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding blog posts:', error);
            throw error;
        }
    },

    /**
     * Find a single post by ID including author details
     * @param {number} id 
     */
    async findById(id) {
        const sql = `
            SELECT p.*, u.username as author_name 
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = $1
        `;
        try {
            const result = await query(sql, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding post by id:', error);
            throw error;
        }
    },

    /**
     * Update an existing post
     * @param {number} id 
     * @param {Object} data - { title, content, status }
     */
    async update(id, data) {
        // Dynamic update query builder
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (data.title) {
            fields.push(`title = $${paramIndex}`);
            values.push(data.title);
            paramIndex++;
        }
        if (data.content) {
            fields.push(`content = $${paramIndex}`);
            values.push(data.content);
            paramIndex++;
        }
        if (data.status) {
            fields.push(`status = $${paramIndex}`);
            values.push(data.status);
            paramIndex++;
        }

        if (fields.length === 0) return null; // Nothing to update

        // Add ID as the last parameter
        values.push(id);
        
        const sql = `
            UPDATE blog_posts 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    },

    /**
     * Delete a post
     * @param {number} id 
     */
    async delete(id) {
        const sql = 'DELETE FROM blog_posts WHERE id = $1 RETURNING id';
        try {
            const result = await query(sql, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }
};

export default blogModel;
