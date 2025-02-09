// routes/classRoutes.js
import { Router } from "express";
const router = Router();
import multer from "multer";
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage });

import { getClassesForUser, createClass, addGoogleForm, getClassWithForms } from "../controllers/classController.js";
// import authenticateUser from "../middleware/authenticateUser.js";

// Get all classes for the authenticated User
router.get("/my-classes",  getClassesForUser);

// Ensure that upload.single('file') is used so that:
// - The file field with key "file" is processed and available as req.file
// - All other form-data fields are parsed and available in req.body
router.post("/", upload.single("file"), createClass);

// Add a Google Form to a specific class
router.post("/:classId/forms", addGoogleForm);

// Get a class (with its associated Google Forms)
router.get("/:classId", getClassWithForms);

export default router;
