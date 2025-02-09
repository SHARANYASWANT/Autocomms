// middleware/authenticateTeacher.js
import { verify } from "jsonwebtoken";

const authenticateTeacher = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided, authorization denied" });
  }
  
  const token = authHeader.split(" ")[1]; // Expected format: "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    // Attach the teacher's ID from the token to the request object
    req.user = { teacher_id: decoded.teacher_id };
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

export default authenticateTeacher;
