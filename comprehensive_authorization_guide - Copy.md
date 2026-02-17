# 🔐 Comprehensive Authorization System: Code Walkthrough

**Target Audience:** Beginner to Master specific  
**Focus:** Code Execution, Line-by-Line Breakdown, Practical Traces  
**Language:** Technical English with Urdu-English Analogies for Concepts

---

## ═══════════════════════════════════════════════════════════

## SECTION 1: DATABASE CHANGES - CODE EXECUTION

## ═══════════════════════════════════════════════════════════

Humne database structure mein 2 changes kiye. Code exactly kya karta hai, yeh samjhna zaroori hai.

### 1. `ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'author';`

**Technical Execution:**

1.  **Schema Lock:** Postgres table ko lock karta hai.
2.  **Allocation:** Har row ke liye disk pe `role` string ke liye space banata hai.
3.  **Backfilling (DEFAULT 'author'):**
    - Postgres purani har row (User 1, User 2, etc.) par jata hai.
    - Wahan `role` column mein `'author'` value "inject" karta hai.
    - **Result:** Koi bhi user `NULL` role ke sath nahi bachta.
4.  **Constraint:** Humne `CHECK (role IN ('admin', 'author'))` lagaya. Agar koi galat role insert karega, DB reject kar dega.

### 2. `ALTER TABLE blog_posts ADD COLUMN status VARCHAR(20) DEFAULT 'draft';`

**Why 'draft'?**

- **Security by Default:** Agar programmer bhool bhi jaye, to naya post automatically "Private" (Draft) hoga.
- **Execution:** Har existing post ab `status: 'draft'` ban gaya. Aapko manually publish karna padega.

---

## ═══════════════════════════════════════════════════════════

## SECTION 2: RBAC MIDDLEWARE - CODE EXECUTION

## ═══════════════════════════════════════════════════════════

**File:** `middleware/roleAuth.js`

Yeh file **"Digital Security Guard"** hai. Request controller tak pohanchne se pehle yahan scanning hoti hai.

### Function 1: `checkRole(allowedRoles)`

Yeh ek **Higher Order Function (HOF)** hai.

- **Concept:** "Function that returns another Function".
- **Closure:** `allowedRoles` variable memory mein "freeze" ho jata hai.

```javascript
checkRole(allowedRoles) {
    // Outer function runs ONCE when server starts
    // allowedRoles = ['admin'] (for example)

    return (req, res, next) => {
        // Inner function runs ON DISK per request

        // Step 1: Authentication Check
        // req.user kahan se aaya? -> verifyToken middleware ne set kiya tha!
        if (!req.user) {
            return res.status(401).send('Login Required');
        }

        // Step 2: Role Authorization (The Core Logic)
        // Check: Kya ['admin'].includes('author')? -> FALSE
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send('Forbidden!');
        }

        // Step 3: Green Light
        next(); // Pass control to next function
    };
}
```

**PRACTICAL EXECUTION TRACE:**
_Scenario:_ User (Role: 'author') tries to access Admin Panel.

1.  **Request:** `GET /admin/users`
2.  `verifyToken`: Sets `req.user = { id: 10, role: 'author' }`
3.  `checkRole(['admin'])`:
    - `allowedRoles` is `['admin']`
    - `req.user.role` is `'author'`
    - Check: `['admin'].includes('author')` ❌ **FALSE**
4.  **Result:** `res.status(403)` sent immediately used. Controller never runs.

---

### Function 2: `checkOwnership(Model, idParam)`

Logic: **"Ya to Boss (Admin) ho, ya Owner ho."**

```javascript
checkOwnership(Model, idParam = 'id') {
    return async (req, res, next) => {
        // 1. Inputs grab karo
        const userId = req.user.id;         // Session ID (LoggedIn User)
        const resourceId = req.params.id;   // URL ID (Post #5)

        // 2. Database call (Wait karega)
        const resource = await Model.findById(resourceId);

        // 3. ADMIN BYPASS (Master Key)
        if (req.user.role === 'admin') {
            req.resource = resource; // Save for controller
            return next(); // SKIP ownership check
        }

        // 4. Ownership Check
        // resource.author_id comes from DB
        if (resource.author_id !== userId) {
            return res.status(403).send('Not your post!');
        }

        // 5. Success
        req.resource = resource;
        next();
    };
}
```

**EXECUTION TRACE (Blocked Attempt):**
_Scenario:_ User A (ID: 10) tries to edit User B's Post (ID: 55, author_id: 20).

1.  `Model.findById(55)` returns `{ id: 55, title: 'B Post', author_id: 20 }`.
2.  **Admin Check:** Is `User A` admin? No.
3.  **Ownership Check:**
    - `resource.author_id` (20) `!==` `userId` (10)
    - Condition is **TRUE**.
4.  **Action:** `res.status(403).send(...)`. Request dies here. 🚫

---

## ═══════════════════════════════════════════════════════════

## SECTION 3: BLOG MODEL - SQL EXECUTION

## ═══════════════════════════════════════════════════════════

**File:** `models/blogModel.js`

### `create(title, content, authorId, status)`

```javascript
async create(title, content, authorId, status = 'draft') {
  const sql = `
    INSERT INTO blog_posts (title, content, author_id, status, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  // $1 replaced by title
  // $2 replaced by content
  // $3 replaced by authorId (Safe from ID spoofing)
}
```

**STEP-BY-STEP EXECUTION:**

1.  **Function Call:** `create('My Blog', 'Text...', 101, 'published')`
2.  **Parameter Array:** `['My Blog', 'Text...', 101, 'published']`
3.  **PG Library:** Replaces `$1, $2...` safely.
4.  **DB Action:** Inserts row + generates `id` (e.g., 500) + sets `created_at`.
5.  **RETURNING \*:** Postgres sends back the _entire_ new row.
6.  **Return:** JavaScript object `{ id: 500, title: 'My Blog'... }`

---

## ═══════════════════════════════════════════════════════════

## SECTION 4: BLOG CONTROLLER - REQUEST FLOW

## ═══════════════════════════════════════════════════════════

**File:** `controllers/blogController.js`

### `createPost(req, res)` - COMPLETE FLOW

1.  **Request:** POST body has `{ title: "Hi", content: "World" }`
2.  **Middleware Pre-work:** `req.user` is already populated.
3.  **Validation:** `if (!title)` check passes.
4.  **Model Call:**
    ```javascript
    await blogModel.create(title, content, req.user.id, ...)
    ```
    _Note:_ Hum `req.body.author_id` use **NAHI** kar rahe. Hum secure session `req.user.id` use kar rahe hain. Hacker form mein fake ID bhej bhi de to faraq nahi padta.
5.  **Response:** `res.redirect('/blog/my-posts')`

### `updatePost(req, res)` - WITH OWNERSHIP CHECK

Is function mein humne DB call dobara nahi ki author check karne ke liye! Kyun?
**Kyunki Middleware (`checkOwnership`) ne pehle hi kar li thi.**

**Tracing:**

1.  **Middleware:** `checkOwnership` runs -> fetches Post -> Verifies Owner -> sets `req.resource`.
2.  **Controller:**
    ```javascript
    // No need to check owner again. Simple update.
    await blogModel.update(req.params.id, { title, ... });
    ```
3.  **Optimization:** Middleware se data pass karna (`req.resource`) saves us from querying DB twice!

---

## ═══════════════════════════════════════════════════════════

## SECTION 5: ROUTE DEFINITIONS - MIDDLEWARE STACKING

## ═══════════════════════════════════════════════════════════

**File:** `routes/blogRoutes.js`

Yeh hai **Security Chain**. Order bohot matter karta hai.

```javascript
router.post(
  "/create",
  verifyToken, // Guard 1: ID Card Check
  roleAuth.checkRole(["author"]), // Guard 2: VIP List Check
  blogController.createPost, // The Room: Creating the post
);
```

**VISUAL EXECUTION FLOW:**

`Request` ➡️ `verifyToken()` ✅
⬇️ (next)
`checkRole()` 🔍
_Is Role in ['author']?_
⬇️ (YES - next)
`createPost()` ✍️
⬇️
`Response` ⬅️ `res.redirect()`

**What if middleware fails?**
Agar `checkRole` mein `res.send('Error')` hota hai, to `next()` call NAHI hoga. Execution wahi ruk jayegi. `createPost` kabhi run nahi karega. (Security Breach Prevented).

---

## ═══════════════════════════════════════════════════════════

## SECTION 6: ADMIN CONTROLLER - PRIVILEGE ESCALATION

## ═══════════════════════════════════════════════════════════

**File:** `controllers/adminController.js`

### `changeUserRole(req, res)`

Yeh sabse dangerous function hai. Access sirf Super Admin ko hai.

**Execution Trace:**

1.  **Input:** `{ userId: 5, newRole: 'admin' }`
2.  **Self-Lock Check:**
    ```javascript
    if (userId === req.user.id) return error;
    ```
    _Why:_ Taake aap ghalti se khud ko demote na kar lein aur system se bahar ho jayen.
3.  **SQL Update:** `UPDATE users SET role = 'admin' WHERE id = 5`
4.  **Impact:** User 5 agle login par Admin ban jayega.

---

## ═══════════════════════════════════════════════════════════

## SECTION 7: AUTHORIZATION FLOWS - COMPLETE SCENARIOS

## ═══════════════════════════════════════════════════════════

### SCENARIO 2: Author creates draft post

- **Request:** POST `/blog/create`
- **Middleware:**
  1.  `verifyToken` → User ID confirmed.
  2.  `checkRole(['author'])` → User is Author. ✅ Pass.
- **Controller:** `createPost`
  - Calls `blogModel.create(..., status='draft')`
- **DB:** `INSERT INTO ...` (Status is 'draft')
- **Response:** Redirect to Dashboard.

### SCENARIO 4: Author tries to edit OTHER'S post (Theft Attempt)

- **Request:** GET `/blog/999/edit` (Post 999 belongs to someone else)
- **Middleware:**
  1.  `verifyToken` → ✅
  2.  `checkOwnership(blogModel)`
      - Fetches Post 999.
      - Checks `Post.author_id` vs `My ID`.
      - Mismatch! ❌
- **Action:** `res.status(403)`.
- **Controller:** `renderEditForm` is NEVER CALLED. My code is safe.

---

## ═══════════════════════════════════════════════════════════

## SECTION 8: RBAC vs ATTRIBUTE-BASED - PRACTICAL DIFFERENCE

## ═══════════════════════════════════════════════════════════

Humare system mein DONO use ho rahe hain. Fark samjhein:

| Feature                    | Code Example                      | Used Where?                           |
| :------------------------- | :-------------------------------- | :------------------------------------ |
| **RBAC** (Role Based)      | `if (user.role === 'admin')`      | `/admin/users`, `/create` page access |
| **ABAC** (Attribute Based) | `if (post.author_id === user.id)` | Editing/Deleting specific posts       |

**Difference:**

- **RBAC** aapke "Title" par depend karta hai (Rank kya hai?).
- **ABAC** context par depend karta hai (Yeh cheez kiski hai?).

---

## ═══════════════════════════════════════════════════════════

## SECTION 9: SECURITY DEEP DIVE

## ═══════════════════════════════════════════════════════════

### 1. Role Injection Prevention

_Hack Attempt:_ User sends `role: 'admin'` in registration form.
_Defense:_ `userModel.create` mein humne hardcode kiya hai `role = 'author'`. Hum user ka input for 'role' ignore karte hain.

### 2. ID Spoofing Prevention

_Hack Attempt:_ Form mein hidden field `<input name="author_id" value="100">` bhej kar kisi aur ke naam se post karna.
_Defense:_ Controller mein hum `req.user.id` (Session) use karte hain, `req.body.author_id` (Form) nahi.

### 3. XSS in Blogs

_Risk:_ User blog content mein `<script>alert('hack')</script>` likh de.
_Defense:_ EJS by default `<%= content %>` ko escape karta hai (turns `<` into `&lt;`). Script run nahi hoga.

---

## ═══════════════════════════════════════════════════════════

## SECTION 10: TESTING & DEBUGGING

## ═══════════════════════════════════════════════════════════

**Debug Tip:**
Agar `403 Forbidden` aa raha hai aur samajh nahi aa raha kyun:
`roleAuth.js` mein console log layein:

```javascript
console.log("User Role:", req.user.role);
console.log("Allowed:", allowedRoles);
```

**Common Error:**
`Cannot read property 'role' of undefined`
_Reason:_ `verifyToken` middleware bhool gaye. `req.user` set hi nahi hua.

---

## ═══════════════════════════════════════════════════════════

## SECTION 11: TEACHER EXPLANATION GUIDE

## ═══════════════════════════════════════════════════════════

**Analogy for Viva:**

> "Sir, mera Authorization system ek building ki tarah hai."
>
> 1.  **Main Gate (Middleware):** ID Card check karta hai (`verifyToken`).
> 2.  **VIP Lounge (RBAC):** Sirf 'Admin' badge walo ko jane deta hai (`checkRole`).
> 3.  **Personal Lockers (Ownership):** Har lockers sirf wahi khol sakta hai jiski chabi (ID) match kare (`checkOwnership`).

**Key Sentence:**
"Sir, maine Hybrid Model use kiya hai using Node.js Middleware chaining. Pehle Role check hota hai, phir Ownership."

---

## ═══════════════════════════════════════════════════════════

## SECTION 12: INTERVIEW QUESTIONS WITH CODE ANSWERS

## ═══════════════════════════════════════════════════════════

**Q: Middleware stacking kya hai?**
_A:_ Sir, express mein functions sequence mein chalte hain (Chain). Jaise `verifyToken` -> `checkRole` -> `Controller`. Agar pehla fail ho, to agla call nahi hota.

**Q: Privilege Escalation kaise roka?**
_A:_ `adminController` mein check lagaya hai ke koi khud apna role change nahi kar sakta, aur role change karne wala route sirf `checkAdminOnly` middleware se protected hai.

**Q: SQL Injection se kaise bache?**
_A:_ Maine `pg` library use ki hai aur kabhi bhi query concatenate nahi ki. Hamesha `$1, $2` parameters use kiye hain jo input ko sanitized string treat karte hain.
