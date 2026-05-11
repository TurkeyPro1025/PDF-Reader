# PDF-Reader Project Agent Guidelines

**Project Type:** Full-stack Node.js + Vue.js web application
**Purpose:** Admin-managed digital book library with user code-redemption and reading progress tracking
**Status:** Active development with deployment-ready backend and frontend

---

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start  # Requires MongoDB running at mongodb://localhost:27017/pdf-reader
```

### Frontend Setup (H5 / WeChat Mini Program)
```bash
cd PDF-Reader_frontend
npm install
npm run dev:mp-weixin      # Development mode
npm run build:mp-weixin    # Production build
```

**Environment:** Backend uses `.env` file. Copy from `.env.example` and set required variables.

---

## Architecture Overview

### Business Model
- **Admin Role:** Uploads books, generates redemption codes, manages library
- **User Role:** Registers, redeems codes, builds personal bookshelf, reads books with progress tracking
- **Authentication:** JWT-based; phone number is primary identity key; optional email for login
- **Authorization:** Role-based (`admin` vs `user`); admin status must be set in database manually

### Data Model (MongoDB Collections)
| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User accounts & roles | `phone`, `email`, `role` (`admin`\|`user`), `password` (bcrypt) |
| `books` | Book library metadata & PDF files | `title`, `author`, `filePath`, `uploadedBy`, `removedAt` (soft delete) |
| `redeemcodes` | Redemption codes (1 code per book instance) | `code`, `bookId`, `usedBy`, `usedAt`, `expiresAt` |
| `bookshelfitems` | User's personal books + reading progress | `userId`, `bookId`, `currentPage`, `totalPages`, `lastReadAt`, `bookmarks` |

See [backend/README.md](backend/README.md) for detailed schema descriptions. 

### API Design Patterns
- **Prefix:** All endpoints are `/api/...`
- **Role gating:** Admin-only routes use `requireRole('admin')` middleware
- **File uploads:** Multer-based, 100MB limit, PDF-only validation
- **Soft delete:** `removedAt` timestamp used instead of physical deletion
- **Response pagination:** Configurable via query params; see [backend/middleware/pagination.js](backend/middleware/pagination.js)
- **Error handling:** Global middleware wraps errors; see [backend/middleware/errorHandler.js](backend/middleware/errorHandler.js)

### Frontend Architecture (uni-app)
- **Framework:** Vue 3 + Vuex 4 for state management
- **Storage:** uni-storage for persistent client state (auth token, bookshelf cache)
- **PDF Rendering:** pdfjs-dist for in-page PDF viewing
- **Build Targets:** H5 (web), WeChat Mini Program (`mp-weixin`)
- **Pages:** login, profile, reader, upload, index/home

---

## Directory Structure & Responsibilities

### Backend
```
backend/
├── controllers/        # Business logic layer (auth, books, bookshelf, redeem codes)
├── routes/            # Express route definitions; delegates to controllers
├── models/            # Mongoose schemas (User, Book, BookshelfItem, RedeemCode)
├── middleware/        # Auth, error handling, pagination, role-based access control
├── config/            # Database, storage, indexes initialization
├── uploads/           # PDF file storage (managed via config/storage.js)
└── *.md               # Deployment, security, business checklists
```

**Key Controller Endpoints:**

| Controller | Purpose | Role | Key Methods |
|-----------|---------|------|-------------|
| `auth.js` | Register, login, JWT validation | public | POST `/api/auth/register`, `/api/auth/login` |
| `books.js` | Upload books, list books, manage availability | admin + public | POST `/api/books`, GET `/api/books`, PATCH `/api/books/:id`, DELETE (soft) |
| `redeemCodes.js` | Generate & validate redemption codes | admin | POST `/api/redeem-codes/generate`, GET `/api/redeem-codes/recent` |
| `bookshelf.js` | Redeem codes, personal library, reading progress | user | POST `/api/bookshelf/redeem`, GET `/api/bookshelf`, PUT `/api/bookshelf/:bookId/progress` |

### Frontend
```
PDF-Reader_frontend/
├── src/
│   ├── pages/         # 5 main pages: login, profile, reader, upload, index
│   ├── store/         # Vuex store (auth token, user info, bookshelf cache)
│   ├── utils/         # HTTP client (wraps API calls with token injection)
│   ├── App.vue        # Root component
│   ├── manifest.json  # WeChat Mini Program config
│   ├── pages.json     # uni-app page registry & routing
│   └── uni.scss       # Global styles
├── vite.config.mjs    # Vite build config with uni-app plugin
└── project.config.json # HBuilderX project metadata
```

---

## Development Patterns & Conventions

### Backend

#### Controller Pattern
```javascript
// controllers/books.js: All business logic, all error handling
// Receives sanitized, validated input from middleware
// Returns { success, data, message } or throws Error (caught by middleware)

async function uploadBook(req, res, next) {
  try {
    const { title, author } = req.body;  // validated by middleware
    const pdfFile = req.file;             // multer parsed
    // Store file via config/storage.js
    // Save metadata to MongoDB
    // Return structured response
  } catch (error) {
    next(error);  // Middleware handles response
  }
}
```

#### Middleware Stack
1. `auth.js` → Extracts & validates JWT; attaches `req.user`
2. `requireRole.js` → Gates endpoints; checks `req.user.role`
3. `validation.js` → Body/query validation; rejects before controller
4. `pagination.js` → Adds `req.pagination` (limit, skip)
5. `errorHandler.js` → Final middleware; sends HTTP response

#### Model Pattern
- Use Mongoose schema with timestamps (`createdAt`, `updatedAt`)
- Apply `.trim()` to strings; `.lowercase()` to emails
- Use sparse indexes for optional unique fields
- Call `indexes()` from `config/indexes.js` on startup

#### File Upload
- All files saved via `config/storage.js`
- PDF files stored in `backend/uploads/`
- File validation: `.pdf` only, 100MB max
- Multer error handling integrated into middleware

### Frontend

#### State Management (Vuex)
```javascript
// store/index.js holds:
// - authToken (JWT from login)
// - userInfo (name, role)
// - bookshelfCache (list of user's books)
// Persisted via uni-storage on write

// Usage in components:
computed: {
  authToken() { return this.$store.state.authToken; },
  userRole() { return this.$store.state.userInfo?.role; }
}
```

#### HTTP Client Pattern
```javascript
// utils/http.js auto-injects auth token
// All API calls go through this client
import http from '@/utils/http';
http.get('/api/books').then(res => { /* handle */ });
```

#### Page Structure
- Each page in `pages/` is a `.vue` SFC (single-file component)
- Use uni-storage API for persistence: `uni.getStorage()`, `uni.setStorage()`
- Handle different viewport sizes for H5 + mini program compatibility

---

## Deployment & Operations

### Pre-Deployment Checklist
See [backend/DEPLOYMENT_PRECHECK.md](backend/DEPLOYMENT_PRECHECK.md) for database, environment, and security validations.

### Production Readiness Docs
- **MongoDB Atlas Setup:** [backend/MONGODB_ATLAS_SETUP.md](backend/MONGODB_ATLAS_SETUP.md)
- **Domain & HTTPS:** [backend/DOMAIN_AND_HTTPS_SETUP.md](backend/DOMAIN_AND_HTTPS_SETUP.md)
- **Security Baseline:** [backend/SECURITY_BASELINE.md](backend/SECURITY_BASELINE.md)
- **Node.js Hosting:** [backend/HOSTED_NODE_DEPLOYMENT.md](backend/HOSTED_NODE_DEPLOYMENT.md)
- **Operations Runbook:** [backend/OPERATIONS_RUNBOOK.md](backend/OPERATIONS_RUNBOOK.md)
- **Business Acceptance:** [backend/BUSINESS_ACCEPTANCE_CHECKLIST.md](backend/BUSINESS_ACCEPTANCE_CHECKLIST.md)

### Key Environment Variables (Backend)
```
NODE_ENV=production|development
MONGODB_URI=mongodb://...
JWT_SECRET=<strong-random-secret>
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600  # 100MB
PDF_READER_FRONTEND_URL=https://your-frontend-domain.com
```

---

## Common Development Tasks

### Adding a New Admin Endpoint
1. **Define route** in `backend/routes/*.js` → POST/GET/PATCH /api/...
2. **Add controller** in `backend/controllers/*.js` → async function with try-catch
3. **Add gating** → Use `requireRole('admin')` in route stack
4. **Add validation** → Define schema in `backend/middleware/validation.js`
5. **Test** → Manual HTTP client or unit test
6. **Document** → Update API spec in [docs/api/API_SPEC.md](docs/api/API_SPEC.md)

### Adding a New Frontend Page
1. **Create `.vue` file** in `pages/yourpage/yourpage.vue`
2. **Register in `pages.json`** → Add route mapping
3. **Create store if needed** → Add state/mutations to Vuex
4. **Use http client** → Import from `@/utils/http.js`
5. **Test on H5** → `npm run dev:mp-weixin` then open browser
6. **Test mini program** → Use HBuilderX or WeChat DevTools

### Database Seeding / Migration
- MongoDB collections auto-create on first write
- Indexes created on backend startup via `config/indexes.js`
- Admin role must be set manually in database (no registration path for admins)
- Schema changes: Update Mongoose model → Indices auto-update on restart

---

## Important Gotchas & Quirks

### Books & Soft Deletion
- Deleted books use `removedAt` timestamp, not physical deletion
- Users who already redeemed a deleted book can still read it
- Archived books stop generating new redemption codes but don't break existing bookshelf entries

### Admin Setup
- Admin user cannot be created via registration endpoint
- After registration, manually set `role: "admin"` in MongoDB `users` collection
- Verify with a login test and JWT claims

### Frontend Build
- `npm run build:mp-weixin` → Produces H5 + mini program bundles
- Do NOT commit `dist/build/h5` to version control; regenerate on each deployment
- PDF.js eval warning is expected; not a blocker

### CORS & File Serving
- Backend CORS configured per `NODE_ENV`
- PDF files served via express.static from `uploads/` directory
- Frontend requests use `/api/` prefix for backend calls

### Rate Limiting
- Auth endpoints (login/register) rate-limited to 20 requests per 15 minutes
- Cache misses on token validation may cause cascading queries; consider Redis in production

---

## Related Documentation

- **User Manual:** [docs/user/user_manual.md](docs/user/user_manual.md)
- **API Specification:** [docs/api/API_SPEC.md](docs/api/API_SPEC.md)
- **Backend Troubleshooting:** [backend/README.md](backend/README.md)
- **Frontend Setup:** [PDF-Reader_frontend/README.md](PDF-Reader_frontend/README.md)

---

## Feedback & Suggestions

If you encounter unclear sections, add new patterns, or discover better conventions, update this document to reflect the current state of the project. Keep it concise and actionable.
