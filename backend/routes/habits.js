const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT h.id, h.name, h.icon, h.color, h.category,
        COALESCE(hl.status, 'pending') AS status
      FROM habits h
      LEFT JOIN habit_logs hl 
        ON hl.habit_id = h.id AND hl.date = $2
      WHERE h.user_id = $1 AND h.archived = false
    `, [userId, today]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;