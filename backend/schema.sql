CREATE DATABASE habitdb;

\c habitdb

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  frequency VARCHAR(20) DEFAULT 'daily',
  category VARCHAR(100),
  streak INT DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INT REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) CHECK (status IN ('done', 'skipped', 'missed')),
  CONSTRAINT unique_habit_date UNIQUE (habit_id, date)
);

CREATE TABLE insights (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  seen BOOLEAN DEFAULT false
);