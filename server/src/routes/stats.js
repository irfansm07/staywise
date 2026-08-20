const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Helper to get overdue threshold in days
async function getOverdueThreshold() {
  const setting = await prisma.setting.findUnique({
    where: { key: 'overdue_threshold_days' }
  });
  return parseInt(setting?.value || '5', 10);
}

// GET /api/stats/dashboard (Admin Only)
router.get('/dashboard', authenticateJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const thresholdDays = await getOverdueThreshold();
    const overdueThresholdDate = new Date();
    overdueThresholdDate.setDate(overdueThresholdDate.getDate() - thresholdDays);

    // 1-4. Run all statistical DB queries concurrently in 1 parallel trip!
    const [statusGroups, categoryGroups, overdueCount, totalCount] = await Promise.all([
      prisma.complaint.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      prisma.complaint.count({
        where: {
          status: { not: 'RESOLVED' },
          createdAt: { lt: overdueThresholdDate }
        }
      }),
      prisma.complaint.count()
    ]);

    // Zero-pad expected statuses
    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0
    };
    statusGroups.forEach(group => {
      statusCounts[group.status] = group._count.id;
    });

    // Zero-pad standard categories
    const standardCategories = ['Plumbing', 'Electrical', 'Security', 'Cleanliness', 'Other'];
    const categoryCounts = {};
    standardCategories.forEach(cat => {
      categoryCounts[cat] = 0;
    });
    
    categoryGroups.forEach(group => {
      categoryCounts[group.category] = group._count.id;
    });

    res.json({
      totalComplaints: totalCount,
      byStatus: statusCounts,
      byCategory: categoryCounts,
      overdueCount,
      overdueThresholdDays: thresholdDays
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to compute dashboard statistics' });
  }
});

module.exports = router;
