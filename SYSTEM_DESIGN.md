# StayWise - System Architecture & Technical Design

Here is a breakdown of how I designed and implemented the key parts of **StayWise**, including the complaint history tracking, overdue calculation, photo upload pipeline, and notification triggers.

---

## 1. Complaint History & Audit Tracking

To make sure residents and admins have complete transparency, complaints don't just overwrite their current status. Instead, I designed the system so every single status change creates an entry in a relational `History` table.

### How the Workflow Works:
1. When a resident files a complaint, it gets created with status `OPEN` and an initial history log entry (`actorName` set to resident's name).
2. When an admin changes the status from `OPEN` to `IN_PROGRESS` or `RESOLVED`, the system:
   - Updates `Complaint.status`.
   - Inserts a new row into `History` with `status`, `actorName` (admin's name), `note` (e.g. "Technician assigned"), and timestamp `createdAt`.
3. Once a complaint status is updated to `RESOLVED`, the complaint is closed. The resident can expand their complaint item on the UI to see the complete timeline from creation to resolution.

---

## 2. Dynamic Overdue Detection

Rather than relying on cron jobs to periodically update database flags (which can become stale), I implemented an on-the-fly calculation for overdue complaints.

### Overdue Calculation Logic:
- The system stores an `overdue_threshold_days` setting in the database (admin can change this, e.g., set to 5 days).
- When complaints are requested by the admin dashboard, the server calculates:
  $$\text{Cutoff Date} = \text{Current Date} - \text{Overdue Threshold Days}$$
  $$\text{isOverdue} = (\text{status} \neq \text{'RESOLVED'}) \text{ AND } (\text{createdAt} < \text{Cutoff Date})$$
- Complaints that meet this condition get flagged as `isOverdue: true`.
- In the Admin Dashboard, overdue tickets get a red badge and are moved to the top of the processing queue so urgent issues get resolved quickly.

---

## 3. Photo Upload Pipeline

Residents can upload evidence photos when submitting a complaint. Here is how I set up the upload flow:

### Frontend & Backend Flow:
1. **Client Preview**: When the resident picks an image file in the React form, I use `URL.createObjectURL(file)` to show an instant image preview before uploading.
2. **Multipart Request**: The form data is sent as `multipart/form-data` to `/api/complaints/create`.
3. **Storage & Serving**: On the server, `multer` middleware receives the file, checks the file type, renames it with a timestamp prefix (to avoid duplicate file name overwrites), and saves it inside `server/uploads/`.
4. The database stores the path `/uploads/filename.jpg` in `Complaint.photoUrl`, which Express serves statically via `express.static('uploads')`.

---

## 4. Email Notification Flow & Latency Fixes

Email notifications are critical so residents don't have to constantly refresh the app to check for updates.

### When Emails Get Triggered:
- **Account Verification**: A 6-digit OTP email is sent when a user signs up.
- **Complaint Created**: The resident gets a confirmation email with their ticket details, and admins receive a new ticket notification.
- **Status Change**: When admin updates a ticket to `IN_PROGRESS` or `RESOLVED`, an automated email is sent to the resident's registered email address with the admin note.
- **Priority Escalation**: When admin escalates a ticket priority to `HIGH`, the resident gets an email notification.
- **Important Announcements**: When admin posts a notice marked as "Important", an email broadcast is dispatched to all residents.

### Latency Optimization:
During testing, I noticed API requests were taking ~400ms because `authenticateJWT` was querying the database on every single API request to fetch user info. To fix this:
- I included the user profile claims directly inside the signed JWT token.
- `authenticateJWT` now verifies the token in memory (**0ms database delay**).
- For dashboard statistics and Notice Board queries, I wrapped database calls in `Promise.all()` to run queries concurrently instead of sequentially, dropping load times significantly.
