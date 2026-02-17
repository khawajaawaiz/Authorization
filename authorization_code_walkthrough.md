# 📘 Authorization System: Comprehensive Code Walkthrough

This document explains **EVERY** important line of code in your authorization system. It is written to help you understand _exactly_ what is happening under the hood, so you can explain it confidently.

---

## ═══════════════════════════════════════════════════════════

## SECTION 1: DATABASE CHANGES - CODE EXECUTION

## ═══════════════════════════════════════════════════════════

You ran SQL commands to upgrade your database. Here is what happened:

### 1. `ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'author';`

- **What happens:** PostgreSQL opens the `users` table structure (schema) and appends a new slot for data called `role`.
- **Memory Change:** It allocates space for a string up to 20 characters for every user.
- **DEFAULT 'author':** This is crucial. It immediately goes through **every existing row** in your table and fills this new empty slot with the word "author". Nobody is left with a `NULL` role.
- **Result:** Now, when your code asks "Who is this user?", the database has an answer for everyone.

### 2. `ALTER TABLE blog_posts ADD COLUMN status VARCHAR(20) DEFAULT 'draft';`

- **What happens:** Similar to above, but for the `blog_posts` table.
- **Logic:** It adds a `status` tag to every post.
- **DEFAULT 'draft':** Every single post that already existed is now marked as a "draft" (private) by default. This is a **fail-safe** security measure—access is denied by default until you say otherwise.

---

## ═══════════════════════════════════════════════════════════

## SECTION 2: THE SECURITY GUARD (middleware/roleAuth.js)

## ═══════════════════════════════════════════════════════════

This file is the specific code that runs **before** your controller logic. It intercepts requests.

### 🔍 Function 1: `checkRole(allowedRoles)`

This function is a "Factory" - it creates a middleware function based on the list you give it.

```javascript
// Line 12: You pass list of allowed roles, e.g., ['admin', 'author']
checkRole(allowedRoles) {
    // Line 13: Returns the actual middleware function
    return (req, res, next) => {

        // Line 15: Safety Check - Is user even logged in?
        // req.user IS SET EARLIER by your verifyToken middleware
        if (!req.user) {
            return res.status(401).send('Access Denied'); // 401 = Unauthorized
        }

        // Line 20: THE CORE CHECK
        // if (['admin', 'author'].includes('reader')) -> FALSE
        if (!allowedRoles.includes(req.user.role)) {
            // 403 = Forbidden (You are logged in, but not allowed here)
            return res.status(403).send('Access Denied...');
        }

        // Line 31: Green Light! Proceed to the next step (Controller)
        next();
    };
},
```

### 🔍 Function 2: `checkOwnership(Model, idParam)`

This is the most advanced part. It connects to the DB to check if you own the item.

```javascript
// Line 40: Takes the DB Model (e.g., blogModel) to look up data
checkOwnership(Model, idParam = 'id') {
    return async (req, res, next) => {

        // Line 44-45: Grab IDs
        const userId = req.user.id;         // Who are you?
        const resourceId = req.params.id;   // Which post is this? (from URL)

        // Line 48: DB Query - Find the post
        const resource = await Model.findById(resourceId);

        // Line 55: ADMIN SUPER-POWER
        // If you are admin, we skip ownership check completely.
        if (req.user.role === 'admin') {
            req.resource = resource; // Save post data for controller to use
            return next();
        }

        // Line 65: THE OWNERSHIP CHECK
        // resource.author_id comes from DB
        // userId comes from your session cookie
        if (resource.author_id !== userId) {
            // Match failed? Kick them out.
            return res.status(403).send('You can only modify your own content');
        }

        // Line 75: Success! You own this. Proceed.
        req.resource = resource;
        next();
    };
},
```

---

## ═══════════════════════════════════════════════════════════

## SECTION 3: THE BRAIN (controllers/blogController.js)

## ═══════════════════════════════════════════════════════════

### 🚀 Creating a Post (`createPost`)

```javascript
// Line 15: Creates the post in DB
const newPost = await blogModel.create(
  title,
  content,
  req.user.id, // <--- THIS IS KEY. We stamp the post with YOUR ID
  status || "draft",
);
```

_Why this matters:_ By forcing `req.user.id` from the secure session (instead of `req.body.author_id` from a form), we prevent hackers from posting as someone else.

### 🔒 Viewing a Post (`getPostById` - Lines 67-97)

This handles the logic: _"Can I see this post?"_

```javascript
// Line 77: Check if it's a Draft
if (post.status === "draft") {
  // Line 84: COMPLEX AUTHORIZATION LOGIC
  // Condition A: Are you the author? (post.author_id === req.user.id)
  // Condition B: Are you an admin? (req.user.role === 'admin')

  // If you are NEITHER A nor B...
  if (post.author_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).send("Access Denied: Private Draft");
  }
}
// If status is 'published', simpler code skips the check above and shows the post.
```

---

## ═══════════════════════════════════════════════════════════

## SECTION 4: THE TRAFFIC POLICEMAN (routes/blogRoutes.js)

## ═══════════════════════════════════════════════════════════

This is where we wire everything together. The **ORDER** matters.

### Protected Route: Create Post

```javascript
router.get(
  "/create",
  verifyToken, // Gate 1: Must be logged in
  roleAuth.checkRole(["author", "admin"]), // Gate 2: Must be Author or Admin
  blogController.renderCreateForm, // Destination: Show the form
);
```

### Protected Route: Edit Post

```javascript
router.get(
  "/:id/edit",
  verifyToken, // Gate 1: Must be logged in
  roleAuth.checkOwnership(blogModel), // Gate 2: Must OWN this specific post
  blogController.renderEditForm, // Destination: Show edit form
);
```

_Deep Dive on Line 49 (`checkOwnership`):_ Notice we pass `blogModel`? This tells the middleware _"Go look in the Blog table to find the owner"_. This makes your middleware reusable for other things later (like Comments).

---

## ═══════════════════════════════════════════════════════════

## SECTION 5: THE ADMIN PANEL (routes/adminRoutes.js)

## ═══════════════════════════════════════════════════════════

We use a "Blanket Policy" here using `router.use`.

```javascript
// Line 12: Apply to ALL routes below this line
router.use(verifyToken);

// Line 13: Apply Admin check to ALL routes below
router.use(roleAuth.checkAdminOnly());
```

_Why?_ It's safer. Instead of adding `checkAdmin` to every single route (and maybe forgetting one), we block the whole router section. If you aren't an admin, you can't even touch the `/users` endpoint.

---

## ═══════════════════════════════════════════════════════════

## SUMMARY FOR TEACHER

## ═══════════════════════════════════════════════════════════

If asked to summarize the code flow:

1.  **Request comes in** (e.g., "Delete Post #5").
2.  **`verifyToken`** checks if the user is who they say they are.
3.  **`roleAuth.checkOwnership`**:
    - Queries DB for Post #5.
    - Checks: `Post.author_id` == `User.id`?
    - OR checks: Is `User.role` == `'admin'`?
4.  If **YES**: Passes request to `blogController.deletePost`.
5.  If **NO**: Returns `403 Forbidden` immediately.
