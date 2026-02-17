import { query } from '../config/db.js';

const userModel = {
    async create(email, hashedPassword, username, role = 'author') {
        const sql = `
            INSERT INTO users (email, password, username, role, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, username, email, role, created_at
        `;
        const values = [email, hashedPassword, username, role];
        
        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        
        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    },

    async findById(id) {
        const sql = 'SELECT id, username, email, role, created_at FROM users WHERE id = $1';
        const values = [id];
        
        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    },

    async emailExists(email) {
        const sql = 'SELECT COUNT(*) FROM users WHERE email = $1';
        const values = [email];
        
        try {
            const result = await query(sql, values);
            return result.rows[0].count > 0;
        } catch (error) {
            console.error('Error checking email:', error);
            throw error;
        }
    }
};

export default userModel;
