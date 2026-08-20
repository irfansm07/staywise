# StayWise - Apartment & Society Management System

Hey there! This is **StayWise**, a full-stack mobile web app I built to help apartment societies and residential complexes manage maintenance complaints, track issue resolution timelines, and broadcast important community notices.

---

### 📌 Note for Evaluators / Reviewers
> **Mobile App View**: I designed this app specifically as a **mobile-first application** for smartphones. For the best experience, please open it on your phone or use your browser's inspect element / Mobile View (set viewport to iPhone/Android mobile size: 375px–430px).

---

## 🔗 Live Application & Demo Accounts

- **Live App Link**: [https://staywise-dun.vercel.app/](https://staywise-dun.vercel.app/)
- **GitHub Repo**: [https://github.com/irfansm07/staywise](https://github.com/irfansm07/staywise)

### Quick Demo Logins:
- **Resident Account**:
  - Email: `hii@gmail.com`
  - Password: `112233`
  - *(Use this to file complaints, upload photos, and track timeline status)*

- **Admin Account**:
  - Email: `rimerge.online@gmail.com`
  - Password: `112233`
  - *(Use this to update complaint status/priority, filter tickets, and post notices)*

---

## 🛠️ Built With

- **Frontend**: React.js (Vite), Custom CSS (Neumorphism / Glassmorphic UI), Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (hosted on Supabase), Prisma ORM
- **Auth**: JWT (JSON Web Tokens), Bcrypt.js, 6-digit Email OTP Verification
- **Email Notifications**: Nodemailer (connected with Gmail SMTP)
- **File Uploads**: Multer disk storage

---

## 🚀 How to Run Locally

### 1. Clone the project
```bash
git clone https://github.com/irfansm07/staywise.git
cd staywise
```

### 2. Backend Setup
```bash
cd server
npm install

# Create environment file
cp .env.example .env

# Push database schema to your PostgreSQL DB
npx prisma db push

# Start backend server
npm run dev
```
Backend server will run at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start Vite frontend
npm run dev
```
Frontend app will open at `http://localhost:5173`.

---

## 🔑 Environment Variables (`server/.env.example`)

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/staywisedb"
DIRECT_URL="postgresql://user:password@localhost:5432/staywisedb"
JWT_SECRET="my_secret_key_123"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="StayWise Portal <your_email@gmail.com>"
```

---

## 🗄️ Database Schema Summary

Here are the main database models I created using Prisma:

- **`User`**: Stores account details (`name`, `email`, `password`, `role`: `RESIDENT` / `ADMIN`, `flatNumber`, `societyName`, `isVerified`, `verificationOTP`).
- **`Complaint`**: Stores complaints raised by residents (`title`, `category`, `description`, `photoUrl`, `priority`: `LOW`/`MEDIUM`/`HIGH`, `status`: `OPEN`/`IN_PROGRESS`/`RESOLVED`, `residentId`).
- **`History`**: Audit log created whenever an admin changes a ticket's status or priority (`status`, `note`, `actorName`, `createdAt`, `complaintId`).
- **`Notice`**: Society announcements posted by admin (`title`, `content`, `isImportant`).
- **`Setting`**: Stores custom app configurations like `overdue_threshold_days`.

---

## 📑 Core API Routes

### Auth (`/api/auth`)
- `POST /api/auth/register` - Create account & send email OTP
- `POST /api/auth/verify-otp` - Verify 6-digit OTP & get JWT token
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get logged-in user profile

### Complaints (`/api/complaints`)
- `POST /api/complaints/create` - File new complaint with photo
- `GET /api/complaints/resident/list` - Get resident's complaints with full history
- `GET /api/complaints/admin/list` - Get all complaints (supports filtering by category, status, date, overdue)
- `PATCH /api/complaints/update-status/:id` - Update status & send email update
- `PATCH /api/complaints/update-priority/:id` - Update priority level (Low/Med/High)
- `GET /api/complaints/settings/overdue` - Get overdue threshold days
- `POST /api/complaints/settings/overdue` - Update overdue threshold days

### Notice Board (`/api/notices`)
- `POST /api/notices/create` - Post notice (broadcasts email if marked important)
- `GET /api/notices/list` - Get all pinned notices

---

## 📝 Developer Notes
I spent a lot of time testing the mobile responsiveness, fixing database latency, and ensuring that every single status update sends real email alerts to the residents. Feedback is always welcome!
