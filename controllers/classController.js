// controllers/classController.js
import pool from "../config/db.js";
import xlsx from "xlsx";
const { readFile, utils } = xlsx;


// Get all classes for the authenticated user
export async function getClassesForUser(req, res) {
  const userId = req.cookies.userId;
  try {
    const result = await pool.query("SELECT * FROM classes WHERE user_id = $1", [userId]);
    res.status(200).json({ classes: result.rows });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Server error while fetching classes" });
  }
}

export async function createClass(req, res) {
  const userId = req.cookies.userId;
  let { class_name, schedule } = req.body;
  class_name = "a";

  let newClass;
  try {
    // Create the class record for the user
    await pool.query("BEGIN");
    const result = await pool.query(
      "INSERT INTO classes (user_id, class_name, schedule) VALUES ($1, $2, $3) RETURNING *",
      [userId, class_name ,schedule]
    );
    newClass = result.rows[0];
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error creating class:", error);
    return res.status(500).json({ error: "Server error while creating class" });
  }

  // Check if a file was uploaded (optional Excel file for student emails)
  if (req.file) {
    const filePath = req.file.path;
    try {
        console.log("Uploaded file:", req.file);
    
        // Read the Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
    
        if (data.length === 0) {
            return res.status(400).json({ error: "Uploaded Excel file is empty" });
        }
        
      // Begin a transaction to handle multiple inserts
      await pool.query("BEGIN");

      // Process each row in the Excel file
      for (const row of data) {
        const email = row.email && row.email.trim();
        console.log("email",email);
        if (!email) continue; // Skip rows without an email
        // Insert the student if not already exists.
        // ON CONFLICT ensures duplicate emails are not created.
        const studentResult = await pool.query(
          `INSERT INTO students (email)
           VALUES ($1)
           ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
           RETURNING student_id`,
          [email]
        );
        const studentId = studentResult.rows[0].student_id;

        // Insert into the join table to enroll the student in the class.
        await pool.query(
          `INSERT INTO class_students (class_id, student_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [newClass.class_id, studentId]
        );
      }

      // Commit the transaction
      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error("Error uploading students:", err);
      return res.status(500).json({ error: "Error uploading students" });
    }

    // Return a combined response if file upload was processed
    return res.status(201).json({
      class: newClass,
      message: "Class created and students uploaded and enrolled successfully"
    });
  } else {
    console.log("no file recieved");
    // If no file is provided, just return the newly created class details
    return res.status(201).json({ class: newClass });
  }
}

// Add a Google Form to a specific class
export async function addGoogleForm(req, res) {
  const classId = req.params.classId;
  // Destructure the description along with form_title, form_link, and due_date
  const { form_title, description, form_link, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO google_forms (class_id, form_title, description, form_link, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [classId, form_title, description, form_link, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding Google Form:", error);
    res.status(500).json({ error: "Server error while adding Google Form" });
  }
}

// Get a class along with its associated Google Forms
export async function getClassWithForms(req, res) {
  const classId = req.params.classId;
  try {
    const classResult = await pool.query("SELECT * FROM classes WHERE class_id = $1", [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    const formsResult = await pool.query("SELECT * FROM google_forms WHERE class_id = $1", [classId]);
    res.status(200).json({
      class: classResult.rows[0],
      google_forms: formsResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving class data:", error);
    res.status(500).json({ error: "Server error while retrieving class data" });
  }
}