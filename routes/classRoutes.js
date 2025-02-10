// routes/classRoutes.js
import { Router } from "express";
const router = Router();
import multer from "multer";
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage });

import { getClassesForUser, createClass, addGoogleForm, getClassWithForms } from "../controllers/classController.js";
import {validateCsrfMiddleware, validateSessionMiddleware} from "../middleware/authenticateUser.js";

// Get all classes for the authenticated User
router.get("/my-classes",validateCsrfMiddleware, validateSessionMiddleware,  getClassesForUser);

// Ensure that upload.single('file') is used so that:
// - The file field with key "file" is processed and available as req.file
// - All other form-data fields are parsed and available in req.body
router.post("/",validateCsrfMiddleware, validateSessionMiddleware, upload.single("file"), createClass);

// Add a Google Form to a specific class
router.post("/:classId/forms",validateCsrfMiddleware, validateSessionMiddleware, addGoogleForm);

// Get a class (with its associated Google Forms)
router.get("/:classId",validateCsrfMiddleware, validateSessionMiddleware, getClassWithForms);

export default router;
