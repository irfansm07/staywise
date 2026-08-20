const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../config/mail');

// POST /api/notices/create (Admin Only)
router.post('/create', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  const { title, content, isImportant } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isImportant: !!isImportant
      }
    });

    // If marked important, send email notifications to all residents
    if (notice.isImportant) {
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { email: true, name: true }
      });

      if (residents.length > 0) {
        residents.forEach(resUser => {
          const emailSubject = `⚠️ IMPORTANT SOCIETY NOTICE: ${title}`;
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #fee2e2; border-radius: 8px; background-color: #fff;">
              <h2 style="color: #dc2626; margin-bottom: 20px; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">⚠️ Urgent Society Announcement</h2>
              <p>Hello <strong>${resUser.name}</strong>,</p>
              <p>An important notice has been posted on the Apartment Society notice board:</p>
              <div style="background-color: #fff5f5; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 12px 0; color: #b91c1c; font-size: 18px;">${title}</h3>
                <p style="margin: 0; color: #475569; line-height: 1.6; font-size: 14px;">${content}</p>
              </div>
              <p>Please take the necessary actions or precautions as detailed above.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">Apartment Society Management Portal • Notice Board Broadcast</p>
            </div>
          `;
          
          sendEmail({
            to: resUser.email,
            subject: emailSubject,
            html: emailHtml
          }).catch(err => console.error(`Failed to send broadcast email to ${resUser.email}:`, err));
        });
      }
    }

    res.status(201).json(notice);
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ error: 'Failed to post notice' });
  }
});

// GET /api/notices/list (All Authenticated Users)
router.get('/list', authenticateJWT, async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ error: 'Failed to retrieve notices' });
  }
});

module.exports = router;
