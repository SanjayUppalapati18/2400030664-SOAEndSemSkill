const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.PORT || 3000);
const dbConfig = {
  host: process.env.DB_HOST || 'app.db',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'appdb',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root'
};
const pool = mysql.createPool(dbConfig);

async function waitForDatabase() {
  const maxAttempts = 12;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      console.log('Database connected.');
      return;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
      if (attempt === maxAttempts) {
        console.error('Database was not ready after all retry attempts.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

app.get('/', (req, res) => {
  res.send('Application Deployed Successfully!');
});

app.get('/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS result');
    res.json(rows);
  } catch (error) {
    console.error(`Database query failed: ${error.message}`);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  waitForDatabase();
});
