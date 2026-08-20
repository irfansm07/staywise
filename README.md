# 🏠 StayWise - Smart Apartment & Society Management System

[![Build Status](https://img.shields.io/badge/Vercel-Deployed-brightgreen)](https://github.com/irfansm07/staywise)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.2-blue)](https://reactjs.org/)

StayWise is a modern, high-performance web application designed for residential societies and apartment complexes. It provides a complete end-to-end platform for residents to file and track maintenance complaints with photos, and for society administrators to manage ticket workflows, track overdue issues, post announcements on a Notice Board, and broadcast automated email updates.

---

## 🌐 Hosted Application & Live URL

- **GitHub Repository**: [https://github.com/irfansm07/staywise](https://github.com/irfansm07/staywise)
- **Hosted Application (Vercel)**: Deployed on Vercel (`main` branch automated CI/CD pipeline).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, CSS Design System (Glassmorphism & Neumorphism), Lucide Icons
- **Backend**: Node.js, Express.js REST API
- **Database**: PostgreSQL (Supabase Cloud), Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with in-memory claims verification & Bcrypt password hashing
- **Email Dispatch**: Nodemailer with Direct Gmail SMTP & OTP Verification
- **FileUpload**: Multer disk storage for complaint image evidence

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL Database URL (or Supabase PostgreSQL connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/irfansm07/staywise.git
cd staywise
```

### 2. Backend Setup
```bash
cd server
npm install

# Copy environment variables template
cp .env.example .env

# Run Prisma Database Migrations
npx prisma db push

# Start Backend Server
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start Vite Development Server
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

---

## 🔑 Environment Variables (`.env.example`)

```env
# Server Port
PORT=5000

# PostgreSQL Connection Strings (Supabase / Local)
DATABASE_URL="postgresql://postgres.user:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?connection_limit=5"
DIRECT_URL="postgresql://postgres.user:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# JWT Secret Key
JWT_SECRET="your_secure_jwt_secret_key"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your_society_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="StayWise Portal <your_society_email@gmail.com>"
```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

```prisma
model User {
  id              String      @id @default(uuid())
  email           String      @unique
  password        String
  name            String
  role            Role        @default(RESIDENT)
  societyName     String?
  apartmentName   String?
  flatNumber      String?
  phoneNumber     String?
  occupancyType   Occupancy   @default(OWNER)
  isVerified      Boolean     @default(false)
  verificationOTP String?
  otpExpiresAt    DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  complaints      Complaint[]
}

model Complaint {
  id          String         @id @default(uuid())
  title       String
  category    String
  description String
  photoUrl    String?
  priority    Priority       @default(MEDIUM)
  status      Status         @default(OPEN)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  residentId  String
  resident    User           @relation(fields: [residentId], references: [id])
  history     History[]
}

model History {
  id          String    @id @default(uuid())
  status      Status
  note        String?
  actorName   String
  createdAt   DateTime  @default(now())
  complaintId String
  complaint   Complaint @relation(fields: [complaintId], references: [id])
}

model Notice {
  id          String   @id @default(uuid())
  title       String
  content     String
  isImportant Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}

enum Role {
  RESIDENT
  ADMIN
}

enum Occupancy {
  OWNER
  TENANT
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Status {
  OPEN
  IN_PROGRESS
  RESOLVED
}
```

---

## 📑 API Endpoint Documentation

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Register a new resident/admin account and send email OTP code.
- `POST /api/auth/verify-otp` - Verify 6-digit email OTP code and issue JWT session token.
- `POST /api/auth/login` - Authenticate user credentials and return JWT token.
- `GET /api/auth/me` - Fetch authenticated user profile details.

### Complaint Routes (`/api/complaints`)
- `POST /api/complaints/create` - File a new maintenance complaint with photo attachment (Resident).
- `GET /api/complaints/resident/list` - Fetch all complaints filed by logged-in resident with full status history.
- `GET /api/complaints/admin/list` - Fetch all complaints with category, status, date, and overdue filtering (Admin).
- `GET /api/complaints/public/list` - Fetch complaint feed for public Notice Board.
- `PATCH /api/complaints/update-status/:id` - Update status (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), record history timestamp/note, and send email update to resident.
- `PATCH /api/complaints/update-priority/:id` - Set complaint priority (`LOW`, `MEDIUM`, `HIGH`) and notify resident via email.
- `GET /api/complaints/settings/overdue` - Get configured overdue threshold days.
- `POST /api/complaints/settings/overdue` - Update overdue threshold days in database settings.

### Notice Board Routes (`/api/notices`)
- `POST /api/notices/create` - Post notice; if marked important, broadcasts email to all residents (Admin).
- `GET /api/notices/list` - Retrieve all announcements ordered by important flag and creation date.

### Statistics Routes (`/api/stats`)
- `GET /api/stats/dashboard` - Get parallelized analytics (total count, by status, by category, overdue count).

---

## 📜 License
MIT License. Created for StayWise Society Management.
