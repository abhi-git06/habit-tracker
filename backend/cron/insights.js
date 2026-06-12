const db = require('../db');
const cron = require('node-cron');

async function generateInsights(userId) {
  const insights = [];

  const habits = await db.query(
    'SELECT * FROM habits WHERE user_id = $1 AND archived = false',
    [userId]
  );

  for (const habit of habits.rows) {
    const id = habit.id;

    // 1. Monday slip — does user skip on Mondays?
    const mondaySlip = await db.query(`
      SELECT COUNT(*) AS misses
      FROM habit_logs
      WHERE habit_id = $1
        AND EXTRACT(DOW FROM date) = 1
        AND status IN ('skipped', 'missed')
    `, [id]);

    if (parseInt(mondaySlip.rows[0].misses) >= 3) {
      insights.push({
        userId,
        message: `You tend to skip "${habit.name}" on Mondays. Try setting a Monday reminder!`,
        type: 'monday_slip'
      });
    }

    // 2. Streak risk — done yesterday but not today
    const streakRisk = await db.query(`
      SELECT status FROM habit_logs
      WHERE habit_id = $1 AND date = CURRENT_DATE - 1
    `, [id]);

    const todayLog = await db.query(`
      SELECT status FROM habit_logs
      WHERE habit_id = $1 AND date = CURRENT_DATE
    `, [id]);

    if (
      streakRisk.rows[0]?.status === 'done' &&
      !todayLog.rows.length
    ) {
      insights.push({
        userId,
        message: `Your streak for "${habit.name}" is at risk — you haven't logged it today!`,
        type: 'streak_risk'
      });
    }

    // 3. Best day — which day of week has most completions
    const bestDay = await db.query(`
      SELECT TO_CHAR(date, 'Day') AS day, COUNT(*) AS count
      FROM habit_logs
      WHERE habit_id = $1 AND status = 'done'
      GROUP BY day
      ORDER BY count DESC
      LIMIT 1
    `, [id]);

    if (bestDay.rows.length) {
      insights.push({
        userId,
        message: `You complete "${habit.name}" most on ${bestDay.rows[0].day.trim()}s. Keep it up!`,
        type: 'best_day'
      });
    }

    // 4. Low completion rate warning
    const rate = await db.query(`
      SELECT
        ROUND(COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS rate
      FROM habit_logs
      WHERE habit_id = $1
    `, [id]);

    if (parseFloat(rate.rows[0]?.rate) < 40) {
      insights.push({
        userId,
        message: `"${habit.name}" has a low completion rate. Consider making it easier or adjusting frequency.`,
        type: 'low_rate'
      });
    }
  }

  // Save all insights to DB
  for (const insight of insights) {
    await db.query(
      'INSERT INTO insights (user_id, message, type) VALUES ($1, $2, $3)',
      [insight.userId, insight.message, insight.type]
    );
  }
}

// Runs every night at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running insights cron...');
    const users = await db.query('SELECT id FROM users');
    for (const user of users.rows) {
      await generateInsights(user.id);
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

// Export so you can also trigger on-demand
module.exports = { generateInsights };