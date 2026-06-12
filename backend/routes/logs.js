const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.post('/:id/log', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    await db.query(`
      INSERT INTO habit_logs (habit_id, date, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (habit_id, date) DO UPDATE SET status = $3
    `, [id, logDate, status]);

    const streak = await calcStreak(id);
    await db.query('UPDATE habits SET streak = $1 WHERE id = $2', [streak, id]);

    res.json({ success: true, streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/logs', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const result = await db.query(`
      SELECT date, status FROM habit_logs
      WHERE habit_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date ASC
    `, [id, from, to]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function calcStreak(habitId) {
  const result = await db.query(`
    SELECT date FROM habit_logs
    WHERE habit_id = $1 AND status = 'done'
    ORDER BY date DESC
  `, [habitId]);

  const dates = result.rows.map(r => r.date);
  if (!dates.length) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const d of dates) {
    const logDate = new Date(d);
    const diff = (current - logDate) / (1000 * 60 * 60 * 24);
    if (diff > 1) break;
    streak++;
    current = logDate;
  }

  return streak;
}

module.exports = router;