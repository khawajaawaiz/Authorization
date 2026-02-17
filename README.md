# Authorization & Blog System

A robust Node.js web application featuring a comprehensive authentication system and blog management functionality. Built with Express, EJS, and PostgreSQL (Sequelize).

## 🚀 Features

- **User Authentication**: Secure register and login functionality using `bcrypt` for password hashing and `jsonwebtoken` (JWT) for session management.
- **Authorization**: Role-based access control (RBAC) with protected routes for users and admins.
- **Blog Management**: Full CRUD (Create, Read, Update, Delete) operations for blog posts.
- **Database Integration**: PostgreSQL database integration using Sequelize ORM for efficient data handling.
- **Dynamic Views**: Server-side rendering with EJS templates.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL, Sequelize
- **Authentication**: JWT, bcrypt, cookie-parser
- **Templating**: EJS
- **Environment Management**: dotenv

## 📋 Prerequisites

- Node.js (v14+)
- PostgreSQL installed and running
- A `.env` file (see Configuration)

## ⚙️ Configuration

Create a `.env` file in the root directory and add your database credentials:

```env
DB_NAME=your_db_name
DB_USER=your_username
DB_PASS=your_password
DB_HOST=localhost
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## 🚀 Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/khawajaawaiz/Authorization.git
   cd Authorization
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the application**:
   - For production:
     ```bash
     npm start
     ```
   - For development (with nodemon):
     ```bash
     npm run dev
     ```

## 📂 Project Structure

- `/controllers`: Request handling logic
- `/models`: Database schemas and Sequelize models
- `/routes`: Endpoint definitions (Auth, Admin, Blog)
- `/views`: EJS templates for the frontend
- `/middleware`: Authentication and authorization logic
- `server.js`: Application entry point

## 📜 License

This project is licensed under the ISC License.
