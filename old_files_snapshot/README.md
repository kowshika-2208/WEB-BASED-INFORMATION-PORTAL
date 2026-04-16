# College Information Portal (CIP)

Professional MVC web application for college administration with role-based dashboards for Admin, Faculty, and Student.

## Tech Stack
- Node.js + Express
- MySQL (`mysql2`)
- EJS templates
- JWT authentication (cookie-based)
- `bcrypt` password hashing
- Chart.js analytics
- PDFKit for hall ticket download

## Project Structure
- `config/` MySQL connection
- `models/` Data access layer
- `controllers/` Business logic
- `routes/` Route layer
- `middleware/` Auth and validation
- `public/` CSS/JS assets
- `views/` EJS templates
- `sql/` Schema and seed script
- `app.js` Entry point

## Setup
1. Copy `.env.example` to `.env` and update DB credentials.
2. Create tables:
   - Run `sql/schema.sql` in MySQL.
3. Install dependencies:
   - `npm install`
4. Seed sample data:
   - `npm run seed`
5. Start app:
   - `npm run dev`

Open: `http://localhost:3000/login`

## Deploy On Render
This repo includes a root-level `render.yaml` Blueprint that deploys:
- a Node web service for the app from `old_files_snapshot/`
- a private MySQL service with a persistent disk

### Before deploying
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Make sure the app code stays inside `old_files_snapshot/`, because the Render Blueprint uses that as the service `rootDir`.

### Deploy steps
1. In Render, click `New` -> `Blueprint`.
2. Connect the repository that contains this project.
3. Keep the Blueprint path as `render.yaml` at the repo root.
4. Review the two services that Render will create:
   - `cip-mysql`
   - `college-information-portal`
5. Deploy the Blueprint.

### Initialize the database after first deploy
After both services are live, open a shell for the web service in Render and run:

```bash
npm run db:init
node sql/seed.js
```

The first command creates the schema. The second inserts sample users and dashboard data.

### Login after deploy
- Admin: `admin@cip.edu / Admin@123`
- Faculty: `faculty@cip.edu / Faculty@123`
- Student: `student@cip.edu / Student@123`

### Notes
- The web service can use the free plan, but the MySQL private service requires a paid Render instance.
- The app health check endpoint is `/healthz`.
- Render sets `PORT` automatically for web services, so no manual `PORT` value is required there.

## Sample Logins
- Admin: `admin@cip.edu / Admin@123`
- Faculty: `faculty@cip.edu / Faculty@123`
- Student: `student@cip.edu / Student@123`

## Security Features
- JWT auth and role-based middleware
- Password hashing with bcrypt
- Input validation with `express-validator`
- SQL injection protection through parameterized queries
- Centralized error pages/handlers
