const express = require("express");
const { Pool, Client } = require("pg"); // PostgreSQL
const cors = require("cors");
const fetch = require("node-fetch"); // For inviting candidates (API request)
const axios = require("axios"); // For fetching test results
const path = require("path"); // For static file handlingtime
const cron = require("node-cron");
// const { format } = require('date-fns-tz');api/candidates

const xlsx = require("xlsx");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// CORS configuration
const corsOptions = {
  //origin: 'http://localhost:3000', // Your Vercel frontend domain
  methods: "GET, POST, PUT, OPTIONS", // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
  credentials: true, // Enable cookies/sessions if needed
};

app.use(cors(corsOptions)); // Apply CORS middleware

// Middleware
app.use(express.json());

// PostgreSQL connection string
const connectionString =
  "postgresql://retool:4zBLlh1TPsAu@ep-frosty-pine-a6aqfk20.us-west-2.retooldb.com/retool?sslmode=require";

// Create a new pool instance
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for cloud-hosted PostgreSQL
  },

});

// iMocha API credentials
const IMOCHA_API_KEY = "JHuaeAvDQsGfJxlHYpeJwFOxySVrdm"; // Your iMocha API key
const IMOCHA_BASE_URL = "https://apiv3.imocha.io/v3";

// --- Routes ---
// Add this route to your existing code in nodecode.js
app.get("/api/github-token", (req, res) => {
  const githubToken = process.env.GITHUB_TOKEN; // Access the GitHub token from environment variables
  res.json({ token: githubToken });
});
//login
app.post("/api/check-admin", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await pool.query(
      "SELECT ec_mapping, status FROM admin_table WHERE email ILIKE $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not available" });
    }

    const { ec_mapping, status } = result.rows[0];

    if (status !== "Enable") {
      return res
        .status(403)
        .json({ error: "Account is disabled. Please contact admin." });
    }

    res.json({ ec_mapping });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/invite-candidate", async (req, res) => {
  const {
    inviteId,
    email,
    name,
    sendEmail,
    callbackURL,
    redirectURL,
    disableMandatoryFields,
    hideInstruction,
  } = req.body;

  // Validate the inviteId
  if (!inviteId) {
    return res.status(400).json({ error: "Missing inviteId in the request." });
  }

  const targetUrl = `https://apiv3.imocha.io/v3/tests/${inviteId}/invite`; // Use the inviteId dynamically

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": IMOCHA_API_KEY,
      },
      body: JSON.stringify({
        email,
        name,
        sendEmail,
        callbackURL,
        redirectURL,
        disableMandatoryFields,
        hideInstruction,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error response from iMocha:", errorData);
      return res
        .status(response.status)
        .json({ error: "Failed to send invite to iMocha" });
    }

    const data = await response.json();
    res.json(data); // Send back the iMocha API response to the frontend
  } catch (error) {
    console.error("Error inviting candidate:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the invite" });
  }
});

app.post("/api/rrf-update", async (req, res) => {
  const { rrf_id, role, eng_center, rrf_status } = req.body;

  if (!rrf_id || !role || !eng_center || !rrf_status) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if the record exists
    const result = await pool.query(
      "SELECT * FROM rrf_details WHERE rrf_id = $1",
      [rrf_id]
    );

    if (result.rows.length === 0) {
      // Insert new record if not exists
      await pool.query(
        `
        INSERT INTO rrf_details (rrf_id, role, eng_center, resume_count, rrf_status, rrf_startdate)
        VALUES ($1, $2, $3, 1, $4, CURRENT_TIMESTAMP)
      `,
        [rrf_id, role, eng_center, rrf_status]
      );

      return res.status(200).json({ message: "RRF submitted successfully!" });
    } else {
      // Update the existing record and increment resume_count
      await pool.query(
        `
        UPDATE rrf_details
        SET resume_count = resume_count + 1, rrf_status = $1 
        WHERE rrf_id = $2
      `,
        [rrf_status, rrf_id]
      );

      return res.status(200).json({ message: "RRF updated successfully!" });
    }
  } catch (error) {
    console.error("Error processing RRF submission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/update-candidate-recruitment-phase", async (req, res) => {
  const { id, recruitment_phase } = req.body;

  try {
    const query = `
          UPDATE candidate_info
          SET recruitment_phase = $1
          WHERE id = $2
          RETURNING *;
      `;
    const values = [recruitment_phase, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Recruitment phase updated",
        data: result.rows[0],
      });
  } catch (error) {
    console.error("Error updating recruitment phase:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating recruitment phase" });
  }
});

app.get("/api/rrf-details", async (req, res) => {
  try {
    // Query to fetch aggregated resume counts grouped by eng_center where visible is TRUE
    const result = await pool.query(`
      SELECT eng_center, SUM(resume_count) AS resume_count
      FROM rrf_details
      WHERE visible = TRUE
      GROUP BY eng_center;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No RRF details found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching RRF details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//final feedback form prescreening details fetch
app.get('/api/final-prescreening', async (req, res) => {
  try {
    const { candidateEmail, candidateId, position } = req.query;

    if (!candidateEmail || !candidateId || !position) {
      return res.status(400).json({ message: 'Email, ID and position are required' });
    }

    console.log(`Fetching prescreening details for: ${candidateEmail}`);

    const prescreeningData = {};

    // Get status and hr_email from candidate_info
    const candidateInfoResult = await pool.query(`
      SELECT prescreening_status, hr_email
      FROM candidate_info
      WHERE candidate_email = $1
    `, [candidateEmail]);

    if (candidateInfoResult.rows.length > 0) {
      const { prescreening_status, hr_email } = candidateInfoResult.rows[0];
      prescreeningData.prescreening_status = prescreening_status;
      prescreeningData.hr_email = hr_email;
    }

// Fetch feedback based on position
let techFeedbackQuery = '';
if (position && position.toLowerCase().includes('java')) {
  console.log("Position:", position);
  console.log("Candidate ID:", candidateId);
  techFeedbackQuery = `
    SELECT detailed_feedback 
    FROM app_ec_java_feedback_response 
    WHERE candidate_id = $1
  `;
} else if (position && position.toLowerCase().includes('.net')) {
  console.log("Position:", position);
  console.log("Candidate ID:", candidateId);
  techFeedbackQuery = `
    SELECT detailed_feedback 
    FROM app_ec_dotnet_feedback_response 
    WHERE candidate_id = $1
  `;
} else {
  console.log("Position does not match any known categories.");
}

if (techFeedbackQuery) {
  try {
    console.log("Executing Query:", techFeedbackQuery, "with Candidate ID:", candidateId);
    const techFeedbackResult = await pool.query(techFeedbackQuery, [candidateId]);
    console.log("Query Result:", techFeedbackResult.rows); // Log the query result

    if (techFeedbackResult.rows.length > 0) {
      prescreeningData.feedback = techFeedbackResult.rows[0].detailed_feedback;
      console.log("Detailed Feedback Found:", prescreeningData.feedback);
    } else {
      console.log("No feedback found for the given candidate ID.");
    }
  } catch (error) {
    console.error("Error executing tech feedback query:", error);
  }
}

    // Fetch Fitment feedback
    const feedbackResult = await pool.query(`
      SELECT result, detailed_feedback, round_details, interviewer_name
      FROM feedbackform
      WHERE candidate_email = $1
    `, [candidateEmail]);

    // Fetch L2 Technical round
    let l2TechnicalResult = { rows: [] };
    if (position.toLowerCase().includes("java")) {
      l2TechnicalResult = await pool.query(`
        SELECT result, overall_feedback, interviewer_name
        FROM app_java_l2_feedback_response
        WHERE candidate_id = $1
      `, [candidateId]);
    } else if (position.toLowerCase().includes(".net")) {
      l2TechnicalResult = await pool.query(`
        SELECT result, overall_feedback, interviewer_name
        FROM app_dotnet_l2_feedback_response
        WHERE candidate_id = $1
      `, [candidateId]);
    } else {
      // Default: Cloud or other roles
      l2TechnicalResult = await pool.query(`
        SELECT result, detailed_feedback, interviewer_name
        FROM feedback_table
        WHERE candidate_email = $1
      `, [candidateEmail]);
    }

    if (
      Object.keys(prescreeningData).length === 0 &&
      !feedbackResult.rows.length &&
      !l2TechnicalResult.rows.length
    ) {
      return res.status(404).json({ message: 'No data found for this email' });
    }

    const response = {
      prescreening: prescreeningData,
      feedback: feedbackResult.rows || [],
      l2Technical: l2TechnicalResult.rows[0] || {}
    };
    console.log("API Response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//candidate-info table
app.post("/api/add-candidate-info", async (req, res) => {
  const {
    candidate_name,
    candidate_email,
    prescreening_status,
    role,
    recruitment_phase,
    resume_score,
    resume,
    candidate_phone,
    hr_email,
    rrf_id,
    eng_center,
  } = req.body;

  try {
    const query = `
            INSERT INTO candidate_info (candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id,eng_center)
            VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *;
        `;
    const values = [
      candidate_name,
      candidate_email,
      prescreening_status,
      role,
      recruitment_phase,
      resume_score,
      resume,
      candidate_phone,
      hr_email,
      rrf_id,
      eng_center,
    ];

    const result = await pool.query(query, values);

    res
      .status(200)
      .json({
        success: true,
        message: "Candidate info saved",
        data: result.rows[0],
      });
  } catch (error) {
    console.error("Error saving candidate information:", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving candidate info" });
  }
});
//prescreening-candiadte
app.post("/api/add-prescreening-info", async (req, res) => {
  const {
    candidate_name,
    candidate_email,
    prescreening_status,
    role,
    recruitment_phase,
    resume_score,
    resume,
    candidate_phone,
    hr_email,
    rrf_id,
  } = req.body;

  try {
    const query = `
          INSERT INTO candidate_prescreening (candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id)
          VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10)
          RETURNING *;
      `;
    const values = [
      candidate_name,
      candidate_email,
      prescreening_status,
      role,
      recruitment_phase,
      resume_score,
      resume,
      candidate_phone,
      hr_email,
      rrf_id,
    ];

    const result = await pool.query(query, values);

    res
      .status(200)
      .json({
        success: true,
        message: "Candidate info saved",
        data: result.rows[0],
      });
  } catch (error) {
    console.error("Error saving candidate information:", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving candidate info" });
  }
});

//get Prescreening results in excel
// app.get('/download-candidate-info', async (req, res) => {
//     try {
//         // Query specific columns from the candidate_info table
//         const result = await pool.query(
//             'SELECT candidate_name, candidate_email, prescreening_status, role, resume_score FROM candidate_info'
//         );

//         // Create a new workbook and add a worksheet
//         const workbook = xlsx.utils.book_new();
//         const worksheet = xlsx.utils.json_to_sheet(result.rows);

//         // Add the worksheet to the workbook
//         xlsx.utils.book_append_sheet(workbook, worksheet, 'Candidate Info');

//         // Write the workbook to a buffer
//         const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//         // Set response headers for download
//         res.setHeader('Content-Disposition', 'attachment; filename=Candidate_Info_Report.xlsx');
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

//         // Send the buffer as the response
//         res.send(buffer);
//     } catch (error) {
//         console.error('Error fetching data or generating Excel:', error);
//         res.status(500).send('Error generating report.');
//     }
// });
//get candidate info
// Route to get candidate info and download as Excel file with multiple sheets for specific roles
// Route to get candidate info and download as Excel file with multiple sheets for specific roles
// app.get('/api/candidate-info', async (req, res) => {
//     try {
//         // Fetch all candidate records from the candidate_info table
//         const candidateResults = await pool.query('SELECT * FROM candidate_info');

//         // Iterate over each candidate to check their performance_category in imocha_results
//         for (const candidate of candidateResults.rows) {
//             const { candidate_email } = candidate;

//             // Query the performance_category from imocha_results for the current candidate
//             const performanceResult = await pool.query(
//                 'SELECT performance_category FROM imocha_results WHERE candidate_email = $1',
//                 [candidate_email]
//             );

//             if (performanceResult.rows.length > 0) {
//                 const { performance_category } = performanceResult.rows[0];

//                 // Update candidate_info based on the performance_category
//                 if (performance_category === 'Expert' || performance_category === 'Needs improvements') {
//                     await pool.query(
//                         'UPDATE candidate_info SET recruitment_phase = $1, prescreening_status = $2 WHERE candidate_email = $3',
//                         ['Moved to L2', 'Shortlisted', candidate_email]
//                     );
//                 } else if (performance_category === 'Failed') {
//                     await pool.query(
//                         'UPDATE candidate_info SET recruitment_phase = $1, prescreening_status = $2 WHERE candidate_email = $3',
//                         ['Rejected in L1', 'Rejected', candidate_email]
//                     );
//                 }
//             }
//         }

//         // Define queries for each main category with specific role variations
//         const queries = {
//             devops: `
//                 SELECT * FROM candidate_info
//                 WHERE role IN (
//                     'Junior Azure DevOps Engineer', 'Lead Azure DevOps Engineer', 'Senior Azure DevOps Engineer',
//                     'Junior AWS DevOps Engineer', 'Lead AWS DevOps Engineer'
//                 )
//             `,
//             cloudops: `
//                 SELECT * FROM candidate_info
//                 WHERE role IN (
//                     'Junior Azure Cloudops Engineer', 'Lead Azure Cloudops Engineer', 'Senior Azure Cloudops Engineer',
//                     'Junior AWS Cloudops Engineer', 'Senior AWS Cloudops Engineer', 'Lead AWS Cloudops Engineer'
//                 )
//             `,
//             platform: `
//                 SELECT * FROM candidate_info
//                 WHERE role IN (
//                     'Junior Azure Platform Engineer', 'Lead Azure Platform Engineer', 'Senior Azure Platform Engineer',
//                     'Junior AWS Platform Engineer', 'Senior AWS Platform Engineer', 'Lead AWS Platform Engineer'
//                 )
//             `,
//             sitereliability: `
//                 SELECT * FROM candidate_info
//                 WHERE role IN (
//                     'Junior Azure Site Reliability Engineer', 'Lead Azure Site Reliability Engineer', 'Senior Azure Site Reliability Engineer',
//                     'Junior AWS Site Reliability Engineer', 'Senior AWS Site Reliability Engineer', 'Lead AWS Site Reliability Engineer'
//                 )
//             `
//         };

//         // Execute queries and store results for each role category
//         const devopsResult = await pool.query(queries.devops);
//         const cloudopsResult = await pool.query(queries.cloudops);
//         const platformResult = await pool.query(queries.platform);
//         const sitereliabilityResult = await pool.query(queries.sitereliability);

//         // Create a new workbook
//         const workbook = xlsx.utils.book_new();

//         // Create worksheets for each category and add them to the workbook
//         const devopsSheet = xlsx.utils.json_to_sheet(devopsResult.rows);
//         xlsx.utils.book_append_sheet(workbook, devopsSheet, 'DevOps Engineers');

//         const cloudopsSheet = xlsx.utils.json_to_sheet(cloudopsResult.rows);
//         xlsx.utils.book_append_sheet(workbook, cloudopsSheet, 'CloudOps Engineers');

//         const platformSheet = xlsx.utils.json_to_sheet(platformResult.rows);
//         xlsx.utils.book_append_sheet(workbook, platformSheet, 'Platform Engineers');

//         const sitereliabilitySheet = xlsx.utils.json_to_sheet(sitereliabilityResult.rows);
//         xlsx.utils.book_append_sheet(workbook, sitereliabilitySheet, 'Site Reliability Engineers');

//         // Write the workbook to a buffer
//         const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//         // Set response headers for download
//         res.setHeader('Content-Disposition', 'attachment; filename=Candidate_Info_Report.xlsx');
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

//         // Send the buffer as the response
//         res.send(buffer);
//     } catch (error) {
//         console.error('Error fetching data or generating Excel:', error);
//         res.status(500).send('Error generating report.');
//     }
// });

// get imochareport
// app.get('/Imocha-candidate-info', async (req, res) => {
//     try {
//         // Query data from the imocha_results table
//         const result = await pool.query('SELECT * FROM imocha_results');

//         // Iterate over each row to check performance_category and update recruitment_phase and prescreening_status in candidate_info
//         for (const report of result.rows) {
//             const { candidate_email, performance_category } = report;

//             // Determine the new recruitment phase and candidate status based on performance_category
//             let recruitment_phase = '';
//             let prescreening_status = ''; // Variable to hold the new status
// 			let resume_score = '';

//             if (performance_category.toLowerCase() === 'failed') {
//                 recruitment_phase = 'rejected in l1';

//                 prescreening_status = 'rejected'; // Update status to 'rejected' for failed candidates
// 				resume_score='failed in L1'
//             } else if (performance_category.toLowerCase() === 'expert' || performance_category.toLowerCase() === 'need improvements') {
//                 recruitment_phase = 'move to l2';
// 				resume_score='Qualified in L1'
//             }

//             // Update the recruitment_phase and prescreening_status (if applicable) in the candidate_info table for the specific candidate_email
//             if (recruitment_phase) {
//                 await pool.query(
//                       'UPDATE candidate_info SET recruitment_phase = $1, prescreening_status = COALESCE($2, prescreening_status), resume_score = $3 WHERE candidate_email = $4',
//                     [recruitment_phase, prescreening_status || null, resume_score, candidate_email]
//                 );
//             }
//         }

//         // Create a new workbook and add a worksheet
//         const workbook = xlsx.utils.book_new();
//         const worksheet = xlsx.utils.json_to_sheet(result.rows);

//         // Add the worksheet to the workbook
//         xlsx.utils.book_append_sheet(workbook, worksheet, 'Imocha Info');

//         // Write the workbook to a buffer
//         const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//         // Set response headers for download
//         res.setHeader('Content-Disposition', 'attachment; filename=Imocha_Info_Report.xlsx');
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

//         // Send the buffer as the response
//         res.send(buffer);

//     } catch (error) {
//         console.error('Error fetching data or generating Excel:', error);
//         res.status(500).send('Error generating report.');
//     }
// });

//send candidate details

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail)
  auth: {
    user: "sapireddyvamsi@gmail.com", // Replace with your email
    pass: "urvuwnnnmdjwohxp", // Replace with your email password or app-specific password
  },
});

// Email sending endpoint
// Email sending endpoint
app.post("/api/send-email", (req, res) => {
  const { recipient, data } = req.body;
  const { candidateEmail, score, performanceCategory, testName, pdfReportUrl } =
    data;

  // Encode the details to be safely passed in the URL
  const feedbackFormUrl = `http://localhost:3000/assessment-form-html.html?email=${encodeURIComponent(
    candidateEmail
  )}&score=${encodeURIComponent(
    score
  )}&performanceCategory=${encodeURIComponent(performanceCategory)}`;

  const mailOptions = {
    from: "sapireddyvamsi@gmail.com", // Sender address (your email)
    to: recipient, // Recipient email (user input)
    subject: `Test Results: ${testName}`, // Email subject
    text: `Hello,

Here are the test results for ${testName}:

- Candidate Email: ${candidateEmail}
- Score: ${score}
- Performance Category: ${performanceCategory}

You can download the report here: ${pdfReportUrl}

For further actions, please access the feedback form using the following link:
${feedbackFormUrl}

Best regards,
Your Team`,
  };

  // Send the email using the transporter
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Failed to send email", error });
    }
    console.log("Email sent:", info.response);
    res.status(200).json({ message: "Email sent successfully" });
  });
});

app.post("/api/save-imocha-results", async (req, res) => {
  try {
    const reports = req.body.reports; // Get reports array from request body

    // Insert each report into the database
    for (const report of reports) {
      const {
        candidateEmail,
        score,
        totalTestPoints,
        scorePercentage,
        performanceCategory,
        testName,
        pdfReportUrl,
      } = report;

      // Check if the candidateEmail already exists in the database
      const existingRecord = await pool.query(
        "SELECT * FROM imocha_results WHERE candidate_email = $1",
        [candidateEmail]
      );

      if (existingRecord.rows.length === 0) {
        // If no existing record, insert a new row
        await pool.query(
          `INSERT INTO imocha_results (candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            candidateEmail,
            score,
            totalTestPoints,
            scorePercentage,
            performanceCategory,
            testName,
            pdfReportUrl,
          ]
        );
      } else {
        // If the record already exists, optionally update it if needed
        console.log(`Record for ${candidateEmail} already exists`);
      }
    }

    res.status(200).send("Results saved successfully");
  } catch (error) {
    console.error("Error saving results:", error);
    res.status(500).send("Server error");
  }
});

//devops count
app.get("/api/devops-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Azure DevOps Engineer', 'Lead Azure DevOps Engineer','Senior Azure DevOps Engineer','Junior AWS DevOps Engineer','Senior AWS Cloudops Engineer','Lead AWS DevOps Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching DevOps resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});

//platform count
app.get("/api/platform-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Azure Platform Engineer', 'Lead Azure Platform Engineer','Senior Azure Platform Engineer','Junior AWS Platform Engineer','Senior AWS Platform Engineer','Lead AWS Platform Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching DevOps resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});
//cloudops count
app.get("/api/cloudops-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Azure Cloudops Engineer', 'Lead Azure Cloudops Engineer','Senior Azure Cloudops Engineer','Junior AWS Cloudops Engineer','Senior AWS Cloudops Engineer','Lead AWS Cloudops Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching DevOps resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});
//site reliability count
app.get("/api/site-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Azure Site Reliability Engineer', 'Lead Azure Site Reliability Engineer','Senior Azure Site Reliability Engineer','Junior AWS Site Reliability Engineer','Senior AWS Site Reliability Engineer','Lead AWS Site Reliability Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching DevOps resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});

//App count
app.get("/api/reactjs-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Java Cloud Native Application Engineer - Backend', 'Senior Java Cloud Native Application Engineer - Backend','Junior .Net Cloud Native Application Engineer - Backend','Senior .Net Cloud Native Application Engineer - Backend')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching DevOps resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});

app.get("/api/snow-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Angular Cloud Native Application Engineer - Frontend', 'Senior Angular Cloud Native Application Engineer - Frontend','Junior React Cloud Native Application Engineer - Frontend','Senior React Cloud Native Application Engineer - Frontend')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching snow resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});
app.get("/api/java-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Mendix LCNC Platform Engineer', 'Senior Mendix LCNC Platform Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching java resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});

app.get("/api/hadoop-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Hadoop Data Engineer', 'Lead Hadoop Data Engineer','Senior Hadoop Data Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching hadoop resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});
app.get("/api/.net-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior WF-NET & ASP.NET Core Developer', 'Lead WF-NET & ASP.NET Core Developer','Senior WF-NET & ASP.NET Core Developer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching .net resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the DevOps resume count",
      });
  }
});

//Data count
app.get("/api/data-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('AWS Data Engineer', 'Azure Data Engineer','Databricks Data Engineer','Hadoop Data Engineer','DataStage Data Engineer','IBM MDM Data Engineer','ETL Data Engineer','Oracle Data Engineer','IDMC Data Engineer','Marklogic Data Engineer','SQL Data Engineer','Snowflake Data Engineer','SSIS Data Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-ops-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Data-Ops Engineer', 'Lead Data-Ops Engineer','Senior Data-Ops Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-bi-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Power BI Data – BI Visualization Engineer', 'Tableau Data – BI Visualization Engineer','WebFOCUS Data – BI Visualization Engineer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-modeller-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Data Modeller')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-analyst-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN (' Data Analyst')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-architect-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Data Architect', 'Lead Data Architect','Senior Data Architect')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});
app.get("/api/data-Scientist-resume-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Data Scientist –AI/ML', 'Lead Data Scientist –AI/ML','Senior Data Scientist –AI/ML')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching data resume count:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching the data resume count",
      });
  }
});

// Prescreening count
// Route to get the count of rejected candidates in the prescreening phase
app.get("/api/rejected-prescreening-count", async (req, res) => {
  try {
    // Query to get the count of rejected candidates in the prescreening phase
    const result = await pool.query(
      `SELECT COUNT(*) AS count 
             FROM candidate_info 
             WHERE prescreening_status = 'Rejected' AND recruitment_phase = 'prescreening'`
    );

    // Send the count as a response
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching rejected prescreening count:", error);
    res.status(500).send("Error fetching count.");
  }
});
// Route to get the count of shortlisted candidates in the 'Move to L1' phase
app.get("/api/shortlisted-prescreening-count", async (req, res) => {
  try {
    // Query to get the count of shortlisted candidates in the 'Move to L1' phase
    const result = await pool.query(
      `SELECT COUNT(*) AS count 
             FROM candidate_info 
             WHERE prescreening_status = 'Shortlisted' AND recruitment_phase = 'Move to L1'`
    );

    // Send the count as a response
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching shortlisted L1 count:", error);
    res.status(500).send("Error fetching count.");
  }
});
//L1 COUNT
app.get("/api/rejected-l1-count", async (req, res) => {
  try {
    // Query to get the count of rejected candidates in the prescreening phase
    const result = await pool.query(
      `SELECT COUNT(*) AS count 
             FROM candidate_info 
             WHERE prescreening_status = 'Rejected' AND recruitment_phase = 'Rejected in L1'`
    );

    // Send the count as a response
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching rejected prescreening count:", error);
    res.status(500).send("Error fetching count.");
  }
});
// Route to get the count of shortlisted candidates in the 'Move to L1' phase
app.get("/api/shortlisted-l1-count", async (req, res) => {
  try {
    // Query to get the count of shortlisted candidates in the 'Move to L1' phase
    const result = await pool.query(
      `SELECT COUNT(*) AS count 
             FROM candidate_info 
             WHERE prescreening_status = 'Shortlisted' AND recruitment_phase = 'Moved to L2'`
    );

    // Send the count as a response
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching shortlisted L1 count:", error);
    res.status(500).send("Error fetching count.");
  }
});

// Route to fetch candidate data

app.get("/api/getcandidates", async (req, res) => {
  try {
    // Replace the column names with the ones relevant to your database schema
    const result = await pool.query(
      "SELECT candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score,date FROM candidate_info"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/candidate-counts", async (req, res) => {
  try {
    const { eng_center } = req.query;

    if (!eng_center) {
      return res
        .status(400)
        .json({ error: "eng_center parameter is required" });
    }

    // Convert comma-separated string to an array and trim spaces
    const engCentersArray = eng_center
      .split(",")
      .map((center) => center.trim());

    // Generate placeholders ($1, $2, $3, ...) dynamically
    const placeholders = engCentersArray
      .map((_, index) => `$${index + 1}`)
      .join(",");

    // Query to get the total count for multiple eng_center values
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total_count FROM candidate_info WHERE eng_center IN (${placeholders}) AND visible = TRUE`,
      engCentersArray
    );

    // Query to get the count of shortlisted candidates
    const shortlistedResult = await pool.query(
      `SELECT COUNT(*) AS shortlisted_count FROM candidate_info WHERE eng_center IN (${placeholders}) AND prescreening_status = 'Shortlisted' AND visible = TRUE`,
      engCentersArray
    );

    // Query to get the count of rejected candidates
    const rejectedResult = await pool.query(
      `SELECT COUNT(*) AS rejected_count FROM candidate_info WHERE eng_center IN (${placeholders}) AND prescreening_status = 'Rejected' AND visible = TRUE`,
      engCentersArray
    );

    // Respond with the counts
    res.json({
      totalCount: totalResult.rows[0].total_count,
      shortlistedCount: shortlistedResult.rows[0].shortlisted_count,
      rejectedCount: rejectedResult.rows[0].rejected_count,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).send("Server error");
  }
});

const testIds = {
  cloudEC: ["1292779", "1292781", "1295883", "1292990", "1292769", "1292775", "1292733", "1292976", "1292950", "1292733", "1292976", "1292765"],
  dataEC: ["1303946", "1293813", "1293971", "1263132", "1304065", "1233151", "1294495", "1302835", "1294495", "1304066", "1304100", "1292173", "1293822", "1303985", "1303999", "1304109", "1304111", "1304149"],
  appEC: ["1304441", "1228695", "1302022", "1228712"],
};

// Delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper with exponential backoff
async function fetchWithRetry(requestFunc, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFunc();
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.warn(`Rate limit hit. Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}
async function retryWithExponentialBackoff(requestFn, maxRetries = 5, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const status = error.response?.status;
      if (status === 429 && attempt < maxRetries) {
        const delay = baseDelay * 2 ** (attempt - 1) + Math.floor(Math.random() * 300); // jitter
        console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error("Max retries exceeded");
}


// Fetch completed test attempts (with delay & retry)
async function getCompletedTestAttempts(testIds, startDateTime, endDateTime) {
  const allTestAttempts = [];

  for (const testId of testIds) {
    try {
      const response = await retryWithExponentialBackoff(() =>
        axios.post(
          `${IMOCHA_BASE_URL}/candidates/testattempts?state=completed`,
          { testId, StartDateTime: startDateTime, EndDateTime: endDateTime },
          { headers: { "x-api-key": IMOCHA_API_KEY, "Content-Type": "application/json" } }
        )
      );

      if (response.data.result?.testAttempts) {
        allTestAttempts.push(...response.data.result.testAttempts);
        console.log(`Fetched test attempts for Test ID: ${testId}`);
      }
    } catch (error) {
      console.error(`Failed to fetch test attempts for Test ID ${testId}:`, error.message);
    }
  }

  return allTestAttempts;
}


// Fetch candidate report by invitationId
async function getReport(invitationId) {
  try {
    const response = await fetchWithRetry(() =>
      axios.get(`${IMOCHA_BASE_URL}/reports/${invitationId}`, {
        headers: { "x-api-key": IMOCHA_API_KEY, "Content-Type": "application/json" },
      })
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching report for invitation ID ${invitationId}:`, error.message);
    return null;
  }
}

// Fetch test attempts and store in DB
async function fetchAndSaveTestResults(testIdsArray, startDateTime, endDateTime) {
  console.log("Fetching test results...");

  try {
    const testAttempts = await getCompletedTestAttempts(testIdsArray, startDateTime, endDateTime);

    for (const attempt of testAttempts) {
      const report = await getReport(attempt.testInvitationId);

      if (report) {
        const query = `
          INSERT INTO imocha_results 
          (candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url, attempted_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (candidate_email) 
          DO UPDATE SET 
            score = EXCLUDED.score,
            total_test_points = EXCLUDED.total_test_points,
            score_percentage = EXCLUDED.score_percentage,
            performance_category = EXCLUDED.performance_category,
            test_name = EXCLUDED.test_name,
            attempted_date = EXCLUDED.attempted_date,
            pdf_report_url = EXCLUDED.pdf_report_url;
        `;

        const values = [
          report.candidateEmail,
          report.score,
          report.totalTestPoints,
          report.scorePercentage,
          report.performanceCategory,
          report.testName,
          report.pdfReportUrl,
          report.attemptedOn,
        ];

        await pool.query(query, values);
        console.log(`Saved/Updated: ${report.candidateEmail}`);
      }
    }

    console.log("Test results updated successfully.");
  } catch (error) {
    console.error("Error saving test results:", error.message);
  }
}

// API Endpoints
app.post("/api/callTestAttempts/cloudEC", async (req, res) => {
  const { startDate, endDate } = req.body;
  const startDateTime = new Date(`${startDate}T00:00:00Z`).toISOString();
  const endDateTime = new Date(`${endDate}T23:59:59Z`).toISOString();

  await fetchAndSaveTestResults(testIds.cloudEC, startDateTime, endDateTime);
  res.json({ message: "Cloud EC test attempts processed" });
});

app.post("/api/callTestAttempts/dataEC", async (req, res) => {
  const { startDate, endDate } = req.body;
  const startDateTime = new Date(`${startDate}T00:00:00Z`).toISOString();
  const endDateTime = new Date(`${endDate}T23:59:59Z`).toISOString();

  await fetchAndSaveTestResults(testIds.dataEC, startDateTime, endDateTime);
  res.json({ message: "Data EC test attempts processed" });
});

app.post("/api/callTestAttempts/appEC", async (req, res) => {
  const { startDate, endDate } = req.body;
  const startDateTime = new Date(`${startDate}T00:00:00Z`).toISOString();
  const endDateTime = new Date(`${endDate}T23:59:59Z`).toISOString();

  await fetchAndSaveTestResults(testIds.appEC, startDateTime, endDateTime);
  res.json({ message: "App EC test attempts processed" });
});

// Run fetchAndSaveTestResults every 5 minutes for each category


// Run fetchAndSaveTestResults every 5 minutes for each category
// setInterval(() => {
//   console.log("Scheduled task running...");

//   const now = new Date();
//   const last24Hours = new Date(
//     now.getTime() - 24 * 60 * 60 * 1000
//   ).toISOString();
//   const currentTime = new Date().toISOString();

//   fetchAndSaveTestResults(testIds.cloudEC, last24Hours, currentTime);
//   fetchAndSaveTestResults(testIds.dataEC, last24Hours, currentTime);
//   fetchAndSaveTestResults(testIds.appEC, last24Hours, currentTime);
// }, 10000); // 5 minutes

app.get("/api/test-counts", async (req, res) => {
  try {
    const testNames = [
      "Clone of_Java Backend Developer",
      "Data_EC_ERIE_Python_PySpark",
      "Senior Azure DevOps Engineer - Cloud EC",
      "Jr DevSecOps Engineer - AWS",
      "Junior Azure DevOps Engineer",
      "AWS Platform Lead",
      "Azure Cloud Engineer - Cloud EC",
    ];

    // Query the database for counts of the specified test names where visible = TRUE
    const query = `
          SELECT test_name, COUNT(*) AS count
          FROM imocha_results
          WHERE test_name = ANY($1) AND visible = TRUE
          GROUP BY test_name
      `;
    const result = await pool.query(query, [testNames]);

    // Convert the result into a key-value object
    const counts = {};
    result.rows.forEach((row) => {
      counts[row.test_name] = parseInt(row.count, 10);
    });

    res.json(counts);
  } catch (error) {
    console.error("Error fetching test counts:", error);
    res.status(500).json({ error: "Failed to fetch test counts" });
  }
});

// app.get('/api/test-results', async (req, res) => {
//   const testId = 1292180;
//   const testAttempts = await getCompletedTestAttempts(testId);

//   if (testAttempts.length === 0) {
//     return res.status(404).json({ message: 'No completed test attempts found.' });
//   }

//   const reports = [];
//   for (const attempt of testAttempts) {
//     const report = await getReport(attempt.testInvitationId);
//     if (report) {
//       reports.push(report);
//     }
//   }

//   res.json(reports);
// });

//fetch imocha_results
app.get("/api/fetch-results", async (req, res) => {
  try {
    const query = `
      SELECT candidate_email, 
             score, 
             total_test_points, 
             score_percentage, 
             performance_category, 
             test_name, 
             pdf_report_url,
             attempted_date
          
      FROM imocha_results;
    `;
    const result = await pool.query(query);
    res.json(result.rows); // Send the data as a JSON response
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching results." });
  }
});
app.get("/api/candidates", async (req, res) => {
  try {
    const engCenter = req.query.eng_center;

    let query =
      "SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info WHERE visible = TRUE";
    const params = [];

    if (engCenter) {
      query += " AND eng_center = $1";
      params.push(engCenter);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Server error");
  }
});

// Shortlisted candidates with visible = true
app.get("/api/candidates/shortlisted", async (req, res) => {
  try {
    const engCenter = req.query.eng_center;

    let query =
      "SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info WHERE prescreening_status = $1 AND visible = TRUE";
    const params = ["Shortlisted"];

    if (engCenter) {
      query += " AND eng_center = $2";
      params.push(engCenter);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching shortlisted candidates:", error);
    res.status(500).send("Server error");
  }
});

// Rejected candidates with visible = true
app.get("/api/candidates/rejected", async (req, res) => {
  try {
    const engCenter = req.query.eng_center;

    let query =
      "SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info WHERE prescreening_status = $1 AND visible = TRUE";
    const params = ["Rejected"];

    if (engCenter) {
      query += " AND eng_center = $2";
      params.push(engCenter);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching rejected candidates:", error);
    res.status(500).send("Server error");
  }
});

// API endpoint to get the prescreening count
app.get("/api/prescreening-count", async (req, res) => {
  try {
    // Query to fetch the prescreening count
    const query = `
          SELECT COUNT(*) AS prescreening_count
          FROM candidate_info
          WHERE recruitment_phase = 'prescreening';
      `;
    const result = await pool.query(query);

    // Send the count as the response
    res.json({ prescreening_count: result.rows[0].prescreening_count });
  } catch (error) {
    console.error("Error fetching prescreening count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/move-to-l1-count", async (req, res) => {
  try {
    // Query to fetch the Move to L1 count
    const query = `
          SELECT COUNT(*) AS move_to_l1_count
          FROM candidate_info
          WHERE recruitment_phase = 'Move to L1';
      `;
    const result = await pool.query(query);

    // Send the count as the response
    res.json({ move_to_l1_count: result.rows[0].move_to_l1_count });
  } catch (error) {
    console.error("Error fetching Move to L1 count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// API endpoint to get the Moved to L2 count
app.get("/api/moved-to-l2-count", async (req, res) => {
  try {
    // Query to fetch the Moved to L2 count
    const query = `
          SELECT COUNT(*) AS moved_to_l2_count
          FROM candidate_info
          WHERE recruitment_phase = 'Shortlisted in L2';
      `;
    const result = await pool.query(query);

    // Send the count as the response
    res.json({ moved_to_l2_count: result.rows[0].moved_to_l2_count });
  } catch (error) {
    console.error("Error fetching Moved to L2 count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//imocha cloud count
app.get("/api/imocha-results-count", async (req, res) => {
  try {
    // Query to fetch the count
    const query = "SELECT COUNT(*) AS total_count FROM imocha_results;";
    const result = await pool.query(query);

    // Send the count as the response
    res.json({ total_count: result.rows[0].total_count });
  } catch (error) {
    console.error("Error fetching count from imocha_results:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/candidate-prescreening", async (req, res) => {
  try {
    const query = `
      SELECT candidate_name, role, candidate_email, prescreening_status
      FROM candidate_prescreening;
    `;
    const result = await pool.query(query);

    res.json(result.rows); // Send all records with email
  } catch (error) {
    console.error("Error fetching prescreening candidates:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Node.js (server-side)
app.get("/api/technical-round", async (req, res) => {
  const email = req.query.email; // Get email from query params
  try {
    const result = await pool.query(
      "SELECT test_name, score, performance_category,pdf_report_url FROM imocha_results WHERE candidate_email = $1",
      [email]
    );
    res.json(result.rows); // Send the results back to the frontend
  } catch (error) {
    console.error("Error fetching technical round data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});
//technical panel
app.get("/api/technical-profiles", async (req, res) => {
  try {
    // Query to get all technical profiles
    const result = await pool.query(
      `SELECT id, name, email, status, azure, aws, account FROM panel_details`
    );

    // Respond with the profiles
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/email-details", async (req, res) => {
  try {
    // Query to get all technical profiles
    const result = await pool.query(`SELECT email FROM panel_details`);

    // Respond with the profiles
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).send("Server error");
  }
});

// prescreening Shortlisted
app.get("/api/get-shortlisted-candidates", async (req, res) => {
  try {
    // Update shortlisted candidates with scores, statuses, and PDF report URL
    const updateQuery = `
    UPDATE candidate_info
    SET 
      l_1_score = ir.score,
      l_1_status = CASE 
        WHEN ir.score >= 18 THEN 'qualified in l1'
        WHEN ir.score < 18 THEN 'failed in l1'
        ELSE 'no score available'
      END,
      recruitment_phase = CASE 
        WHEN ir.score >= 18 THEN 'Moved to L2'
        WHEN ir.score < 18 THEN 'Rejected in L1'
        ELSE recruitment_phase -- Keep the phase unchanged if no score
      END,
      imocha_report = ir.pdf_report_url -- Add PDF report URL from imocha_results
    FROM imocha_results ir
    WHERE 
      candidate_info.candidate_email = ir.candidate_email
      AND candidate_info.prescreening_status = 'Shortlisted'
      AND candidate_info.recruitment_phase NOT IN ('Shortlisted in Fitment Round','L2 Technical Round Scheduled','EC Fitment Round Scheduled','Shortlisted in EC Fitment Round','Shortlisted in Client','Fitment Round Scheduled','Project Fitment Round Scheduled','Shortlisted in Project Fitment Round','Client Fitment Round Scheduled','Shortlisted in Client Fitment Round','Shortlisted in L2', 'Rejected in L2', 'On Hold in L2', 'No iMocha Exam','Schedule L2 Technical','Client Round Scheduled','Rejected in Client','Rejected in Client Fitment Round','Rejected in Project Fitment Round','Rejected in Fitment Round');
    
    `;

    await pool.query(updateQuery);

    // Retrieve shortlisted candidates after update
    const getQuery = `
      SELECT 
      	ci.rrf_id,
        ci.hr_email,
        ci.candidate_name,
        ci.candidate_email,
        ci.prescreening_status,
        COALESCE(ir.score, null) AS score,
        ci.l_1_score,
        ci.role,
        ci.candidate_phone,
        ci.l_1_status,
        ci.date,
        ci.recruitment_phase,
        ir.pdf_report_url AS imocha_report -- Include PDF report URL in the response
      FROM 
        candidate_info ci
      LEFT JOIN 
        imocha_results ir
      ON 
        ci.candidate_email = ir.candidate_email
      WHERE 
        ci.prescreening_status = 'Shortlisted';
    `;

    const result = await pool.query(getQuery);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "No shortlisted candidates found." });
    }

    res.status(200).json({
      message: "Shortlisted candidates retrieved successfully.",
      candidates: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving shortlisted candidates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/get-email-status", async (req, res) => {
  const candidateEmail = req.query.candidate_email;
  if (!candidateEmail) {
    return res
      .status(400)
      .json({ message: "candidate_email query parameter is required." });
  }

  try {
    const queryText =
      "SELECT email_status FROM candidate_info WHERE candidate_email = $1";
    const result = await pool.query(queryText, [candidateEmail]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    // result.rows[0].email_status might be null or 'emailsent'
    res.json({ status: result.rows[0].email_status });
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ message: "Database error." });
  }
});

// API endpoint to update the email status for a candidate.
// Expects a JSON body with candidate_email and status.
app.post("/api/update-email-status", async (req, res) => {
  const { candidate_email, status } = req.body;
  if (!candidate_email || !status) {
    return res
      .status(400)
      .json({ message: "candidate_email and status are required." });
  }

  try {
    const queryText =
      "UPDATE candidate_info SET email_status = $1 WHERE candidate_email = $2 RETURNING *";
    const result = await pool.query(queryText, [status, candidate_email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.json({
      message: "Email status updated successfully.",
      candidate: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating email status:", err);
    res.status(500).json({ message: "Database error." });
  }
});

//get form data
app.get("/api/getCandidateData", async (req, res) => {
  try {
    const candidateEmail = req.query.candidateEmail; // Get the email from the query parameters

    if (!candidateEmail) {
      return res.status(400).json({ error: "candidateEmail is required" });
    }

    const query = `
      SELECT id, candidate_name, role, panel_name, l_2_interviewdate, l_1_score, rrf_id, hr_email, eng_center
      FROM candidate_info WHERE candidate_email = $1;
    `;

    const result = await pool.query(query, [candidateEmail]);

    if (result.rows.length > 0) {
      return res.json(result.rows[0]); // Return the first result (there should be only one row per email)
    } else {
      return res.status(404).json({ error: "No candidate found" });
    }
  } catch (error) {
    console.error("Error fetching candidate data:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

//l2 form update
app.post("/api/updateCandidateFeedback", async (req, res) => {
  try {
    const { candidateEmail, feedback, result } = req.body; // Get the data from the request body

    if (!candidateEmail || !feedback || !result) {
      return res
        .status(400)
        .json({ error: "candidateEmail, feedback, and result are required" });
    }

    let recruitmentPhase;
    if (result === "Recommended") {
      recruitmentPhase = "Shortlisted in L2";
    } else if (result === "Rejected") {
      recruitmentPhase = "Rejected in L2";
    }

    const query = `
      UPDATE candidate_info
      SET l_2_feedback = $1,
          l_2_status = $2,
          recruitment_phase = $3
      WHERE candidate_email = $4
      RETURNING *;
    `;

    // Execute the query with the parameters
    const resultFromDB = await pool.query(query, [
      feedback,
      result,
      recruitmentPhase,
      candidateEmail,
    ]);

    // If the candidate was found and updated
    if (resultFromDB.rows.length > 0) {
      return res.json({
        success: true,
        message: "Candidate feedback and result updated successfully",
        updatedData: resultFromDB.rows[0], // Optionally, return the updated data
      });
    } else {
      return res.status(404).json({ error: "Candidate not found" });
    }
  } catch (error) {
    console.error("Error updating candidate feedback:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

// app.post('/api/add-feedback', async (req, res) => {
//   const {
//       rrf_id, position, candidate_name, interview_date, interviewer_name,
//       hr_email, candidate_email, core_cloud_concepts_deployment, core_cloud_concepts_configuration,
//       core_cloud_concepts_troubleshooting, core_cloud_concepts_justification,
//       core_cloud_concepts_improvements, networking_security_deployment, networking_security_configuration,
//       networking_security_troubleshooting, networking_security_justification,
//       networking_security_improvements, infrastructure_management_deployment, infrastructure_management_configuration,
//       infrastructure_management_troubleshooting, infrastructure_management_justification,
//       infrastructure_management_improvements, scalability_high_avail_deployment, scalability_high_avail_configuration,
//       scalability_high_avail_troubleshooting, scalability_high_avail_justification,
//       scalability_high_avail_improvements, automation_deployment, automation_configuration, automation_troubleshooting,
//       automation_justification, automation_improvements, observability_deployment, observability_configuration, observability_troubleshooting,
//       observability_justification, observability_improvements, detailed_feedback, result
//   } = req.body;

//   // Check for required fields
//   if (!rrf_id || !position || !candidate_name || !interview_date || !interviewer_name || !hr_email || !candidate_email) {
//       return res.status(400).json({
//           success: false,
//           message: 'Missing required fields.',
//       });
//   }

//   try {
//       const query = `
//           INSERT INTO feedback_table (
//               rrf_id, position, candidate_name, interview_date, interviewer_name,
//               hr_email, candidate_email,

//               core_cloud_concepts_deployment, core_cloud_concepts_configuration,
//               core_cloud_concepts_troubleshooting, core_cloud_concepts_justification,
//               core_cloud_concepts_improvements,

//               networking_security_deployment, networking_security_configuration,
//               networking_security_troubleshooting, networking_security_justification,
//               networking_security_improvements,

//               infrastructure_management_deployment, infrastructure_management_configuration,
//               infrastructure_management_troubleshooting, infrastructure_management_justification,
//               infrastructure_management_improvements,

//               scalability_high_avail_deployment, scalability_high_avail_configuration,
//               scalability_high_avail_troubleshooting, scalability_high_avail_justification,
//               scalability_high_avail_improvements,

//               automation_deployment, automation_configuration, automation_troubleshooting,
//               automation_justification, automation_improvements,

//               observability_deployment, observability_configuration, observability_troubleshooting,
//               observability_justification, observability_improvements,

//               detailed_feedback, result
//           ) VALUES (
//               $1, $2, $3, $4, $5, $6, $7,
//               $8, $9, $10, $11, $12,
//               $13, $14, $15, $16, $17,
//               $18, $19, $20, $21, $22,
//               $23, $24, $25, $26, $27,
//               $28, $29, $30, $31, $32,
//               $33, $34, $35, $36, $37,
//               $38, $39
//           )
//       `;

//       const values = [
//           rrf_id, position, candidate_name, interview_date, interviewer_name, hr_email, candidate_email,
//           core_cloud_concepts_deployment, core_cloud_concepts_configuration, core_cloud_concepts_troubleshooting,
//           core_cloud_concepts_justification, core_cloud_concepts_improvements,
//           networking_security_deployment, networking_security_configuration, networking_security_troubleshooting,
//           networking_security_justification, networking_security_improvements,
//           infrastructure_management_deployment, infrastructure_management_configuration,
//           infrastructure_management_troubleshooting, infrastructure_management_justification,
//           infrastructure_management_improvements,
//           scalability_high_avail_deployment, scalability_high_avail_configuration,
//           scalability_high_avail_troubleshooting, scalability_high_avail_justification,
//           scalability_high_avail_improvements,
//           automation_deployment, automation_configuration, automation_troubleshooting, automation_justification,
//           automation_improvements,
//           observability_deployment, observability_configuration, observability_troubleshooting,
//           observability_justification, observability_improvements,
//           detailed_feedback, result
//       ];

//       await pool.query(query, values);

//       return res.status(200).json({
//           success: true,
//           message: 'Feedback submitted successfully!',
//       });
//   } catch (error) {
//       console.error('Error submitting feedback:', error);
//       return res.status(500).json({
//           success: false,
//           message: 'An error occurred while submitting feedback.',
//       });
//   }
// });

app.post("/api/add-feedback", async (req, res) => {
  const {
    rrf_id,
    position,
    candidate_name,
    interview_date,
    interviewer_name,
    hr_email,
    candidate_email,
    core_cloud_concepts_deployment,
    core_cloud_concepts_configuration,
    core_cloud_concepts_troubleshooting,
    core_cloud_concepts_justification,
    core_cloud_concepts_improvements,
    networking_security_deployment,
    networking_security_configuration,
    networking_security_troubleshooting,
    networking_security_justification,
    networking_security_improvements,
    infrastructure_management_deployment,
    infrastructure_management_configuration,
    infrastructure_management_troubleshooting,
    infrastructure_management_justification,
    infrastructure_management_improvements,
    scalability_high_avail_deployment,
    scalability_high_avail_configuration,
    scalability_high_avail_troubleshooting,
    scalability_high_avail_justification,
    scalability_high_avail_improvements,
    automation_deployment,
    automation_configuration,
    automation_troubleshooting,
    automation_justification,
    automation_improvements,
    observability_deployment,
    observability_configuration,
    observability_troubleshooting,
    observability_justification,
    observability_improvements,
    detailed_feedback,
    result,
  } = req.body;

  // Check for required fields
  if (
    !rrf_id ||
    !position ||
    !candidate_name ||
    !interview_date ||
    !interviewer_name ||
    !hr_email ||
    !candidate_email
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
  }

  try {
    // First, check if the candidate email already exists
    const existingCandidateQuery = `
          SELECT * FROM feedback_table WHERE candidate_email = $1;
      `;
    const existingCandidateResult = await pool.query(existingCandidateQuery, [
      candidate_email,
    ]);

    if (existingCandidateResult.rows.length > 0) {
      // If the candidate exists, update the existing record
      const updateQuery = `
              UPDATE feedback_table SET
                  rrf_id = $1, position = $2, candidate_name = $3, interview_date = $4,
                  interviewer_name = $5, hr_email = $6, core_cloud_concepts_deployment = $7,
                  core_cloud_concepts_configuration = $8, core_cloud_concepts_troubleshooting = $9,
                  core_cloud_concepts_justification = $10, core_cloud_concepts_improvements = $11,
                  networking_security_deployment = $12, networking_security_configuration = $13,
                  networking_security_troubleshooting = $14, networking_security_justification = $15,
                  networking_security_improvements = $16, infrastructure_management_deployment = $17,
                  infrastructure_management_configuration = $18, infrastructure_management_troubleshooting = $19,
                  infrastructure_management_justification = $20, infrastructure_management_improvements = $21,
                  scalability_high_avail_deployment = $22, scalability_high_avail_configuration = $23,
                  scalability_high_avail_troubleshooting = $24, scalability_high_avail_justification = $25,
                  scalability_high_avail_improvements = $26, automation_deployment = $27,
                  automation_configuration = $28, automation_troubleshooting = $29, automation_justification = $30,
                  automation_improvements = $31, observability_deployment = $32,
                  observability_configuration = $33, observability_troubleshooting = $34,
                  observability_justification = $35, observability_improvements = $36,
                  detailed_feedback = $37, result = $38
              WHERE candidate_email = $39
              RETURNING *;
          `;
      const values = [
        rrf_id,
        position,
        candidate_name,
        interview_date,
        interviewer_name,
        hr_email,
        core_cloud_concepts_deployment,
        core_cloud_concepts_configuration,
        core_cloud_concepts_troubleshooting,
        core_cloud_concepts_justification,
        core_cloud_concepts_improvements,
        networking_security_deployment,
        networking_security_configuration,
        networking_security_troubleshooting,
        networking_security_justification,
        networking_security_improvements,
        infrastructure_management_deployment,
        infrastructure_management_configuration,
        infrastructure_management_troubleshooting,
        infrastructure_management_justification,
        infrastructure_management_improvements,
        scalability_high_avail_deployment,
        scalability_high_avail_configuration,
        scalability_high_avail_troubleshooting,
        scalability_high_avail_justification,
        scalability_high_avail_improvements,
        automation_deployment,
        automation_configuration,
        automation_troubleshooting,
        automation_justification,
        automation_improvements,
        observability_deployment,
        observability_configuration,
        observability_troubleshooting,
        observability_justification,
        observability_improvements,
        detailed_feedback,
        result,
        candidate_email,
      ];

      await pool.query(updateQuery, values);
      return res.status(200).json({
        success: true,
        message: "Candidate feedback updated successfully!",
      });
    } else {
      // If the candidate does not exist, insert new feedback data
      const insertQuery = `
              INSERT INTO feedback_table (
                  rrf_id, position, candidate_name, interview_date, interviewer_name, hr_email, candidate_email,
                  core_cloud_concepts_deployment, core_cloud_concepts_configuration, core_cloud_concepts_troubleshooting,
                  core_cloud_concepts_justification, core_cloud_concepts_improvements, networking_security_deployment,
                  networking_security_configuration, networking_security_troubleshooting, networking_security_justification,
                  networking_security_improvements, infrastructure_management_deployment, infrastructure_management_configuration,
                  infrastructure_management_troubleshooting, infrastructure_management_justification,
                  infrastructure_management_improvements, scalability_high_avail_deployment, scalability_high_avail_configuration,
                  scalability_high_avail_troubleshooting, scalability_high_avail_justification,
                  scalability_high_avail_improvements, automation_deployment, automation_configuration, automation_troubleshooting,
                  automation_justification, automation_improvements, observability_deployment, observability_configuration,
                  observability_troubleshooting, observability_justification, observability_improvements, detailed_feedback, result
              ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                  $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
              )
          `;
      const values = [
        rrf_id,
        position,
        candidate_name,
        interview_date,
        interviewer_name,
        hr_email,
        candidate_email,
        core_cloud_concepts_deployment,
        core_cloud_concepts_configuration,
        core_cloud_concepts_troubleshooting,
        core_cloud_concepts_justification,
        core_cloud_concepts_improvements,
        networking_security_deployment,
        networking_security_configuration,
        networking_security_troubleshooting,
        networking_security_justification,
        networking_security_improvements,
        infrastructure_management_deployment,
        infrastructure_management_configuration,
        infrastructure_management_troubleshooting,
        infrastructure_management_justification,
        infrastructure_management_improvements,
        scalability_high_avail_deployment,
        scalability_high_avail_configuration,
        scalability_high_avail_troubleshooting,
        scalability_high_avail_justification,
        scalability_high_avail_improvements,
        automation_deployment,
        automation_configuration,
        automation_troubleshooting,
        automation_justification,
        automation_improvements,
        observability_deployment,
        observability_configuration,
        observability_troubleshooting,
        observability_justification,
        observability_improvements,
        detailed_feedback,
        result,
      ];

      await pool.query(insertQuery, values);
      return res.status(200).json({
        success: true,
        message: "Feedback submitted successfully!",
      });
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting feedback.",
    });
  }
});

app.get("/api/get-feedback", async (req, res) => {
  const { candidateEmail } = req.query;

  if (!candidateEmail) {
    return res.status(400).json({
      error: "Candidate email is required.",
    });
  }

  try {
    // Query to get feedback data for the candidate by their email
    const query = `
          SELECT * FROM feedback_table WHERE candidate_email = $1;
      `;
    const result = await pool.query(query, [candidateEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No feedback found for this candidate.",
      });
    }

    // Return the feedback data as JSON
    return res.json(result.rows[0]); // Return only the first (and only) matching candidate
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the feedback.",
    });
  }
});

app.post("/api/ecusecasesubmitform", async (req, res) => {
  const data = req.body;

  // Check if required data is provided
  if (
    !data ||
    !data.candidateEmail ||
    !data.imochaScore ||
    !data.rrfId ||
    !data.position ||
    !data.candidateName ||
    !data.interviewDate ||
    !data.interviewerName ||
    !data.hrEmail
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = `
    INSERT INTO ecusecasefeedback (
      candidate_email, imocha_score, rrf_id, position, candidate_name, interview_date, interviewer_name, hr_email,
      usecase_understanding_score_1, usecase_understanding_score_2, usecase_understanding_score_3, usecase_understanding_score_4,
      usecase_understanding_rating, usecase_understanding_justification, usecase_understanding_improvements,
      technical_design_score_1, technical_design_score_2, technical_design_score_3, technical_design_rating,
      technical_design_justification, technical_design_improvements,
      solution_implementation_score_1, solution_implementation_score_2, solution_implementation_score_3, solution_implementation_rating,
      solution_implementation_justification, solution_implementation_improvements,
      troubleshooting_score_1, troubleshooting_score_2, troubleshooting_score_3, troubleshooting_rating,
      troubleshooting_justification, troubleshooting_improvements,
      walkthrough_score_1, walkthrough_score_2, walkthrough_score_3, walkthrough_score_4, walkthrough_rating,
      walkthrough_justification, walkthrough_improvements,
      detailed_feedback, result
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
  `;

  const values = [
    data.candidateEmail,
    data.imochaScore,
    data.rrfId,
    data.position,
    data.candidateName,
    data.interviewDate,
    data.interviewerName,
    data.hrEmail,
    data.usecaseUnderstandingScore1,
    data.usecaseUnderstandingScore2,
    data.usecaseUnderstandingScore3,
    data.usecaseUnderstandingScore4,
    data.usecaseUnderstandingRating,
    data.usecaseUnderstandingJustification,
    data.usecaseUnderstandingImprovements,
    data.technicalDesignScore1,
    data.technicalDesignScore2,
    data.technicalDesignScore3,
    data.technicalDesignRating,
    data.technicalDesignJustification,
    data.technicalDesignImprovements,
    data.solutionImplementationScore1,
    data.solutionImplementationScore2,
    data.solutionImplementationScore3,
    data.solutionImplementationRating,
    data.solutionImplementationJustification,
    data.solutionImplementationImprovements,
    data.troubleshootingScore1,
    data.troubleshootingScore2,
    data.troubleshootingScore3,
    data.troubleshootingRating,
    data.troubleshootingJustification,
    data.troubleshootingImprovements,
    data.walkthroughScore1,
    data.walkthroughScore2,
    data.walkthroughScore3,
    data.walkthroughScore4,
    data.walkthroughRating,
    data.walkthroughJustification,
    data.walkthroughImprovements,
    data.detailedFeedback,
    data.result,
  ];

  try {
    // Execute the query to insert feedback data into the database
    await pool.query(query, values);

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error inserting feedback data:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error submitting feedback" });
  }
});

app.post("/api/feedback-form-db", async (req, res) => {
  const {
    candidate_email,
    rrf_id,
    position,
    candidate_name,
    uan_number,
    interview_date,
    hr_email,
    introduction_value_momentum,
    introduction_cloud_app,
    roles_responsibilities,
    pre_screening,
    status,
    summary,
    ec_select,
    cloud_experience_azure_experience,
    cloud_experience_azure_well_architected_framework,
    cloud_experience_azure_zero_trust_security,
    cloud_experience_aws_experience,
    cloud_experience_aws_well_architected_framework,
    cloud_experience_aws_zero_trust_security,
    migration_experience_as_is_migration,
    migration_experience_paas_migration,
    migration_experience_database_migration,
    presales_experience_proposals_worked,
    presales_experience_proposals_worked_end_to_end,
    presales_experience_efforts_calculations,
    presales_experience_efforts_calculations_end_to_end,
    devops_experience_devops_maturity_model,
    devops_experience_dora_metrics,
    devops_experience_build_release_solutioning,
    devops_experience_devops_maturity_model_projects,
    devops_experience_dora_metrics_projects,
    devops_experience_build_release_solutioning_projects,
    observability_experience_observability_knowledge,
    observability_experience_observability_knowledge_projects,
    containerization_experience_containerization_knowledge,
    containerization_experience_containerization_knowledge_projects,
    java_experience_java_experience,
    java_experience_java8_experience,
    java_experience_concurrency_experience,
    java_experience_microservice_experience,
    java_experience_distributed_transactions_experience,
    java_experience_event_driven_experience,
    java_experience_security_experience,
    java_experience_design_patterns_experience,
    java_experience_data_structures_experience,
    java_experience_spring_boot_experience_details,
    java_experience_sql_queries_experience,
    java_experience_jvm_tuning_experience,
    feedback,
  } = req.body;

  // Check if the necessary fields are provided
  if (
    !candidate_email ||
    !rrf_id ||
    !candidate_name ||
    !position ||
    !interview_date ||
    !hr_email
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Insert feedback data into the database
    await pool.query(
      `
      INSERT INTO prescreening_form (
        candidate_email, rrf_id, position, candidate_name, uan_number, interview_date,
        hr_email, introduction_value_momentum, introduction_cloud_app, roles_responsibilities,
        pre_screening, status, summary, ec_select, cloud_experience_azure_experience, 
        cloud_experience_azure_well_architected_framework, cloud_experience_azure_zero_trust_security, 
        cloud_experience_aws_experience, cloud_experience_aws_well_architected_framework, 
        cloud_experience_aws_zero_trust_security, migration_experience_as_is_migration, 
        migration_experience_paas_migration, migration_experience_database_migration, 
        presales_experience_proposals_worked, presales_experience_proposals_worked_end_to_end, 
        presales_experience_efforts_calculations, presales_experience_efforts_calculations_end_to_end, 
        devops_experience_devops_maturity_model, devops_experience_dora_metrics, 
        devops_experience_build_release_solutioning, devops_experience_devops_maturity_model_projects, 
        devops_experience_dora_metrics_projects, devops_experience_build_release_solutioning_projects, 
        observability_experience_observability_knowledge, 
        observability_experience_observability_knowledge_projects, 
        containerization_experience_containerization_knowledge, 
        containerization_experience_containerization_knowledge_projects, 
        java_experience_java_experience, java_experience_java8_experience, 
        java_experience_concurrency_experience, java_experience_microservice_experience, 
        java_experience_distributed_transactions_experience, java_experience_event_driven_experience, 
        java_experience_security_experience, java_experience_design_patterns_experience, 
        java_experience_data_structures_experience, java_experience_spring_boot_experience_details, 
        java_experience_sql_queries_experience, java_experience_jvm_tuning_experience, feedback
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, 
        $42, $43, $44, $45, $46, $47, $48, $49, $50
      )
    `,
      [
        candidate_email,
        rrf_id,
        position,
        candidate_name,
        uan_number,
        interview_date,
        hr_email,
        introduction_value_momentum,
        introduction_cloud_app,
        roles_responsibilities,
        pre_screening,
        status,
        summary,
        ec_select,
        cloud_experience_azure_experience,
        cloud_experience_azure_well_architected_framework,
        cloud_experience_azure_zero_trust_security,
        cloud_experience_aws_experience,
        cloud_experience_aws_well_architected_framework,
        cloud_experience_aws_zero_trust_security,
        migration_experience_as_is_migration,
        migration_experience_paas_migration,
        migration_experience_database_migration,
        presales_experience_proposals_worked,
        presales_experience_proposals_worked_end_to_end,
        presales_experience_efforts_calculations,
        presales_experience_efforts_calculations_end_to_end,
        devops_experience_devops_maturity_model,
        devops_experience_dora_metrics,
        devops_experience_build_release_solutioning,
        devops_experience_devops_maturity_model_projects,
        devops_experience_dora_metrics_projects,
        devops_experience_build_release_solutioning_projects,
        observability_experience_observability_knowledge,
        observability_experience_observability_knowledge_projects,
        containerization_experience_containerization_knowledge,
        containerization_experience_containerization_knowledge_projects,
        java_experience_java_experience,
        java_experience_java8_experience,
        java_experience_concurrency_experience,
        java_experience_microservice_experience,
        java_experience_distributed_transactions_experience,
        java_experience_event_driven_experience,
        java_experience_security_experience,
        java_experience_design_patterns_experience,
        java_experience_data_structures_experience,
        java_experience_spring_boot_experience_details,
        java_experience_sql_queries_experience,
        java_experience_jvm_tuning_experience,
        feedback,
      ]
    );

    return res
      .status(200)
      .json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("Error processing feedback submission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/getAllCandidateEmails", async (req, res) => {
  try {
    // Query to fetch all emails where the prescreening_status is 'Shortlisted'
    const query = `
      SELECT candidate_email
      FROM candidate_info
      WHERE prescreening_status = 'Shortlisted';
    `;

    // Execute the query
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      // Return the list of emails in the response
      const emails = result.rows.map((row) => row.candidate_email);
      return res.json({ emails });
    } else {
      return res.status(404).json({ error: "No shortlisted candidates found" });
    }
  } catch (error) {
    console.error("Error fetching candidate emails:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

// panel call
// app.get('/api/panel-candidates-info', async (req, res) => {
//   try {
//     const { l_2_interviewdate, userEmail } = req.query;

//     const query = `
//       SELECT candidate_name, candidate_email, role, recruitment_phase, resume, l_2_interviewdate, imocha_report, meeting_link, l_2_interviewtime
//       FROM candidate_info
//       WHERE prescreening_status = 'Shortlisted'
//         AND recruitment_phase = 'L2 Scheduled'
//         AND l_2_interviewdate = $1
//         AND panel_name = $2;`;  // Add the condition to check for panel_name containing the user's email

//     // Use the '%' wildcard to match any occurrence of the userEmail in the panel_name field
//     const result = await pool.query(query, [l_2_interviewdate, userEmail]);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching shortlisted candidates:', error);
//     res.status(500).send('Server error');
//   }
// });

app.get("/api/panel-candidates-info", async (req, res) => {
  try {
    const { l_2_interviewdate, userEmail } = req.query;

    // Define the recruitment phases you want to include
    const recruitmentPhases = [
      "L2 Technical Round Scheduled",
      "Shortlisted in L2",
      "Client Fitment Round Scheduled",
      "Shortlisted in Client Fitment Round",
      "Project Fitment Round Scheduled",
      "Shortlisted in Project Fitment Round",
      "Fitment Round Scheduled",
      "Shortlisted in Fitment Round",
      "EC Fitment Round Scheduled",
      "Shortlisted in EC Fitment Round",
    ];

    const query = `
      SELECT candidate_name, candidate_email, role, recruitment_phase, resume, l_2_interviewdate, 
             imocha_report, meeting_link, l_2_interviewtime
      FROM candidate_info
      WHERE prescreening_status = 'Shortlisted'
        AND recruitment_phase = ANY($1)  -- Matching against any of the provided recruitment phases
        AND l_2_interviewdate = $2
         AND panel_name ILIKE $3;`;

    const result = await pool.query(query, [
      recruitmentPhases,
      l_2_interviewdate,
      userEmail,
    ]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching shortlisted candidates:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/hr-candidates-info", async (req, res) => {
  try {
    const { l_2_interviewdate, hr_email } = req.query;

    // Updated SQL query to also check for hr_email
    const query = `
      SELECT candidate_name, candidate_email, role, recruitment_phase, resume, l_2_interviewdate, imocha_report, meeting_link, l_2_interviewtime
      FROM candidate_info 
      WHERE prescreening_status = 'Shortlisted' 
        AND recruitment_phase = 'L2 Scheduled' 
        AND l_2_interviewdate = $1
        AND hr_email = $2;`;

    // Pass both l_2_interviewdate and hr_email to the query
    const result = await pool.query(query, [l_2_interviewdate, hr_email]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching shortlisted candidates:", error);
    res.status(500).send("Server error");
  }
});
//l2 update
// Example Express.js route to update candidate status, panel, and date/time
// const fetch = require('node-fetch');

app.put("/api/update-status", async (req, res) => {
  const { email, status, panel, dateTime, meetingLink } = req.body; // Accept meetingLink from frontend

  try {
    const updateQuery = `
      UPDATE candidate_info
      SET recruitment_phase = $1, meeting_link = $2, l_2_interviewdate = $3, l_2_interviewtime = $4,panel_name=$5
      WHERE candidate_email = $6;
    `;

    await pool.query(updateQuery, [
      status,
      meetingLink, // Use meetingLink from frontend
      dateTime.split("T")[0],
      dateTime.split("T")[1].split(".")[0],
      panel,
      email,
    ]);

    res.status(200).json({
      message: "Interview scheduled successfully.",
      meetingLink,
    });
  } catch (error) {
    console.error("Error updating status:", error.message);
    res
      .status(500)
      .json({
        message: "Failed to update candidate status",
        error: error.message,
      });
  }
});
app.get("/api/candidate-total-by-team", async (req, res) => {
  try {
    // Extract ECs from query parameters
    const { ecs } = req.query;
    // Validate input
    if (!ecs) {
      return res
        .status(400)
        .json({ error: "Please provide ECs as a query parameter." });
    }
    // Split the provided ECs into an array
    const ecList = ecs.split(",").map((ec) => ec.trim());
    // Query to fetch the count of candidates for the specified ECs
    const query = `
      SELECT eng_center, COUNT(*) AS total_count
      FROM candidate_info
      WHERE eng_center = ANY($1) AND visible = TRUE
      GROUP BY eng_center;
    `;

    // Execute the query with a timeout
    const result = await Promise.race([
      pool.query(query, [ecList]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query Timeout")), 59000)
      ),
    ]);
    // Transform the result into a key-value object
    const countsByTeam = result.rows.reduce((acc, row) => {
      acc[row.eng_center] = row.total_count;
      return acc;
    }, {});
    res.json(countsByTeam);
  } catch (error) {
    console.error("Error fetching total count by team:", error.message);
    res.status(500).json({
      error: error.message.includes("Query Timeout")
        ? "Database query timed out"
        : "Internal Server Error",
    });
  }
});

//hr names
app.get("/api/hr-names", async (req, res) => {
  try {
    // Query to fetch HR names from the hr_details table
    const result = await pool.query(`
      SELECT hr_name 
      FROM hr_details;
    `);

    // Extract the HR names from the query result
    const hrNames = result.rows.map((row) => row.hr_name);

    // Respond with the HR names in JSON format
    res.json({ success: true, hrNames });
  } catch (error) {
    console.error("Error fetching HR names:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching HR names" });
  }
});

//hr counts
app.get("/api/hr-phases", async (req, res) => {
  const hrName = req.query.hrName; // Get the HR name from query parameters
  if (!hrName) {
    return res
      .status(400)
      .json({ success: false, error: "HR name is required" });
  }

  try {
    const query = `
      SELECT 
        candidates_recruitment_phase, 
        COUNT(*) AS phase_count
      FROM hr_details
      WHERE hr_name = $1
      GROUP BY candidates_recruitment_phase
    `;
    const result = await pool.query(query, [hrName]);

    // Transform data into a response object
    const data = result.rows.reduce((acc, row) => {
      acc[row.candidates_recruitment_phase] = parseInt(row.phase_count, 10);
      return acc;
    }, {});

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Candidates phases:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "An error occurred while fetching Candidates phases",
      });
  }
});

//phase count
app.get("/api/phase-counts", async (req, res) => {
  try {
    const query = `
      -- Fetch Prescreening count from candidate_info
    SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'Prescreening' AS phase,
    COUNT(*) AS phase_count
FROM 
    candidate_info
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR')

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'Move to L1' AS phase,
    COUNT(*) AS phase_count
FROM 
    candidate_info
WHERE 
    Prescreening_status = 'Shortlisted'
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR')

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'Rejected' AS phase,
    COUNT(*) AS phase_count
FROM 
    candidate_info
WHERE 
    Prescreening_status = 'Rejected'
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR')

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    round_details AS phase,
    COUNT(*) AS phase_count
FROM 
    feedbackform
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR'), round_details

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'L2 Technical Round' AS phase,
    COUNT(*) AS phase_count
FROM 
    feedback_table
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR')

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'L2 Technical Round' AS phase,
    COUNT(*) AS phase_count
FROM 
    app_java_l2_feedback_response
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR')

UNION ALL

SELECT 
    COALESCE(TRIM(hr_email), 'Unknown HR') AS hr_email,
    'L2 Technical Round' AS phase,
    COUNT(*) AS phase_count
FROM 
    app_dotnet_l2_feedback_response
GROUP BY 
    COALESCE(TRIM(hr_email), 'Unknown HR');

    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch phase counts" });
  }
});


//admin details

app.post("/api/add-admin", async (req, res) => {
  const { vamid, name, email, ec_mapping, status } = req.body;

  // Check for required fields including status
  if (!vamid || !name || !email || !ec_mapping || !status) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
  }

  try {
    const query = `
      INSERT INTO admin_table (vamid, name, email, ec_mapping, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (vamid) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email, ec_mapping = EXCLUDED.ec_mapping, status = EXCLUDED.status;
    `;
    const values = [vamid, name, email, ec_mapping, status]; // Add status to values array
    await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: "User added/updated successfully!",
    });
  } catch (error) {
    console.error("Error adding user:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding the user.",
    });
  }
});

app.get("/api/admin-details", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vamid, email, name, ec_mapping, status
      FROM admin_table
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Format the data for the frontend
    const formattedData = result.rows.map((row) => {
      // Split ec_mapping by commas and trim any extra spaces
      const ecMapping = row.ec_mapping
        ? row.ec_mapping.split(",").map((item) => item.trim())
        : [];

      return {
        vamid: row.vamid,
        email: row.email,
        name: row.name,
        cloudEC: ecMapping.includes("Cloud EC"), // Check if Cloud EC exists in ec_mapping
        appEC: ecMapping.includes("App EC"), // Check if App EC exists in ec_mapping
        dataEC: ecMapping.includes("Data EC"), // Check if Data EC exists in ec_mapping
        coreEC: ecMapping.includes("Core EC"), // Check if Core EC exists in ec_mapping
        status: row.status,
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching admin details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/update-ec-mapping", async (req, res) => {
  const { selectedAdmins } = req.body;

  if (!selectedAdmins || selectedAdmins.length === 0) {
    return res.status(400).json({ message: "No admin selections provided" });
  }

  try {
    // Iterate over each selected admin and update EC mappings and status
    for (const admin of selectedAdmins) {
      const { vamid, ec_mapping, status } = admin;

      if (!vamid || !ec_mapping || !status) {
        continue; // Skip this admin if there's missing data
      }

      // Check if the record exists in the admin_table
      const result = await pool.query(
        "SELECT * FROM admin_table WHERE vamid = $1",
        [vamid]
      );

      if (result.rows.length === 0) {
        // Insert a new record if no matching vamid is found
        await pool.query(
          `
          INSERT INTO admin_table (vamid, ec_mapping, status)
          VALUES ($1, $2, $3)
        `,
          [vamid, ec_mapping, status]
        );
      } else {
        // Update the existing record with the new EC mappings and status
        await pool.query(
          `
          UPDATE admin_table
          SET ec_mapping = $1, status = $2
          WHERE vamid = $3
        `,
          [ec_mapping, status, vamid]
        );
      }
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "EC mappings and status updated successfully!",
      });
  } catch (error) {
    console.error("Error updating EC mappings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/get-panel-emails", async (req, res) => {
  try {
    const { domain } = req.query; // Get domain from query parameters

    if (!domain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    // Query the database for emails based on the domain
    const result = await pool.query(
      `
      SELECT email
      FROM panel_details
      WHERE account = $1
    `,
      [domain]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No emails found for the selected domain" });
    }

    // Extract emails from the result
    const emails = result.rows.map((row) => row.email);

    res.status(200).json(emails);
  } catch (error) {
    console.error("Error fetching panel emails:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function addVisibilityColumn() {
  try {
    await pool.query(
      `ALTER TABLE candidate_info ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;`
    );
    await pool.query(
      `ALTER TABLE rrf_details ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;`
    );
    await pool.query(
      `ALTER TABLE imocha_results ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;`
    );
    console.log("Visibility column added successfully in all tables.");
  } catch (error) {
    console.error("Error adding visibility column:", error);
  }
}
addVisibilityColumn();

// Function to get predefined date ranges
function getDateRange(filterType) {
  const currentDate = new Date();
  let startDate, endDate;

  if (filterType === "24_hours") {
    startDate = new Date();
    startDate.setDate(currentDate.getDate() - 1);
    endDate = currentDate;
  } else if (filterType === "last_week") {
    startDate = new Date();
    startDate.setDate(currentDate.getDate() - 7);
    endDate = currentDate;
  } else if (filterType === "last_15_days") {
    startDate = new Date();
    startDate.setDate(currentDate.getDate() - 15);
    endDate = currentDate;
  } else {
    return null;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// API to update visibility in candidate_info, rrf_details, and imocha_results
app.post("/api/update-visibility", async (req, res) => {
  const { filterType, startDate, endDate } = req.body;

  if (!filterType) {
    return res.status(400).json({ error: "Filter type is required." });
  }

  try {
    // Hide all records before applying the filter
    await pool.query(`UPDATE candidate_info SET visible = FALSE;`);
    await pool.query(`UPDATE rrf_details SET visible = FALSE;`);
    await pool.query(`UPDATE imocha_results SET visible = FALSE;`);

    if (filterType === "custom_range" && startDate && endDate) {
      // Update visibility for a custom date range
      await pool.query(
        `UPDATE candidate_info SET visible = TRUE WHERE date BETWEEN $1 AND $2;`,
        [startDate, endDate]
      );

      await pool.query(
        `UPDATE rrf_details SET visible = TRUE WHERE rrf_startdate BETWEEN $1 AND $2;`,
        [startDate, endDate]
      );

      await pool.query(
        `UPDATE imocha_results SET visible = TRUE WHERE attempted_date BETWEEN $1 AND $2;`,
        [startDate, endDate]
      );
    } else {
      // Use predefined date range logic
      const dateRange = getDateRange(filterType);
      if (dateRange) {
        await pool.query(
          `UPDATE candidate_info SET visible = TRUE WHERE date BETWEEN $1 AND $2;`,
          [dateRange.startDate, dateRange.endDate]
        );

        await pool.query(
          `UPDATE rrf_details SET visible = TRUE WHERE rrf_startdate BETWEEN $1 AND $2;`,
          [dateRange.startDate, dateRange.endDate]
        );

        await pool.query(
          `UPDATE imocha_results SET visible = TRUE WHERE attempted_date BETWEEN $1 AND $2;`,
          [dateRange.startDate, dateRange.endDate]
        );
      }
    }

    res
      .status(200)
      .json({ message: `Records updated for filter: ${filterType}` });
  } catch (error) {
    console.error("Error updating visibility:", error);
    res.status(500).json({ error: "Failed to update visibility." });
  }
});

app.get("/api/shortlisted-count", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS shortlisted_count FROM candidate_info WHERE prescreening_status = 'Shortlisted'"
    );

    res.json({ inviteCount: result.rows[0].shortlisted_count });
  } catch (error) {
    console.error("Error fetching shortlisted count:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/available-score-count", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS available_score_count FROM candidate_info WHERE l_1_score IS NOT NULL"
    );

    res.json({ availableScoreCount: result.rows[0].available_score_count });
  } catch (error) {
    console.error("Error fetching available score count:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/saveRounds", async (req, res) => {
  const { rounds } = req.body;

  if (!rounds || rounds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No rounds provided" });
  }

  try {
    let newRounds = [];
    let hasFitment = false;

    for (const round of rounds) {
      const { rrf_id, recruitment_rounds } = round;

      if (recruitment_rounds.toLowerCase() === "fitment round") {
        hasFitment = true; // Mark fitment round presence
        continue; // Skip adding it for now
      }

      // Check if the round already exists
      const checkQuery =
        "SELECT COUNT(*) FROM rrf_rounds WHERE rrf_id = $1 AND recruitment_rounds = $2";
      const { rows } = await pool.query(checkQuery, [
        rrf_id,
        recruitment_rounds,
      ]);

      if (parseInt(rows[0].count) === 0) {
        newRounds.push(round);
      }
    }

    if (newRounds.length > 0) {
      // Get current rounds (excluding "Fitment Round") for order calculation
      const orderQuery = `
        SELECT recruitment_rounds, round_order 
        FROM rrf_rounds WHERE rrf_id = $1 
        AND LOWER(recruitment_rounds) != 'fitment round' 
        ORDER BY round_order ASC
      `;
      const orderResult = await pool.query(orderQuery, [newRounds[0].rrf_id]);
      let currentMaxOrder = orderResult.rows.length; // Get the count of non-fitment rounds

      // Insert new rounds
      const insertQuery = `
        INSERT INTO rrf_rounds (rrf_id, recruitment_rounds, round_order) 
        VALUES ${newRounds
          .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
          .join(", ")}
      `;

      const values = newRounds.flatMap((round) => {
        currentMaxOrder += 1; // Increment order number
        return [round.rrf_id, round.recruitment_rounds, currentMaxOrder];
      });

      await pool.query(insertQuery, values);
    }

    // Ensure "Fitment Round" is always last
    if (hasFitment) {
      // Remove existing Fitment Round if present
      await pool.query(
        "DELETE FROM rrf_rounds WHERE rrf_id = $1 AND LOWER(recruitment_rounds) = 'fitment round'",
        [rounds[0].rrf_id]
      );

      // Reinsert Fitment Round as the last round
      const finalOrderQuery =
        "SELECT COUNT(*) AS total FROM rrf_rounds WHERE rrf_id = $1";
      const finalOrderResult = await pool.query(finalOrderQuery, [
        rounds[0].rrf_id,
      ]);
      const lastOrder = parseInt(finalOrderResult.rows[0].total) + 1; // Next available order

      await pool.query(
        "INSERT INTO rrf_rounds (rrf_id, recruitment_rounds, round_order) VALUES ($1, $2, $3)",
        [rounds[0].rrf_id, "Fitment Round", lastOrder]
      );
    }

    res.json({ success: true, message: "Rounds added successfully" });
  } catch (error) {
    console.error("Error saving rounds:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

app.get("/api/getRounds", async (req, res) => {
  const { rrf_id } = req.query;

  if (!rrf_id) {
    return res.status(400).json({ success: false, message: "Missing rrf_id" });
  }

  try {
    const query =
      "SELECT recruitment_rounds, round_order FROM rrf_rounds WHERE rrf_id = $1 ORDER BY round_order";
    const { rows } = await pool.query(query, [rrf_id]);

    res.json({ success: true, rounds: rows });
  } catch (error) {
    console.error("Error fetching rounds:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});
app.get("/api/get-next-round", async (req, res) => {
  try {
    const { rrf_id, recruitment_phase } = req.query;

    if (!rrf_id || !recruitment_phase) {
      return res
        .status(400)
        .json({ error: "Missing rrf_id or recruitment_phase" });
    }

    // If candidate is "Shortlisted in L2", treat it as "L2 Technical" completed
    const currentPhase =
      recruitment_phase === "Shortlisted in L2"
        ? "L2 Technical"
        : recruitment_phase === "Shortlisted in EC Fitment Round"
        ? "EC Fitment"
        : recruitment_phase === "Shortlisted in Project Fitment Round"
        ? "Project Fitment"
        : recruitment_phase === "Shortlisted in Client Fitment Round"
        ? "Client Fitment"
        : recruitment_phase === "Shortlisted in Client"
        ? "Client"
        : recruitment_phase;

    // Fetch all rounds for the given rrf_id ordered by round_order
    const roundsQuery = `
      SELECT recruitment_rounds, round_order
      FROM rrf_rounds
      WHERE rrf_id = $1
      ORDER BY round_order ASC
    `;

    const roundsResult = await pool.query(roundsQuery, [rrf_id]);
    const rounds = roundsResult.rows;

    if (rounds.length === 0) {
      return res.status(404).json({ error: "No rounds found for this RRF ID" });
    }

    // Find the index of the current round
    const currentRoundIndex = rounds.findIndex(
      (round) => round.recruitment_rounds === currentPhase
    );

    // If there's a next round, return it
    if (currentRoundIndex !== -1 && currentRoundIndex + 1 < rounds.length) {
      return res.json({
        nextRound: rounds[currentRoundIndex + 1].recruitment_rounds,
      });
    }

    res.json({ nextRound: null }); // No next round found
  } catch (error) {
    console.error("Error fetching next round:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//submit feedback for feedback form
app.get("/api/get-feedbackform", async (req, res) => {
  try {
    const { candidateEmail, roundDetails } = req.query;

    if (!candidateEmail || !roundDetails) {
      return res
        .status(400)
        .json({ error: "candidateEmail and roundDetails are required" });
    }

    const query = `
      SELECT * FROM feedbackform
      WHERE candidate_email = $1 AND round_details = $2;
    `;

    const result = await pool.query(query, [candidateEmail, roundDetails]);

    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    } else {
      return res.status(404).json({ error: "No feedback found" });
    }
  } catch (error) {
    console.error("Error fetching feedback form:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

//submit feedback for feedback form
app.post("/api/submitFeedback", async (req, res) => {
  let { formData, roundDetails } = req.body;

  if (!formData || !roundDetails) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all the fields" });
  }

  // Clean up roundDetails
  roundDetails = roundDetails.replace("Scheduled", "").trim();
  const candidateEmail = formData.candidateEmail;

  const checkQuery = `
    SELECT * FROM feedbackform
    WHERE candidate_email = $1 AND round_details = $2;
  `;
  const checkValues = [candidateEmail, roundDetails];

  try {
    const existingFeedback = await pool.query(checkQuery, checkValues);

    // -------------------- UPDATE FLOW --------------------
    if (existingFeedback.rows.length > 0) {
      const updateQuery = `
        UPDATE feedbackform 
        SET 
            imocha_score = $1,
            rrf_id = $2,
            position = $3,
            candidate_name = $4,
            interview_date = $5,
            interviewer_name = $6,
            hr_email = $7,
            detailed_feedback = $8,
            result = $9,
            submitted_at = NOW(),
            organizational_fitment = $10,
            customer_communication = $11,
            continuous_learning = $12,
            attitude_personality = $13,
            communication_skills = $14,
            project_fitment = $15
        WHERE candidate_email = $16 AND round_details = $17
        RETURNING *;
      `;

      const updateValues = [
        formData.imochaScore,
        formData.rrfId,
        formData.position,
        formData.candidateName,
        formData.interviewDate,
        formData.interviewerName,
        formData.hrEmail,
        formData.detailedFeedback,
        formData.result,
        formData.organizationalFitment,
        formData.customerCommunication,
        formData.continuousLearning,
        formData.attitudePersonality,
        formData.communicationSkills,
        formData.projectFitment,
        candidateEmail,
        roundDetails
      ];

      const updateResult = await pool.query(updateQuery, updateValues);

      const feedbackResult = formData.result;
      let recruitmentPhase = "";

      if (feedbackResult === "Recommended") {
        recruitmentPhase = `Shortlisted in ${roundDetails}`;
      } else if (feedbackResult === "Rejected") {
        recruitmentPhase = `Rejected in ${roundDetails}`;
      }

      if (recruitmentPhase) {
        const updateCandidateQuery = `
          UPDATE candidate_info 
          SET recruitment_phase = $1
          WHERE candidate_email = $2
        `;
        const updateCandidateValues = [recruitmentPhase, candidateEmail];
        await pool.query(updateCandidateQuery, updateCandidateValues);
      }

      return res.status(200).json({
        success: true,
        message: "Feedback updated successfully",
        data: updateResult.rows[0],
      });
    }

    // -------------------- INSERT FLOW --------------------
    const insertQuery = `
      INSERT INTO feedbackform 
        (round_details, candidate_email, imocha_score, rrf_id, position, candidate_name, interview_date, 
         interviewer_name, hr_email, detailed_feedback, result, submitted_at,
         organizational_fitment, customer_communication, continuous_learning,
         attitude_personality, communication_skills, project_fitment)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(),
         $12, $13, $14, $15, $16, $17) 
      RETURNING *;
    `;

    const insertValues = [
      roundDetails,
      candidateEmail,
      formData.imochaScore,
      formData.rrfId,
      formData.position,
      formData.candidateName,
      formData.interviewDate,
      formData.interviewerName,
      formData.hrEmail,
      formData.detailedFeedback,
      formData.result,
      formData.organizationalFitment,
      formData.customerCommunication,
      formData.continuousLearning,
      formData.attitudePersonality,
      formData.communicationSkills,
      formData.projectFitment
    ];

    const insertResult = await pool.query(insertQuery, insertValues);

    const feedbackResult = formData.result;
    let recruitmentPhase = "";

    if (feedbackResult === "Recommended") {
      recruitmentPhase = `Shortlisted in ${roundDetails}`;
    } else if (feedbackResult === "Rejected") {
      recruitmentPhase = `Rejected in ${roundDetails}`;
    }

    if (recruitmentPhase) {
      const updateCandidateQuery = `
        UPDATE candidate_info 
        SET recruitment_phase = $1
        WHERE candidate_email = $2
      `;
      const updateCandidateValues = [recruitmentPhase, candidateEmail];
      await pool.query(updateCandidateQuery, updateCandidateValues);
    }

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      data: insertResult.rows[0],
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ success: false, message: "Error submitting feedback" });
  }
});


app.get("/api/feedback-for-panel-member", async (req, res) => {
  try {
    const { interview_date, userEmail } = req.query;

    const query = `
      SELECT candidate_email, candidate_name, interview_date, interviewer_name, 
             detailed_feedback, result, submitted_at, round_details, position
      FROM feedbackform
      WHERE interview_date = $1
       AND interviewer_name ILIKE $2;
    `;

    const result = await pool.query(query, [interview_date, userEmail]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).send("Server error");
  }
});
app.get("/api/feedback-table", async (req, res) => {
  try {
    const { interview_date, userEmail } = req.query;
    console.log("Received request with:", { interview_date, userEmail });

    if (!interview_date || !userEmail) {
      console.log("Missing date or userEmail");
      return res.status(400).json({ error: "Date and userEmail are required" });
    }

    // Query from feedback_table
    const feedbackTableQuery = `
      SELECT candidate_name, candidate_email, position, hr_email, result, interview_date
      FROM feedback_table
      WHERE interview_date = $1
        AND interviewer_name = $2;
    `;
    const feedbackTableResult = await pool.query(feedbackTableQuery, [
      interview_date,
      userEmail,
    ]);

    // Query from app_dotnet_l2_feedback_response
// Dotnet query
const dotnetQuery = `
  SELECT 
    f.candidate_email,
    c.candidate_name,
    c.role AS position,
    f.result,
    f.updated_at AS interview_date
  FROM app_dotnet_l2_feedback_response f
  LEFT JOIN candidate_info c ON f.candidate_email = c.candidate_email
  WHERE DATE(f.updated_at) = $1
    AND f.interviewer_name ILIKE $2;
`;

const dotnetResult = await pool.query(dotnetQuery, [interview_date, userEmail]);

// Java query
const javaQuery = `
  SELECT 
    f.candidate_email,
    c.candidate_name,
    c.role AS position,
    f.result,
    f.updated_at AS interview_date
  FROM app_java_l2_feedback_response f
  LEFT JOIN candidate_info c ON f.candidate_email = c.candidate_email
  WHERE DATE(f.updated_at) = $1
   AND f.interviewer_name ILIKE $2;
`;

const javaResult = await pool.query(javaQuery, [interview_date, userEmail]);


    // Combine all results
    const allFeedbacks = [
      ...feedbackTableResult.rows,
      ...dotnetResult.rows,
      ...javaResult.rows,
    ];

    if (allFeedbacks.length === 0) {
      console.log("No records found for given date and userEmail");
      return res.status(404).json({ message: "No feedback records found" });
    }

    res.json(allFeedbacks);
  } catch (error) {
    console.error("Error fetching feedback table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/data-feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM data_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API to save data feedback responses
app.post("/api/data-submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  console.log("Received payload:", { candidateEmail, responses });

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    console.error("Invalid request payload:", req.body);
    return res
      .status(400)
      .json({ error: "Invalid request payload. candidateEmail is required." });
  }

  const client = await pool.connect();
  try {
    // Fetch candidateId using candidateEmail
    const candidateQuery = `
      SELECT id FROM candidate_info WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [
      candidateEmail,
    ]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateId = candidateResult.rows[0].id;
    console.log("Fetched candidateId:", candidateId);

    await client.query("BEGIN");

    // Save all responses as a single JSON object
    const query = `
      INSERT INTO data_l2_feedback_response (
        candidate_id, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await client.query(query, [
      candidateId,
      JSON.stringify(responses), // Serialize responses as JSON
      detailedFeedback,
      result,
    ]);

    await client.query("COMMIT");
    console.log("Feedback saved successfully for candidateId:", candidateId);
    res.json({ success: true, message: "Feedback saved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  } finally {
    client.release();
  }
});

app.get("/api/feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API to save feedback responses
app.post("/api/submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  console.log("Received payload:", { candidateEmail, responses });

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    console.error("Invalid request payload:", req.body);
    return res
      .status(400)
      .json({ error: "Invalid request payload. candidateEmail is required." });
  }

  const client = await pool.connect();
  try {
    // Fetch candidateId using candidateEmail
    const candidateQuery = `
      SELECT id FROM candidate_info WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [
      candidateEmail,
    ]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateId = candidateResult.rows[0].id;
    console.log("Fetched candidateId:", candidateId);

    await client.query("BEGIN");

    // Save all responses as a single JSON object
    const query = `
      INSERT INTO app_l2_feedback_response (
        candidate_id, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await client.query(query, [
      candidateId,
      JSON.stringify(responses), // Serialize responses as JSON
      detailedFeedback,
      result,
    ]);

    await client.query("COMMIT");
    console.log("Feedback saved successfully for candidateId:", candidateId);
    res.json({ success: true, message: "Feedback saved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  } finally {
    client.release();
  }
});
app.post("/api/get-ec-select", async (req, res) => {
  const { candidateEmail } = req.body;

  if (!candidateEmail) {
    return res.status(400).json({ error: "Candidate email is required." });
  }

  try {
    const query = `
          SELECT ec_select, position
          FROM prescreening_form
          WHERE candidate_email = $1;
      `;
    const result = await pool.query(query, [candidateEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    res.json({
      ec_select: result.rows[0].ec_select,
      position: result.rows[0].position,
    });
  } catch (error) {
    console.error("Error fetching ec_select and position:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post('/api/get-engcenter-select', async (req, res) => {
  const { candidateEmail } = req.body;

  if (!candidateEmail) {
      return res.status(400).json({ error: "Candidate email is required." });
  }

  try {
      const query = `
          SELECT eng_center, role
          FROM candidate_info
          WHERE candidate_email = $1;
      `;
      const result = await pool.query(query, [candidateEmail]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Candidate not found." });
      }

      res.json({
        eng_center: result.rows[0].eng_center,
        role: result.rows[0].role
      });
  } catch (error) {
      console.error("Error fetching eng_center and role:", error);
      res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/data-feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM data_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API to save data feedback responses
app.post("/api/data-submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  console.log("Received payload:", { candidateEmail, responses });

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    console.error("Invalid request payload:", req.body);
    return res
      .status(400)
      .json({ error: "Invalid request payload. candidateEmail is required." });
  }

  const client = await pool.connect();
  try {
    // Fetch candidateId using candidateEmail
    const candidateQuery = `
      SELECT id FROM candidate_info WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [
      candidateEmail,
    ]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateId = candidateResult.rows[0].id;
    console.log("Fetched candidateId:", candidateId);

    await client.query("BEGIN");

    // Save all responses as a single JSON object
    const query = `
      INSERT INTO data_l2_feedback_response (
        candidate_id, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await client.query(query, [
      candidateId,
      JSON.stringify(responses), // Serialize responses as JSON
      detailedFeedback,
      result,
    ]);

    await client.query("COMMIT");
    console.log("Feedback saved successfully for candidateId:", candidateId);
    res.json({ success: true, message: "Feedback saved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  } finally {
    client.release();
  }
});

app.get("/api/java_feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_java_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API to save feedback responses
app.post("/api/java_submit-feedback", async (req, res) => {    
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  console.log("Received payload:", { candidateEmail, responses });

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    console.error("Invalid request payload:", req.body);
    return res
      .status(400)
      .json({ error: "Invalid request payload. candidateEmail is required." });
  }

  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query("BEGIN");

    // Fetch candidate info using candidateEmail
    const candidateQuery = `
      SELECT id, hr_email, panel_name 
      FROM candidate_info 
      WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateRow = candidateResult.rows[0];
    const candidateId = candidateRow.id;
    const hrEmail = candidateRow.hr_email;
    const panelName = candidateRow.panel_name;

    console.log("Fetched candidateId:", candidateId);
    console.log("Fetched panelName:", panelName);
    console.log("Fetched hrEmail:", hrEmail);

    // Save feedback
    const feedbackQuery = `
      INSERT INTO app_java_l2_feedback_response (
        candidate_id, hr_email, candidate_email, interviewer_name, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        interviewer_name = EXCLUDED.interviewer_name,
        hr_email = EXCLUDED.hr_email,
        candidate_email = EXCLUDED.candidate_email,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await client.query(feedbackQuery, [
      candidateId,                // ✅ candidate_id
      hrEmail,                    // ✅ hr_email
      candidateEmail,             // ✅ candidate_email
      panelName,                  // ✅ interviewer_name
      JSON.stringify(responses),  // ✅ responses
      detailedFeedback,           // ✅ overall_feedback
      result                      // ✅ result
    ]);

    // Set recruitment_phase based on result
    let recruitmentPhaseL2 = null;
    if (result === "Recommended") {
      recruitmentPhaseL2 = "Shortlisted in L2";
    } else if (result === "Rejected") {
      recruitmentPhaseL2 = "Rejected in L2";
    }

    if (recruitmentPhaseL2) {
      const updatePhaseQuery = `
        UPDATE candidate_info
        SET recruitment_phase = $1
        WHERE id = $2;
      `;
      await client.query(updatePhaseQuery, [recruitmentPhaseL2, candidateId]);
      console.log(`Updated recruitment_phase to "${recruitmentPhaseL2}" for candidateId ${candidateId}`);
    }

    // Commit transaction
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Feedback and recruitment phase updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  } finally {
    client.release();
  }
});


// Api to fetch dontnet questions
app.get("/api/dotnet_feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_dotnet_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API to save feedback responses
app.post("/api/dotnet_submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  console.log("Received payload:", { candidateEmail, responses });

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    console.error("Invalid request payload:", req.body);
    return res
      .status(400)
      .json({ error: "Invalid request payload. candidateEmail is required." });
  }

  const client = await pool.connect();
  try {
    // Fetch candidateId using candidateEmail
    const candidateQuery = `
    SELECT id, panel_name,hr_email FROM candidate_info WHERE candidate_email = $1;
  `;
    const candidateResult = await client.query(candidateQuery, [
      candidateEmail,
    ]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateRow = candidateResult.rows[0];
    const candidateId = candidateRow.id;
    const panelName = candidateRow.panel_name;
    const hrEmail = candidateRow.hr_email;

    console.log("Fetched candidateId:", candidateId);
    console.log("Fetched panelName:", panelName);

    // Save feedback
    const feedbackQuery = `
    INSERT INTO app_dotnet_l2_feedback_response (
      candidate_id, candidate_email,hr_email, interviewer_name, responses, overall_feedback, result, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6,$7, CURRENT_TIMESTAMP)
    ON CONFLICT (candidate_id)
    DO UPDATE SET
      responses = EXCLUDED.responses,
      overall_feedback = EXCLUDED.overall_feedback,
      result = EXCLUDED.result,
      interviewer_name = EXCLUDED.interviewer_name,
      hr_email = EXCLUDED.hr_email,
      candidate_email = EXCLUDED.candidate_email,
      updated_at = CURRENT_TIMESTAMP;
  `;

  await client.query(feedbackQuery, [
    candidateId,
    candidateEmail,
    hrEmail,          // Correct placement
    panelName,        // Correct placement
    JSON.stringify(responses),
    detailedFeedback,
    result,
  ]);
  

    // Set recruitmentphase based on result
    let recruitmentPhaseL2 = null;
    if (result === "Recommended") {
      recruitmentPhaseL2 = "Shortlisted in L2";
    } else if (result === "Rejected") {
      recruitmentPhaseL2 = "Rejected in L2";
    }

    if (recruitmentPhaseL2) {
      const updatePhaseQuery = `
        UPDATE candidate_info
        SET recruitment_phase = $1
        WHERE id = $2;
      `;
      await client.query(updatePhaseQuery, [recruitmentPhaseL2, candidateId]);
      console.log(
        `Updated recruitmentphase to "${recruitmentPhaseL2}" for candidateId ${candidateId}`
      );
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Feedback and recruitment phase updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  } finally {
    client.release();
  }
});

// Api to fetch Angular questions
app.get("/api/angular_feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_angular_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(404).json({ message: "No questions found." });
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching Angular feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/angular_submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: "Invalid request payload." });
  }

  const client = await pool.connect();
  try {
    const candidateQuery = `SELECT id, panel_name, hr_email FROM candidate_info WHERE candidate_email = $1;`;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const { id: candidateId, panel_name: panelName, hr_email: hrEmail } = candidateResult.rows[0];

    const query = `
      INSERT INTO app_angular_l2_feedback_response (
        candidate_id, candidate_email, hr_email, interviewer_name, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        interviewer_name = EXCLUDED.interviewer_name,
        hr_email = EXCLUDED.hr_email,
        candidate_email = EXCLUDED.candidate_email,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(query, [
      candidateId,
      candidateEmail,
      hrEmail,
      panelName,
      JSON.stringify(responses),
      detailedFeedback,
      result,
    ]);

    let recruitmentPhaseL2 = result === "Recommended" ? "Shortlisted in L2"
                          : result === "Rejected" ? "Rejected in L2" : null;

    if (recruitmentPhaseL2) {
      const updateQuery = `UPDATE candidate_info SET recruitment_phase = $1 WHERE id = $2;`;
      await client.query(updateQuery, [recruitmentPhaseL2, candidateId]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Angular feedback saved." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Angular feedback error:", error);
    res.status(500).json({ error: "Failed to save Angular feedback." });
  } finally {
    client.release();
  }
});

// Api to fetch react questions
app.get("/api/react_feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_react_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No feedback questions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/react_submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: "Invalid request payload." });
  }

  const client = await pool.connect();
  try {
    const candidateQuery = `SELECT id, panel_name, hr_email FROM candidate_info WHERE candidate_email = $1;`;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const { id: candidateId, panel_name: panelName, hr_email: hrEmail } = candidateResult.rows[0];

    const query = `
      INSERT INTO app_react_l2_feedback_response (
        candidate_id, candidate_email, hr_email, interviewer_name, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        interviewer_name = EXCLUDED.interviewer_name,
        hr_email = EXCLUDED.hr_email,
        candidate_email = EXCLUDED.candidate_email,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(query, [
      candidateId,
      candidateEmail,
      hrEmail,
      panelName,
      JSON.stringify(responses),
      detailedFeedback,
      result,
    ]);

    let recruitmentPhaseL2 = result === "Recommended" ? "Shortlisted in L2"
                          : result === "Rejected" ? "Rejected in L2" : null;

    if (recruitmentPhaseL2) {
      const updateQuery = `UPDATE candidate_info SET recruitment_phase = $1 WHERE id = $2;`;
      await client.query(updateQuery, [recruitmentPhaseL2, candidateId]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "React feedback saved." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("React feedback error:", error);
    res.status(500).json({ error: "Failed to save React feedback." });
  } finally {
    client.release();
  }
});

app.get("/api/mendix_feedback-questions", async (req, res) => {
  try {
    const query = `
      SELECT id, skill_category, skill_description, is_core_skill AS is_top_skill, created_at, updated_at
      FROM app_mendix_l2_feedback_questions
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(404).json({ message: "No questions found." });
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching Mendix feedback questions:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/mendix_submit-feedback", async (req, res) => {
  const { candidateEmail, responses, detailedFeedback, result } = req.body;

  if (!candidateEmail || !responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: "Invalid request payload." });
  }

  const client = await pool.connect();
  try {
    const candidateQuery = `SELECT id, panel_name, hr_email FROM candidate_info WHERE candidate_email = $1;`;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const { id: candidateId, panel_name: panelName, hr_email: hrEmail } = candidateResult.rows[0];

    const query = `
      INSERT INTO app_mendix_l2_feedback_response (
        candidate_id, candidate_email, hr_email, interviewer_name, responses, overall_feedback, result, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        responses = EXCLUDED.responses,
        overall_feedback = EXCLUDED.overall_feedback,
        result = EXCLUDED.result,
        interviewer_name = EXCLUDED.interviewer_name,
        hr_email = EXCLUDED.hr_email,
        candidate_email = EXCLUDED.candidate_email,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(query, [
      candidateId,
      candidateEmail,
      hrEmail,
      panelName,
      JSON.stringify(responses),
      detailedFeedback,
      result,
    ]);

    let recruitmentPhaseL2 = result === "Recommended" ? "Shortlisted in L2"
                          : result === "Rejected" ? "Rejected in L2" : null;

    if (recruitmentPhaseL2) {
      const updateQuery = `UPDATE candidate_info SET recruitment_phase = $1 WHERE id = $2;`;
      await client.query(updateQuery, [recruitmentPhaseL2, candidateId]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Mendix feedback saved." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Mendix feedback error:", error);
    res.status(500).json({ error: "Failed to save Mendix feedback." });
  } finally {
    client.release();
  }
});



app.get("/api/get-feedback/:candidateId/:position", async (req, res) => {
  const { candidateId, position } = req.params;

  let tableName = null;

  if (
    position.toLowerCase().includes("dotnet") ||
    position.toLowerCase().includes(".net")
  ) {
    tableName = "app_dotnet_l2_feedback_response";
  } else if (position.toLowerCase().includes("java")) {
    tableName = "app_java_l2_feedback_response";
  } else if (position.toLowerCase().includes("react")) {
    tableName = "app_react_l2_feedback_response";
  } else if (position.toLowerCase().includes("angular")) {
    tableName = "app_angular_l2_feedback_response";
  } else {
    return res.status(400).json({ message: "Invalid position provided" });
  }

  try {
    const query = `
      SELECT responses, overall_feedback, result
      FROM ${tableName}
      WHERE candidate_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [candidateId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No feedback found for this candidate" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get('/api/java_ec_questions', async (req, res) => {
  try {
    const query = `
      SELECT id, question_text, mandatory_for_candidates, created_at, updated_at
      FROM app_ec_java_questionnaire
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No feedback questions found.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.get('/api/dotnet_ec_questions', async (req, res) => {
  try {
    const query = `
      SELECT id, question_text, mandatory_for_candidates, created_at, updated_at
      FROM app_ec_dotnet_questionnaire
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No feedback questions found.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.get('/api/angular_ec_questions', async (req, res) => {
  try {
    const query = `
      SELECT id, question_text, mandatory_for_candidates, created_at, updated_at
      FROM app_ec_angular_questionnaire
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No feedback questions found.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.get('/api/react_ec_questions', async (req, res) => {
  try {
    const query = `
      SELECT id, question_text, mandatory_for_candidates, created_at, updated_at
      FROM app_ec_react_questionnaire
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No feedback questions found.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.get('/api/mendix_ec_questions', async (req, res) => {
  try {
    const query = `
      SELECT id, question_text, mandatory_for_candidates, created_at, updated_at
      FROM app_ec_mendix_questionnaire
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No feedback questions found.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/api/java_ec_submit-feedback', async (req, res) => {
  const { candidateEmail, number_of_years_or_months, detailed_feedback } = req.body;

  console.log("Received payload:", { candidateEmail, number_of_years_or_months, detailed_feedback });

  if (!candidateEmail || !number_of_years_or_months || !Array.isArray(number_of_years_or_months)) {
    console.error("Invalid request payload:", req.body);
    return res.status(400).json({ error: 'Invalid request payload. candidateEmail and number_of_years_or_months are required.' });
  }

  const client = await pool.connect();
  try {
    const candidateQuery = `
      SELECT id FROM candidate_info WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const candidateId = candidateResult.rows[0].id;
    console.log("Fetched candidateId:", candidateId);

    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO app_ec_java_feedback_response 
      (candidate_id, number_of_years_or_months, detailed_feedback, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP);
    `;

    await client.query(insertQuery, [
      candidateId,
      JSON.stringify(number_of_years_or_months),
      detailed_feedback,
    ]);

    await client.query('COMMIT');
    console.log("Feedback inserted successfully for candidateId:", candidateId);
    res.json({ success: true, message: 'Feedback inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');

    // If candidate_id already exists (duplicate), return a specific message
    if (error.code === '23505') {
      console.error('Feedback already exists for this candidate.');
      return res.status(409).json({ error: 'Feedback already submitted for this candidate.' });
    }

    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to insert feedback.' });
  } finally {
    client.release();
  }
});

app.post('/api/dotnet_ec_submit-feedback', async (req, res) => {
  const { candidateEmail, number_of_years_or_months, detailed_feedback } = req.body;

  console.log("Received payload:", { candidateEmail, number_of_years_or_months, detailed_feedback });

  if (!candidateEmail || !number_of_years_or_months || !Array.isArray(number_of_years_or_months)) {
    console.error("Invalid request payload:", req.body);
    return res.status(400).json({ error: 'Invalid request payload. candidateEmail and number_of_years_or_months are required.' });
  }

  const client = await pool.connect();
  try {
    const candidateQuery = `
      SELECT id FROM candidate_info WHERE candidate_email = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const candidateId = candidateResult.rows[0].id;
    console.log("Fetched candidateId:", candidateId);

    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO app_ec_dotnet_feedback_response 
      (candidate_id, number_of_years_or_months, detailed_feedback, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP);
    `;

    await client.query(insertQuery, [
      candidateId,
      JSON.stringify(number_of_years_or_months),
      detailed_feedback,
    ]);

    await client.query('COMMIT');
    console.log("Feedback inserted successfully for candidateId:", candidateId);
    res.json({ success: true, message: 'Feedback inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      console.error('Feedback already exists for this candidate.');
      return res.status(409).json({ error: 'Feedback already submitted for this candidate.' });
    }

    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to insert feedback.' });
  } finally {
    client.release();
  }
});
app.post('/api/react_ec_submit-feedback', async (req, res) => {
  const { candidateEmail, number_of_years_or_months, detailed_feedback } = req.body;

  console.log("Received payload:", { candidateEmail, number_of_years_or_months, detailed_feedback });

  if (!candidateEmail || !number_of_years_or_months || !Array.isArray(number_of_years_or_months)) {
    console.error("Invalid request payload:", req.body);
    return res.status(400).json({ error: 'Invalid request payload. candidateEmail and number_of_years_or_months are required.' });
  }

  const client = await pool.connect();
  try {
    const candidateResult = await client.query(`SELECT id FROM candidate_info WHERE candidate_email = $1`, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const candidateId = candidateResult.rows[0].id;
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO app_ec_react_feedback_response 
      (candidate_id, number_of_years_or_months, detailed_feedback, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
      [candidateId, JSON.stringify(number_of_years_or_months), detailed_feedback]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'React feedback inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Feedback already submitted for this candidate.' });
    }
    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to insert feedback.' });
  } finally {
    client.release();
  }
});

app.post('/api/angular_ec_submit-feedback', async (req, res) => {
  const { candidateEmail, number_of_years_or_months, detailed_feedback } = req.body;

  console.log("Received payload:", { candidateEmail, number_of_years_or_months, detailed_feedback });

  if (!candidateEmail || !number_of_years_or_months || !Array.isArray(number_of_years_or_months)) {
    console.error("Invalid request payload:", req.body);
    return res.status(400).json({ error: 'Invalid request payload. candidateEmail and number_of_years_or_months are required.' });
  }

  const client = await pool.connect();
  try {
    const candidateResult = await client.query(`SELECT id FROM candidate_info WHERE candidate_email = $1`, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const candidateId = candidateResult.rows[0].id;
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO app_ec_angular_feedback_response 
      (candidate_id, number_of_years_or_months, detailed_feedback, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
      [candidateId, JSON.stringify(number_of_years_or_months), detailed_feedback]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Angular feedback inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Feedback already submitted for this candidate.' });
    }
    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to insert feedback.' });
  } finally {
    client.release();
  }
});

app.post('/api/mendix_ec_submit-feedback', async (req, res) => {
  const { candidateEmail, number_of_years_or_months, detailed_feedback } = req.body;

  console.log("Received payload:", { candidateEmail, number_of_years_or_months, detailed_feedback });

  if (!candidateEmail || !number_of_years_or_months || !Array.isArray(number_of_years_or_months)) {
    console.error("Invalid request payload:", req.body);
    return res.status(400).json({ error: 'Invalid request payload. candidateEmail and number_of_years_or_months are required.' });
  }

  const client = await pool.connect();
  try {
    const candidateResult = await client.query(`SELECT id FROM candidate_info WHERE candidate_email = $1`, [candidateEmail]);

    if (candidateResult.rows.length === 0) {
      console.error("Candidate not found for email:", candidateEmail);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const candidateId = candidateResult.rows[0].id;
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO app_ec_mendix_feedback_response 
      (candidate_id, number_of_years_or_months, detailed_feedback, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
      [candidateId, JSON.stringify(number_of_years_or_months), detailed_feedback]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Mendix feedback inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Feedback already submitted for this candidate.' });
    }
    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to insert feedback.' });
  } finally {
    client.release();
  }
});


app.get('/api/rrf-ids', async (req, res) => {
  try {
    const result = await pool.query(`SELECT rrfid FROM rrf`); // Query the database for RRF IDs
    res.status(200).json(result.rows); // Send the rows of RRF IDs back as JSON
  } catch (error) {
    console.error('Error fetching RRF IDs:', error);
    res.status(500).json({ error: 'Failed to fetch RRF IDs' });
  }
});

app.post('/api/upload-rrfids', async (req, res) => {
  const { rrfids } = req.body;

  if (!rrfids || !Array.isArray(rrfids) || rrfids.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing RRFIDs.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let insertedCount = 0;

    for (const rrfid of rrfids) {
      if (!rrfid) continue;

      // Insert only if the rrfid doesn't exist
      const insertQuery = `
        INSERT INTO rrf (rrfid)
        VALUES ($1)
        ON CONFLICT (rrfid) DO NOTHING;
      `;

      const result = await client.query(insertQuery, [rrfid]);
      insertedCount += result.rowCount;
    }

    await client.query('COMMIT');
    res.json({ success: true, inserted: insertedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading RRFIDs:', error);
    res.status(500).json({ error: 'Failed to upload RRFIDs.' });
  } finally {
    client.release();
  }
});

// async function createJavaExperienceQuestionsTable() {
//   try {
//     // 1. Create table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS app_ec_mendix_questionnaire (
//         id SERIAL PRIMARY KEY,
//         question_text TEXT NOT NULL,
//         mandatory_for_candidates VARCHAR(50) CHECK (mandatory_for_candidates IN ('Mandatory', 'Nice to have')),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // 2. Insert sample questions
//     const questions = [
//       ['java_experience_java_experience', 'Mandatory'],
//       ['java_experience_java8_experience', 'Mandatory'],
//       ['java_experience_concurrency_experience', 'Nice to have'],
//       ['java_experience_microservice_experience', 'Mandatory'],
//       ['java_experience_distributed_transactions_experience', 'Nice to have'],
//       ['java_experience_event_driven_experience', 'Nice to have'],
//       ['java_experience_security_experience', 'Nice to have'],
//       ['java_experience_design_patterns_experience', 'Mandatory'],
//       ['java_experience_data_structures_experience', 'Nice to have'],
//       ['java_experience_spring_boot_experience_details', 'Mandatory'],
//       ['java_experience_sql_queries_experience', 'Mandatory'],
//       ['java_experience_jvm_tuning_experience', 'Nice to have']
//     ];

//     for (const [questionText, mandatory] of questions) {
//       await pool.query(
//         `INSERT INTO app_ec_mendix_questionnaire (question_text, mandatory_for_candidates)
//          VALUES ($1, $2);`,
//         [questionText, mandatory]
//       );
//     }

//     console.log('✅ Table created and questions inserted successfully.');
//   } catch (error) {
//     console.error('❌ Error creating table or inserting questions:', error);
//   }
// }
// createJavaExperienceQuestionsTable();

// async function javaresponsetable() {
//   const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS app_ec_mendix_feedback_response (
//       id SERIAL PRIMARY KEY,
//       candidate_id INTEGER NOT NULL,
//       number_of_years_or_months JSONB,
//       detailed_feedback TEXT,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;

//   try {
//     await pool.query(createTableQuery);
//     console.log("✅ Table 'app_ec_java_feedback_response' created successfully.");
//   } catch (error) {
//     console.error("❌ Error creating table:", error);
//   }
// }
// javaresponsetable();

// async function createSkillCatalogTable() {
//   const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS app_mendix_l2_feedback_questions (
//       id SERIAL PRIMARY KEY,
//       skill_category TEXT NOT NULL,
//       skill_description TEXT NOT NULL,
//       is_core_skill BOOLEAN NOT NULL DEFAULT FALSE,
//       is_active BOOLEAN NOT NULL DEFAULT TRUE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;

//   const insertDataQuery = `
//     INSERT INTO app_mendix_l2_feedback_questions (skill_category, skill_description, is_core_skill, is_active)
//     VALUES
//     ('app_dotnet Concepts', 'Expect complete understanding of Polymorphism, Abstraction, Inheritance and Encapsulation', true, true),
//     ('data - Functional Programming', 'Expect working solutions for questions on Streams, Lambda, Functional Programming, Optional, Collections, and terminal operations. Ask to write a small 1 liner program to check coding.', true, true),
//     ('Concurrency & Multithreading', 'Expect complete understanding of Thread Synchronization, JMM, locks, atomic variables, and Executor Service framework', false, true),
//     ('Data Structure & Algorithms', 'Ability to write program for search or sort using optimized algorithms, and able to showcase knowledge on BST, Graphs, Queue and Stack', false, true),
//     ('Java Design Patterns', 'Understanding of how to design and implement Java applications using various design patterns. Expect solutions using Factory, Singleton, Prototype, Façade, Flyweight in real projects.', true, true),
//     ('Microservices Design Patterns', 'Understanding of how to design and implement Microservices applications using various design patterns. Expect solutions using Saga, CQRS, API Gateway, Circuit Breaker', true, true),
//     ('Microservices Architecture', 'Expect complete understanding of communication between services, resiliency, service discovery, and DB operations', true, true),
//     ('Event Driven Architecture', 'Expect complete understanding of eventual consistency, missed data, and data synchronization using Kafka', false, true),
//     ('Application Security', 'Expect complete understanding of secure communication, SSL/TLS, OAuth2 and JWT tokens, and public and private keys', false, true),
//     ('Spring boot', 'Understanding of Dependency injection, configuration handling, Actuator, Life cycle, classloaders, security, DB operations, and Customer Response for success and Error', true, true),
//     ('SQL queries', 'Expect working knowledge to write queries for fetching data from multiple tables using JOIN and GroupBy, and knowledge of Stored Procedure, Triggers, and key Constraints', true, true),
//     ('Performance Optimization', 'Monitoring and profiling Java applications using Jprofiler, knowledge on Classloaders, bytecode manipulation', false, true),
//     ('Unit testing', 'Expect knowledge of Unit test frameworks like JUnit, Mockito, Lombok and validate how to do integration testing of the classes', true, true)
//     ON CONFLICT DO NOTHING;
//   `;

//   try {
//     await pool.query(createTableQuery);
//     await pool.query(insertDataQuery);
//     console.log("✅ skill_catalog table created and populated.");
//   } catch (err) {
//     console.error("❌ Error creating/inserting into skill_catalog:", err);
//   }
// }
// createSkillCatalogTable();

// async function reactresponsetable() {
//   const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS app_mendix_l2_feedback_response (
//       id SERIAL PRIMARY KEY,
//       candidate_id INTEGER NOT NULL,
//       responses JSONB NOT NULL,
//       overall_feedback TEXT,
//       result VARCHAR(50),
//       candidate_email VARCHAR(255),
//       interviewer_name VARCHAR(255),
//       hr_email VARCHAR(255),
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;

//   try {
//     const client = await pool.connect();
//     await client.query(createTableQuery);
//     console.log("✅ app_mendix_l2_feedback_response table created (if not exists)");
//     client.release();
//   } catch (err) {
//     console.error("❌ Error creating interview_results table:", err);
//   }
// }
// reactresponsetable();




// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
