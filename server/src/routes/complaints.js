const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const upload = require('../middleware/upload');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../config/mail');

// Helper to get overdue threshold in days
async function getOverdueThreshold() {
  const setting = await prisma.setting.findUnique({
    where: { key: 'overdue_threshold_days' }
  });
  return parseInt(setting?.value || '5', 10);
}

// ----------------------------------------------------
// RESIDENT ENDPOINTS
// ----------------------------------------------------

// POST /api/complaints/create (Resident Only)
router.post('/create', authenticateJWT, requireRole('RESIDENT'), upload.single('photo'), async (req, res) => {
  const { title, category, description } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, category, and description are required' });
  }

  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const complaint = await prisma.complaint.create({
      data: {
        title,
        category,
        description,
        photoUrl,
        residentId: req.user.id,
        status: 'OPEN',
        priority: 'MEDIUM',
        history: {
          create: {
            status: 'OPEN',
            note: 'Complaint raised by resident.',
            actorName: req.user.name
          }
        }
      },
      include: {
        history: true
      }
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// GET /api/complaints/resident/list (Resident Only)
router.get('/resident/list', authenticateJWT, requireRole('RESIDENT'), async (req, res) => {
  try {
    const thresholdDays = await getOverdueThreshold();
    const overdueThresholdDate = new Date();
    overdueThresholdDate.setDate(overdueThresholdDate.getDate() - thresholdDays);

    const complaints = await prisma.complaint.findMany({
      where: { residentId: req.user.id },
      include: {
        history: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute isOverdue on the fly
    const complaintsWithOverdue = complaints.map(c => {
      const isOverdue = c.status !== 'RESOLVED' && new Date(c.createdAt) < overdueThresholdDate;
      return { ...c, isOverdue };
    });

    res.json(complaintsWithOverdue);
  } catch (error) {
    console.error('Fetch resident complaints error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaints' });
  }
});

// GET /api/complaints/public/list (Resident & Admin, Notice Board feed)
router.get('/public/list', authenticateJWT, async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            email: true,
            flatNumber: true,
            apartmentName: true,
            societyName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    console.error('Fetch public complaints error:', error);
    res.status(500).json({ error: 'Failed to retrieve public notice board complaints' });
  }
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// GET /api/complaints/admin/list (Admin Only, with filtering)
router.get('/admin/list', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  const { category, status, date, showOverdueOnly } = req.query;

  try {
    const thresholdDays = await getOverdueThreshold();
    const overdueThresholdDate = new Date();
    overdueThresholdDate.setDate(overdueThresholdDate.getDate() - thresholdDays);

    // Build filter
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (date) {
      // Filter for complaints created on or after specified date (YYYY-MM-DD)
      const filterDate = new Date(date);
      where.createdAt = {
        gte: filterDate
      };
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            email: true,
            societyName: true,
            apartmentName: true,
            flatNumber: true,
            phoneNumber: true,
            occupancyType: true,
          }
        },
        history: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map overdue flag and format
    let complaintsWithOverdue = complaints.map(c => {
      const isOverdue = c.status !== 'RESOLVED' && new Date(c.createdAt) < overdueThresholdDate;
      return { ...c, isOverdue };
    });

    // Filter by overdue only if requested
    if (showOverdueOnly === 'true') {
      complaintsWithOverdue = complaintsWithOverdue.filter(c => c.isOverdue);
    }

    // Sort: OVERDUE complaints surface at the top first, then sorted by createdAt descending
    complaintsWithOverdue.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(complaintsWithOverdue);
  } catch (error) {
    console.error('Fetch admin complaints error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaints' });
  }
});

// PATCH /api/complaints/update-status/:id (Admin Only)
router.patch('/update-status/:id', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { resident: true }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Resolved complaints are closed and cannot be updated.' });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        history: {
          create: {
            status,
            note: note || `Status changed to ${status}.`,
            actorName: req.user.name
          }
        }
      },
      include: {
        history: { orderBy: { createdAt: 'asc' } }
      }
    });

    // Send email alert to Resident
    if (complaint.resident && complaint.resident.email) {
      const emailSubject = `Update on your Complaint: "${complaint.title}"`;
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Complaint Status Update</h2>
          <p>Hello <strong>${complaint.resident.name}</strong>,</p>
          <p>The status of your complaint <strong>"${complaint.title}"</strong> has been updated.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>New Status:</strong> <span style="color: #4f46e5; font-weight: bold;">${status}</span></p>
            ${note ? `<p style="margin: 8px 0 0 0; color: #475569;"><strong>Admin Note:</strong> ${note}</p>` : ''}
          </div>
          <p>You can log in to the Society Portal to view the full resolution timeline.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Apartment Society Management Portal • Automated Notification</p>
        </div>
      `;
      // Async dispatch, don't await to avoid blocking response
      sendEmail({
        to: complaint.resident.email,
        subject: emailSubject,
        html: emailHtml
      }).catch(err => console.error('Email send error:', err));
    }

    res.json(updatedComplaint);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH /api/complaints/update-priority/:id (Admin Only)
router.patch('/update-priority/:id', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority) {
    return res.status(400).json({ error: 'Priority is required' });
  }

  const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH'];
  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority level. Use LOW, MEDIUM, or HIGH' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Cannot update priority of a resolved complaint' });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        priority,
        history: {
          create: {
            status: complaint.status,
            note: `Priority updated to ${priority}.`,
            actorName: req.user.name
          }
        }
      },
      include: {
        history: { orderBy: { createdAt: 'asc' } }
      }
    });

    res.json(updatedComplaint);
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// ----------------------------------------------------
// SETTINGS ENDPOINTS (Admin Only)
// ----------------------------------------------------

// GET /api/complaints/settings/overdue
router.get('/settings/overdue', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const thresholdDays = await getOverdueThreshold();
    res.json({ overdueThresholdDays: thresholdDays });
  } catch (error) {
    console.error('Get overdue setting error:', error);
    res.status(500).json({ error: 'Failed to fetch overdue threshold' });
  }
});

// POST /api/complaints/settings/overdue
router.post('/settings/overdue', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  const { days } = req.body;
  
  if (days === undefined || isNaN(parseInt(days, 10)) || parseInt(days, 10) < 0) {
    return res.status(400).json({ error: 'Provide a valid positive integer value for days.' });
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key: 'overdue_threshold_days' },
      update: { value: String(days) },
      create: { key: 'overdue_threshold_days', value: String(days) }
    });

    res.json({ message: 'Overdue threshold updated successfully', overdueThresholdDays: parseInt(setting.value, 10) });
  } catch (error) {
    console.error('Update overdue setting error:', error);
    res.status(500).json({ error: 'Failed to update overdue threshold' });
  }
});

module.exports = router;
