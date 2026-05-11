# PDF-Reader Codebase Analysis

## 1. Build and Test Commands

### Backend
```bash
npm start          # Start Express server on port 5000
npm test           # Not configured (currently echoes error)
```
- **Main entry:** [index.js](index.js)
- **Type:** CommonJS (`"type": "commonjs"`)
- **Node version:** Express 5.2.1

### Frontend
```bash
npm run dev:h5              # Development server for H5
npm run build:h5            # Build for H5
npm run dev:mp-weixin       # Development for WeChat Mini Program
npm run build:mp-weixin     # Build for WeChat Mini Program
```
- **Type:** uni-app (Vue 3.4.21 + multi-platform)
- **Build tool:** Vite 5.2.8
- **Platforms supported:** H5, WeChat Mini Program

---

## 2. Architectural Patterns

### Backend Structure: MVC Pattern

**Routes → Controllers → Models → Database**

```
routes/          # Express route handlers
  ├── auth.js
  ├── books.js
  ├── bookshelf.js
  └── redeemCodes.js
  
controllers/     # Business logic
  ├── auth.js
  ├── books.js
  ├── bookshelf.js
  └── redeemCodes.js
  
models/          # Mongoose schemas
  ├── User.js
  ├── Book.js
  ├── BookshelfItem.js
  ├── RedeemCode.js
  └── PDF.js
```

### Middleware Pipeline

**Order matters:**
```javascript
1. CORS (cors)
2. Helmet (security headers)
3. Body parsers (express.json)
4. Static files (uploads)
5. Route handlers
6. Custom middlewares (auth, pagination, validation)
7. Error handler (final)
```

### Middleware Patterns

- **auth.js** - JWT token validation (Bearer scheme)
- **requireRole.js** - RBAC wrapper `requireRole('admin')`
- **pagination.js** - Query params: `page`, `limit` (min:1, max:100)
- **validation.js** - Input validation before controllers
- **errorHandler.js** - Global error handler (must be last)

---

## 3. Database Schema Patterns (Mongoose)

### Key Conventions

- All timestamps use `Date` type with `default: Date.now`
- String fields use `trim: true` to clean whitespace
- IDs use ObjectId references: `mongoose.Schema.Types.ObjectId`
- Enums for restricted fields: `enum: ['admin', 'user']`
- Sparse indexes for optional unique fields: `unique: true, sparse: true`

### Schema Examples

**User**
```javascript
{
  username: String (required),
  phone: String (required, unique),
  email: String (optional, unique, sparse),
  password: String (required, hashed),
  role: ['admin', 'user'] (default: 'user'),
  createdAt: Date
}
```

**Book**
```javascript
{
  title, author, publisher, isbn, category (required),
  coverUrl, description,
  filename, originalname, path, size (PDF metadata),
  createdBy: ObjectId(User) (who uploaded),
  createdAt: Date,
  status: ['active', 'deleted']
}
```

**BookshelfItem** (user's reading progress)
```javascript
{
  userId: ObjectId(User) (required),
  bookId: ObjectId(Book) (required),
  progress: Number (0-100),
  lastPage: Number (bookmark),
  bookmarks: [{ id, page, label, createdAt }] (nested),
  addedAt, lastReadAt, removedAt (soft delete pattern)
}
```

---

## 4. Frontend Component Structure and Vue.js Conventions

### Framework
- **Vue 3** with Composition API support
- **uni-app** for multi-platform (H5 + WeChat Mini Program)
- **Vuex 4** for state management
- **Vite** for bundling

### Page Structure
```
pages/
  ├── index/index.vue       # Home/book list
  ├── login/login.vue       # Auth (login/register mode toggle)
  ├── profile/profile.vue   # User profile
  ├── reader/reader.vue     # PDF reader with pdfjs-dist
  └── upload/upload.vue     # Book upload (admin)
```

### Component Patterns

**Login Component Example:**
```vue
<template>
  <view class="login-container">
    <!-- uni-app uses <view> instead of <div> -->
    <!-- v-if for conditional rendering -->
    <!-- v-model for form binding -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: { account, password }
    }
  },
  methods: {
    async login() {
      // POST to /api/auth/login
      // Store response in Vuex: this.$store.dispatch('login', { user, token })
      // Navigate: uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
/* Uses rpx (responsive pixel unit for mobile) */
</style>
```

### State Management (Vuex)

```javascript
// Store keys
STORAGE_KEYS: {
  user,
  token,
  readingProgress,
  bookmarks
}

// State properties
{
  user,           // Persisted to uni storage
  token,          // JWT token
  currentPDF,     // Active reading session
  readingProgress,// { bookId: pageNumber }
  bookmarks       // Cross-session bookmarks
}

// Mutations
setUser, logout, setToken, setProgress, addBookmark
```

### Uni-App Conventions

- Use `uni.navigateTo()` for page navigation
- Use `uni.reLaunch()` for home-like redirects
- Use `uni.getStorageSync()` / `uni.setStorageSync()` for local storage
- Use `uni.showToast()` for notifications
- Use `<view>` instead of `<div>`, `<text>` instead of `<span>`

---

## 5. API Endpoint Naming Conventions

### Pattern: RESTful + Role-Based

```
POST   /api/auth/register          # No auth required
POST   /api/auth/login             # No auth required

GET    /api/books                  # Admin only, paginated
POST   /api/books                  # Admin only (with multer upload)
PATCH  /api/books/:id              # Admin only
DELETE /api/books/:id              # Admin only
GET    /api/books/:bookId/read     # User access check (redeem logic)

POST   /api/redeem-codes           # Admin: generate codes
GET    /api/redeem-codes/records   # Admin: view usage

POST   /api/bookshelf/redeem       # User: redeem code
GET    /api/bookshelf              # User: get user's books
PUT    /api/bookshelf/:bookId/progress  # User: update reading state
DELETE /api/bookshelf/:bookId      # User: remove book

GET    /health                     # Health check (no auth)
GET    /api/health                 # Health check (no auth)
```

### Rate Limiting

- Auth endpoints: 20 requests per 15 minutes (prevent brute force)

---

## 6. Environment Variables

### Required Configuration

```bash
# Database
MONGO_URI=mongodb://localhost:27017/pdf-reader
# or MongoDB Atlas:
# mongodb+srv://user:password@cluster.mongodb.net/pdf-reader

# Security
JWT_SECRET=<64-char hex string>  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Server
PORT=5000
NODE_ENV=development|production

# CORS
FRONTEND_URL=http://localhost:3000  # Production CORS origin
```

### Auto-loaded via
```javascript
dotenv.config()  // Reads .env file
```

---

## 7. Error Handling and Validation Patterns

### Input Validation Middleware

```javascript
// validators in middleware/validation.js

validateEmail()     // RFC-like regex
validatePhone()     // Chinese format: 1[0-9]{10}
validatePassword()  // Min 6 characters
validateUsername()  // Min 2 characters

// Applied as middleware:
router.post('/register', validateRegister, controller.register)
```

### Error Handling Strategy

**Global Error Handler** (middleware/errorHandler.js):
```javascript
// Catches all errors, logs with timestamp
// Maps error types to HTTP status codes:
- ValidationError    → 400
- CastError         → 400
- MulterError       → 400
- JsonWebTokenError → 401
- TokenExpiredError → 401
- Default           → 500 (Server error)
```

**Controller Pattern:**
```javascript
try {
  // Business logic
  const user = await User.findOne(...)
  if (condition) {
    return res.status(400).json({ message: 'Error message' })
  }
  res.status(201).json({ data })
} catch (error) {
  console.error('Operation error:', error)
  res.status(500).json({ message: 'Server error' })
}
```

### File Upload Validation

```javascript
// In bookController:
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 },     // 100MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files allowed'), false)
    }
  }
})
```

---

## 8. Authentication/Authorization Flow

### Authentication (JWT)

**Registration:**
```
1. POST /api/auth/register { username, phone, email, password }
2. Validate input (phone format, password strength)
3. Check duplicate phone/email
4. Hash password: bcrypt.genSalt(10) + bcrypt.hash()
5. Save User document
6. Return user info (no token yet)
```

**Login:**
```
1. POST /api/auth/login { account (phone|email), password }
2. Find user by phone OR email
3. Compare password: bcrypt.compare(inputPassword, storedHash)
4. Generate JWT: jwt.sign(
     { userId, role },
     JWT_SECRET,
     { expiresIn: '7d' }  // (from code pattern)
   )
5. Return { user, token }
```

### Protected Requests

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Auth Middleware:**
```javascript
// Extracts token from "Bearer <token>"
// Verifies signature against JWT_SECRET
// Attaches req.user = decoded payload { userId, role }
// Returns 401 if invalid/expired
```

### Authorization (RBAC)

**requireRole Middleware:**
```javascript
requireRole('admin')  // Only allows role === 'admin'
requireRole('admin', 'moderator')  // Multiple roles
```

**Applied Example:**
```javascript
router.post('/api/books', 
  authMiddleware,           // Must be logged in
  requireRole('admin'),     // Must have admin role
  bookController.createBook
)
```

### Redeem Code Pattern

```
1. User POST /api/bookshelf/redeem { code }
2. Find RedeemCode by uppercase code
3. Check:
   - Not expired
   - Not already used
   - Associated book is active
4. Create/update BookshelfItem with removedAt = null
5. Mark code as used
```

---

## 9. Custom Webpack/Vite Configs

### Backend
- **No custom webpack** - Uses Node.js directly
- **Config via:** dotenv + environment variables

### Frontend (Vite)

**[vite.config.mjs](PDF-Reader_frontend/vite.config.mjs):**
```javascript
import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()]  // uni-app Vite plugin handles:
                   // - Multi-platform compilation (H5, MP-WeChat)
                   // - pages.json routing
                   // - Component auto-registration
})
```

**No custom:**
- Webpack aliases
- Special loaders
- Environment-specific builds (handled by uni-app CLI flags)

---

## 10. Testing Patterns

### Current Status: **No tests configured**

```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Testing Recommendations (Not Implemented)

**Would typically add:**
- **Backend:** Jest + Supertest (for API routes)
- **Frontend:** Vitest + Testing Library (for components)
- **E2E:** Cypress or Playwright (for full flows)

**Key Areas to Test:**
- Auth flows (register/login validation)
- Protected routes (role checks)
- Pagination edge cases
- Redeem code logic (expiry, duplicates)
- PDF upload (file type, size limits)

---

## Summary: Key Takeaways for New Developers

| Aspect | Pattern |
|--------|---------|
| **Backend Framework** | Express 5, CommonJS modules |
| **Database** | MongoDB + Mongoose (ORM) |
| **Authentication** | JWT (Bearer token) |
| **Authorization** | Role-based (admin/user) |
| **Frontend Platform** | uni-app (Vue 3 + multi-platform) |
| **State** | Vuex 4 + uni storage persistence |
| **API Style** | RESTful + role gates |
| **Error Handling** | Global middleware + try-catch |
| **Validation** | Input middleware + schema validation |
| **File Upload** | Multer with size/type limits |
| **Testing** | None (add Jest + Vitest) |
| **Deployment** | Node.js server + MongoDB Atlas (optional) |

**Environment Variables:** See `.env.example` in backend folder  
**Documentation:** Check `/docs` folder for API specs
