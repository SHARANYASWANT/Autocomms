import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import  pool  from '../config/db.js';

function generateRandomToken() {
  return randomBytes(16).toString('hex');
}

function getExpirationTime() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

async function storeSession(sessionID, userID, csrfToken, expiresAt) {
  await pool.query(
    'INSERT INTO sessions (session_id, user_id, csrf_token, expires_at) VALUES ($1, $2, $3, $4)',
    [sessionID, userID, csrfToken, expiresAt]
  );
}

async function validateSession(sessionID) {
  const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionID]);
  if (result.rows.length === 0) {
    return false;
  }

  const session = result.rows[0];
  if (new Date() > new Date(session.expires_at)) {
    // await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionID]);
    return false;
  }

  if(session.session_id !== sessionID){
    return false;
  }
  return true;
}

async function validateCSRF(csrf_token) {
  const result = await pool.query('SELECT * FROM sessions WHERE csrf_token = $1', [csrf_token]);
  if (result.rows.length === 0) {
    return false;
  }

  const csrf = result.rows[0];
  if(csrf.csrf_token !== csrf_token){
    return false;
  }
  return true;
}

async function deleteSession(sessionID) {
  await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionID]);
}

const AuthController = {
    signup: async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const result = await pool.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id',
          [name, email, hashedPassword]
        );
  
        res.status(201).json({ message: 'Signup successful', user_id: result.rows[0].user_id });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signup failed' });
      }
    },
  
    signin: async (req, res) => {
      try {
        const { email, password } = req.body;
  
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const cookie = req.cookies;
        if(Object.keys(cookie).length > 0){
            const result = await validateSession(req.cookies.sessionID);
            const resultCSRF = await validateCSRF(req.cookies.csrfToken);
            if (result === true && resultCSRF === true){
                return res.status(200).json({message: "User already logged in"});
            }
            return res.status(401).json({message: "Invalid Session"});
        }
  
        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid password' });
        }
  
        const sessionID = generateRandomToken();
        const csrfToken = generateRandomToken();
        const expiresAt = getExpirationTime();
  
        await storeSession(sessionID, user.user_id, csrfToken, expiresAt);
  
        res.cookie('sessionID', sessionID, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000}); 
        res.cookie('csrfToken', csrfToken, { maxAge: 30 * 60 * 1000 });
        res.cookie("userId", user.user_id);
  
        res.status(200).json({ message: 'Signin successful' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signin failed' });
      }
    },
  
    signout: async (req, res) => {
      try {
        const sessionID = req.cookies.sessionID;
        if (sessionID) {
          await deleteSession(sessionID);
          res.clearCookie('sessionID');
          res.clearCookie('csrfToken');
          res.clearCookie('userId');
        }
        res.status(200).json({ message: 'Signout successful' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signout failed' });
      }
    },
  };

export default AuthController;
  
