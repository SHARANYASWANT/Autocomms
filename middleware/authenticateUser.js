import pool from '../config/db.js';

export async function validateSessionMiddleware(req, res, next) {
  try {
    const sessionID = req.cookies.sessionID;

    if (!sessionID) {
      return res.status(401).json({ error: 'Invalid session ID' });
    }

    const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionID]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session ID' });
    }

    const session = result.rows[0];
    if (new Date() > new Date(session.expires_at)) {
      // await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionID]);
      return res.status(401).json({ error: 'Invalid session ID' });
    }

    if (session.session_id !== sessionID) {
      return res.status(401).json({ error: 'Invalid session ID' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Session validation failed' });
  }
}

export async function validateCsrfMiddleware(req, res, next) {
  try {
    const csrfToken = req.cookies.csrfToken;

    if (!csrfToken) {
      return res.status(401).json({ error: 'Invalid CSRF token' });
    }

    const result = await pool.query('SELECT * FROM sessions WHERE csrf_token = $1', [csrfToken]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid CSRF token' });
    }

    const csrf = result.rows[0];
    if (csrf.csrf_token !== csrfToken) {
      return res.status(401).json({ error:'Invalid CSRF token' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'CSRF token validation failed' });
  }
}

