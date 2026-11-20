# CampusFind — Campus Lost and Found Management System

A full-stack lost-and-found platform with a React + Vite + TypeScript SPA, a Laravel 12 REST API, Sanctum cookie authentication, and MySQL persistence.

## Project structure

```text
campus-lost-found/
├── frontend/   # React + Vite + TypeScript + Tailwind CSS
└── backend/    # Laravel 12 REST API + Sanctum + MySQL
```

## Requirements

- Node.js 18+
- PHP 8.2+
- Composer 2+
- MySQL / MariaDB (XAMPP works)
- A MySQL database named `campus_lost_found`

## Backend setup

```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure these values in `backend/.env`:

```env
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campus_lost_found
DB_USERNAME=root
DB_PASSWORD=
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:5174,127.0.0.1:5174,localhost:3000
```

Create the database, then run:

```powershell
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

The API is available at `http://localhost:8000/api`.

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. If port 5173 is already in use, Vite will choose the next available port (for example 5174); CORS and Sanctum are configured for both.

### Single-URL setup (recommended)

To run the UI and API together at `http://localhost:8000`, build the frontend into Laravel's public directory:

```powershell
cd frontend
npm run deploy
```

Then visit `http://localhost:8000`. Laravel serves the React app for UI routes and the API under `/api`. Re-run `npm run deploy` after any frontend change. The Vite dev server on 5173/5174 remains available for development.

The frontend API URL is set in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campusfind.local` | `Admin@12345` |
| Student | `student@campusfind.local` | `Student@123` |
| Student | `juan@campusfind.local` | `Student@123` |

## Implemented features

### Student

- Registration, login, logout, password reset flow
- Dashboard with live statistics and recent items
- Browse with search, category, type, status, and sorting filters
- Lost/found report submission with multiple image uploads
- Edit and delete own reports
- Item details with reporter information and claim actions
- Ownership claims with proof upload and tracking
- QR verification screen for approved claims
- Notifications, activity history, and profile management
- Email verification code flow and profile photo upload
- Help center with FAQs and support ticket submission

### Admin

- Dashboard with platform statistics, recent reports, and claims
- User management, including activate/deactivate
- Report review with approve/reject and deletion
- Claim review with approval, rejection, and verification
- Category CRUD
- Full activity log viewer
- Support ticket inbox with responses

## Notes

- Authentication uses Laravel Sanctum stateful SPA cookies. The Axios client fetches `/sanctum/csrf-cookie` and sends `X-XSRF-TOKEN` on mutating requests.
- Uploaded files are stored in `backend/storage/app/public` and served through the `public/storage` symlink created by `php artisan storage:link`.
- Password resets and email verification codes are returned by development-only endpoints because mail delivery is not configured. Remove or protect `POST /api/dev/reset-token` before production.
- Seeded items intentionally have no images; the UI renders illustrated placeholders when an image is missing.

## Verification commands

```powershell
# Backend routes
php artisan route:list --path=api

# Frontend production build
cd frontend
npm run build
```
