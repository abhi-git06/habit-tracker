const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      'SELECT * FROM insights WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    await db.query(
      'UPDATE insights SET seen = true WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;