# Habit Tracker — Backend

Node.js + Express + PostgreSQL backend for the Habit Tracker app.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Cron:** node-cron

## Setup

1. Clone the repo
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create your `.env` file
   ```bash
   cp .env.example .env
   ```
   Then fill in your values in `.env`.

4. Set up the database — open pgAdmin, create a database called `habitdb`, open the Query Tool and run `schema.sql`.

5. Start the server
   ```bash
   node index.js
   ```
   Server runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Any long random string |

## API Endpoints

All routes except `/auth` require the header:
```
Authorization: Bearer <token>
```

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register with email + password, returns JWT |
| POST | `/auth/login` | Login, returns JWT |

### Habits
| Method | Route | Description |
|---|---|---|
| GET | `/habits/today` | Today's habits with completion status |

### Logs
| Method | Route | Description |
|---|---|---|
| POST | `/habits/:id/log` | Mark habit as `done` / `skipped` / `missed` |
| GET | `/habits/:id/logs?from=&to=` | Log history for heatmap |

### Stats
| Method | Route | Description |
|---|---|---|
| GET | `/stats/summary` | Overall dashboard numbers |
| GET | `/stats/habits/:id/stats` | Per-habit streak, completion rate, best week |

### Insights
| Method | Route | Description |
|---|---|---|
| GET | `/insights` | Insight cards generated nightly by cron |

## Project Structure

```
backend/
├── .env.example
├── .gitignore
├── schema.sql
├── db.js
├── index.js
├── package.json
├── cron/
│   └── insights.js
├── middleware/
│   └── auth.js
└── routes/
    ├── auth.js
    ├── habits.js
    ├── logs.js
    ├── stats.js
    └── insights.js
```

## Notes

- Insights cron runs automatically every night at midnight
- Streak is recalculated on every log entry
- `habit_logs` table has a unique constraint on `(habit_id, date)` so duplicate logs are upserted, not duplicated
