const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(`
      SELECT
        COUNT(DISTINCT h.id) AS total_habits,
        COUNT(CASE WHEN hl.status = 'done' THEN 1 END) AS total_completions,
        ROUND(
          COUNT(CASE WHEN hl.status = 'done' THEN 1 END) * 100.0 /
          NULLIF(COUNT(hl.id), 0), 1
        ) AS overall_completion_rate,
        MAX(h.streak) AS best_current_streak
      FROM habits h
      LEFT JOIN habit_logs hl ON hl.habit_id = h.id
      WHERE h.user_id = $1 AND h.archived = false
    `, [userId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/habits/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const main = await db.query(`
      SELECT
        h.streak AS current_streak,
        COUNT(CASE WHEN hl.status = 'done' THEN 1 END) AS total_done,
        ROUND(
          COUNT(CASE WHEN hl.status = 'done' THEN 1 END) * 100.0 /
          NULLIF(COUNT(hl.id), 0), 1
        ) AS completion_rate
      FROM habits h
      LEFT JOIN habit_logs hl ON hl.habit_id = h.id
      WHERE h.id = $1
      GROUP BY h.streak
    `, [id]);

    const bestWeek = await db.query(`
      SELECT
        DATE_TRUNC('week', date) AS week_start,
        COUNT(*) AS completions
      FROM habit_logs
      WHERE habit_id = $1 AND status = 'done'
      GROUP BY week_start
      ORDER BY completions DESC
      LIMIT 1
    `, [id]);

    res.json({
      ...main.rows[0],
      best_week: bestWeek.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;