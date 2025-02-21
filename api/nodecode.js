const express = require('express');
const { Pool, Client } = require('pg'); // PostgreSQL
const cors = require('cors');
const fetch = require('node-fetch'); // For inviting candidates (API request)
const axios = require('axios'); // For fetching test results
const path = require('path'); // For static file handlingtime
const cron = require('node-cron');
// const { format } = require('date-fns-tz');api/candidates

const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// CORS configuration
const corsOptions = {
  //origin: 'https://demotag.vercel.app', // Your Vercel frontend domain
  methods: 'GET, POST, PUT, OPTIONS', // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true // Enable cookies/sessions if needed
};

app.use(cors(corsOptions)); // Apply CORS middleware

// Middleware
app.use(express.json());

// PostgreSQL connection string
const connectionString = 'postgresql://retool:4zBLlh1TPsAu@ep-frosty-pine-a6aqfk20.us-west-2.retooldb.com/retool?sslmode=require';

// Create a new pool instance
const pool = new Pool({ connectionString });

// iMocha API credentials
const IMOCHA_API_KEY = 'JHuaeAvDQsGfJxlHYpeJwFOxySVrdm'; // Your iMocha API key
const IMOCHA_BASE_URL = 'https://apiv3.imocha.io/v3';

// --- Routes ---
// Add this route to your existing code in nodecode.js
app.get('/api/github-token', (req, res) => {
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
      "SELECT ec_mapping, status FROM admin_table WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not available" });
    }

    const { ec_mapping, status } = result.rows[0];

    if (status !== "Enable") {
      return res.status(403).json({ error: "Account is disabled. Please contact admin." });
    }

    res.json({ ec_mapping });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/invite-candidate', async (req, res) => {
    const { inviteId, email, name, sendEmail, callbackURL, redirectURL, disableMandatoryFields, hideInstruction } = req.body;

    // Validate the inviteId
    if (!inviteId) {
        return res.status(400).json({ error: 'Missing inviteId in the request.' });
    }

    const targetUrl = `https://apiv3.imocha.io/v3/tests/${inviteId}/invite`; // Use the inviteId dynamically

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': IMOCHA_API_KEY,
            },
            body: JSON.stringify({
                email,
                name,
                sendEmail,
                callbackURL,
                redirectURL,
                disableMandatoryFields,
                hideInstruction
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error response from iMocha:', errorData);
            return res.status(response.status).json({ error: 'Failed to send invite to iMocha' });
        }

        const data = await response.json();
        res.json(data); // Send back the iMocha API response to the frontend
    } catch (error) {
        console.error('Error inviting candidate:', error);
        res.status(500).json({ error: 'An error occurred while sending the invite' });
    }
});

app.post('/api/rrf-update', async (req, res) => {
  const { rrf_id, role, eng_center, rrf_status } = req.body;

  if (!rrf_id || !role || !eng_center || !rrf_status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if the record exists
    const result = await pool.query('SELECT * FROM rrf_details WHERE rrf_id = $1', [rrf_id]);
    
    if (result.rows.length === 0) {
      // Insert new record if not exists
      await pool.query(`
        INSERT INTO rrf_details (rrf_id, role, eng_center, resume_count, rrf_status, rrf_startdate)
        VALUES ($1, $2, $3, 1, $4, CURRENT_TIMESTAMP)
      `, [rrf_id, role, eng_center, rrf_status]);

      return res.status(200).json({ message: 'RRF submitted successfully!' });
    } else {
      // Update the existing record and increment resume_count
      await pool.query(`
        UPDATE rrf_details
        SET resume_count = resume_count + 1, rrf_status = $1 
        WHERE rrf_id = $2
      `, [rrf_status, rrf_id]);

      return res.status(200).json({ message: 'RRF updated successfully!' });
    }
  } catch (error) {
    console.error('Error processing RRF submission:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/update-candidate-recruitment-phase', async (req, res) => {
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
          return res.status(404).json({ success: false, message: 'Candidate not found' });
      }

      res.status(200).json({ success: true, message: 'Recruitment phase updated', data: result.rows[0] });
  } catch (error) {
      console.error('Error updating recruitment phase:', error);
      res.status(500).json({ success: false, message: 'Error updating recruitment phase' });
  }
});

app.get('/api/rrf-details', async (req, res) => {
  try {
    // Query to fetch aggregated resume counts grouped by eng_center
    const result = await pool.query(`
      SELECT eng_center, SUM(resume_count) AS resume_count
      FROM rrf_details
      GROUP BY eng_center
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No RRF details found' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching RRF details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Route 2: Update resumes count in the database
// Route 2: Update resumes count in the database
// Route 2: Update resumes count in the database
// app.post('/send-resumes-count', async (req, res) => {
//   try {
//     // Fetch the current rejected and shortlisted counts
//     const result = await pool.query('SELECT rejected, shortlisted FROM resume_counts WHERE id = 1');

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'No resume count found.' });
//     }

//     // Log the rejected and shortlisted values for debugging
//     console.log('Rejected count:', result.rows[0].rejected);
//     console.log('Shortlisted count:', result.rows[0].shortlisted);

//     // Calculate the total count by summing rejected and shortlisted columns
//     const totalCount = result.rows[0].rejected + result.rows[0].shortlisted + 1;

//     // Log the total count to ensure it's calculated correctly
//     console.log('Total count:', totalCount);

//     // Update the count field in the resume_counts table
//     const updateQuery = `UPDATE resume_counts SET count =  $1 WHERE id = 1;`;
//     await pool.query(updateQuery, [totalCount]);

//     // Send the response back with the updated count
//     res.status(200).json({ 
//       message: 'Resumes count updated successfully.', 
//       count: totalCount // Send the correct total count in the response
//     });
//   } catch (error) {
//     console.error('Error updating resumes count:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });



// Route to update the 'resumescount' table
// app.post('/update-resumescount', async (req, res) => {
//     const { attempted, improvement } = req.body;

//     if (typeof attempted !== 'number' || typeof improvement !== 'number') {
//         return res.status(400).json({ message: 'Invalid data. Expected numbers for attempted and improvement.' });
//     }

//     try {
//         const query = `
//             UPDATE resume_counts
//             SET attempted = $1, improvement = $2
//             WHERE id = 1;
//         `;
        
//         // Execute the update query
//         await pool.query(query, [attempted, improvement]);

//         return res.status(200).json({ message: 'Resumes count updated successfully.' });
//     } catch (error) {
//         console.error('Error updating resumes count:', error);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// });









//candidate-info table
app.post('/api/add-candidate-info', async (req, res) => {
    const { candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id,eng_center } = req.body;

    try {
        const query = `
            INSERT INTO candidate_info (candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id,eng_center)
            VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *;
        `;
        const values = [candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id,eng_center];

        const result = await pool.query(query, values);

        res.status(200).json({ success: true, message: 'Candidate info saved', data: result.rows[0] });
    } catch (error) {
        console.error('Error saving candidate information:', error);
        res.status(500).json({ success: false, message: 'Error saving candidate info' });
    }
});
//prescreening-candiadte
app.post('/api/add-prescreening-info', async (req, res) => {
  const { candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id } = req.body;

  try {
      const query = `
          INSERT INTO candidate_prescreening (candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id)
          VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10)
          RETURNING *;
      `;
      const values = [candidate_name, candidate_email, prescreening_status, role, recruitment_phase,resume_score,resume,candidate_phone,hr_email,rrf_id];

      const result = await pool.query(query, values);

      res.status(200).json({ success: true, message: 'Candidate info saved', data: result.rows[0] });
  } catch (error) {
      console.error('Error saving candidate information:', error);
      res.status(500).json({ success: false, message: 'Error saving candidate info' });
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
  service: 'gmail', // Use your email service (e.g., Gmail)
  auth: {
    user: 'sapireddyvamsi@gmail.com', // Replace with your email
    pass: 'urvuwnnnmdjwohxp',  // Replace with your email password or app-specific password
  },
});

// Email sending endpoint
// Email sending endpoint
app.post('/api/send-email', (req, res) => {
  const { recipient, data } = req.body;
  const { candidateEmail, score, performanceCategory, testName, pdfReportUrl } = data;

  // Encode the details to be safely passed in the URL
  const feedbackFormUrl = `https://demotag.vercel.app/assessment-form-html.html?email=${encodeURIComponent(candidateEmail)}&score=${encodeURIComponent(score)}&performanceCategory=${encodeURIComponent(performanceCategory)}`;

  const mailOptions = {
    from: 'sapireddyvamsi@gmail.com', // Sender address (your email)
    to: recipient,                // Recipient email (user input)
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
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send email', error });
    }
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  });
});


app.post('/api/save-imocha-results', async (req, res) => {
  try {
    const reports = req.body.reports; // Get reports array from request body

    // Insert each report into the database
    for (const report of reports) {
      const { candidateEmail, score, totalTestPoints, scorePercentage, performanceCategory, testName, pdfReportUrl } = report;

      // Check if the candidateEmail already exists in the database
      const existingRecord = await pool.query(
        'SELECT * FROM imocha_results WHERE candidate_email = $1',
        [candidateEmail]
      );

      if (existingRecord.rows.length === 0) {
        // If no existing record, insert a new row
        await pool.query(
          `INSERT INTO imocha_results (candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [candidateEmail, score, totalTestPoints, scorePercentage, performanceCategory, testName, pdfReportUrl]
        );
      } else {
        // If the record already exists, optionally update it if needed
        console.log(`Record for ${candidateEmail} already exists`);
      }
    }

    res.status(200).send('Results saved successfully');
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).send('Server error');
  }
});




//devops count
app.get('/api/devops-resume-count', async (req, res) => {
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
    console.error('Error fetching DevOps resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});

//platform count
app.get('/api/platform-resume-count', async (req, res) => {
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
    console.error('Error fetching DevOps resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
//cloudops count
app.get('/api/cloudops-resume-count', async (req, res) => {
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
    console.error('Error fetching DevOps resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
//site reliability count
app.get('/api/site-resume-count', async (req, res) => {
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
    console.error('Error fetching DevOps resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});


//App count
app.get('/api/reactjs-resume-count', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior ReactJS Developer', 'Lead ReactJS Developer','Senior ReactJS Developer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error fetching DevOps resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
 
 
app.get('/api/snow-resume-count', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Snowflake Developer', 'Lead Snowflake Developer','Senior Snowflake Developer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error fetching snow resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
app.get('/api/java-resume-count', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM candidate_info
      WHERE role IN ('Junior Java Fullstack Developer', 'Lead Java Fullstack Developer','Senior Java Fullstack Developer')
      AND visible = TRUE;
    `);
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error fetching java resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
 
 
app.get('/api/hadoop-resume-count', async (req, res) => {
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
    console.error('Error fetching hadoop resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
app.get('/api/.net-resume-count', async (req, res) => {
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
    console.error('Error fetching .net resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the DevOps resume count' });
  }
});
 
//Data count
app.get('/api/data-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-ops-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-bi-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-modeller-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-analyst-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-architect-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});
app.get('/api/data-Scientist-resume-count', async (req, res) => {
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
    console.error('Error fetching data resume count:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data resume count' });
  }
});

// Prescreening count
// Route to get the count of rejected candidates in the prescreening phase
app.get('/api/rejected-prescreening-count', async (req, res) => {
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
        console.error('Error fetching rejected prescreening count:', error);
        res.status(500).send('Error fetching count.');
    }
});
// Route to get the count of shortlisted candidates in the 'Move to L1' phase
app.get('/api/shortlisted-prescreening-count', async (req, res) => {
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
        console.error('Error fetching shortlisted L1 count:', error);
        res.status(500).send('Error fetching count.');
    }
});
//L1 COUNT
app.get('/api/rejected-l1-count', async (req, res) => {
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
        console.error('Error fetching rejected prescreening count:', error);
        res.status(500).send('Error fetching count.');
    }
});
// Route to get the count of shortlisted candidates in the 'Move to L1' phase
app.get('/api/shortlisted-l1-count', async (req, res) => {
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
        console.error('Error fetching shortlisted L1 count:', error);
        res.status(500).send('Error fetching count.');
    }
});

// Route to fetch candidate data


app.get('/api/getcandidates', async (req, res) => {
    try {
        // Replace the column names with the ones relevant to your database schema
        const result = await pool.query('SELECT candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score,date FROM candidate_info');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/candidate-counts', async (req, res) => {
  try {
      const { eng_center } = req.query;

      if (!eng_center) {
          return res.status(400).json({ error: "eng_center parameter is required" });
      }

      // Convert comma-separated string to an array and trim spaces
      const engCentersArray = eng_center.split(',').map(center => center.trim());

      // Generate placeholders ($1, $2, $3, ...) dynamically
      const placeholders = engCentersArray.map((_, index) => `$${index + 1}`).join(',');

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
          rejectedCount: rejectedResult.rows[0].rejected_count
      });
  } catch (error) {
      console.error('Error fetching counts:', error);
      res.status(500).send('Server error');
  }
});


















const testIds = ['1292180','1293122','1292779', '1292781', '1295883','1292990','1292769','1292775','1292950','1292733','1292976','1292765','1292203']; // Example test IDs

// Function to fetch completed test attempts for multiple test IDs
async function getCompletedTestAttempts(startDateTime, endDateTime) {
  try {
    const allTestAttempts = []; // Array to store all test attempts

    for (const testId of testIds) {
      const requestBody = { testId, StartDateTime: startDateTime, EndDateTime: endDateTime };

      // Fetch test attempts for the current test ID
      const response = await axios.post(`${IMOCHA_BASE_URL}/candidates/testattempts?state=completed`, requestBody, {
        headers: { 'x-api-key': IMOCHA_API_KEY, 'Content-Type': 'application/json' },
      });

      // Push the results of this test ID to the allTestAttempts array
      allTestAttempts.push(...response.data.result.testAttempts);
    }

    return allTestAttempts; // Return combined results from all test IDs
  } catch (error) {
    console.error('Error fetching completed test attempts:', error.response?.status, error.response?.data);
    return [];
  }
}

// API endpoint to fetch completed test attempts within the given date range
// API endpoint to fetch completed test attempts within the given date range
app.post('/api/callTestAttempts', async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }

  try {
    const startDateTime = new Date(`${startDate}T00:00:00Z`).toISOString();
    const endDateTime = new Date(`${endDate}T23:59:59Z`).toISOString();

    // Fetch the completed test attempts from all test IDs
    const testAttempts = await getCompletedTestAttempts(startDateTime, endDateTime);

    // Call the fetchAndSaveTestResults function and pass the date range
    await fetchAndSaveTestResults(startDateTime, endDateTime);

    res.json(testAttempts); // Return the result to the frontend
  } catch (error) {
    console.error('Error calling getCompletedTestAttempts:', error);
    res.status(500).json({ message: 'Error fetching test attempts.' });
  }
});


// Function to fetch report for a given invitationId
async function getReport(invitationId) {
  try {
    const response = await axios.get(`${IMOCHA_BASE_URL}/reports/${invitationId}`, {
      headers: { 'x-api-key': IMOCHA_API_KEY, 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching report for invitation ID ${invitationId}:`, error.response?.status, error.response?.data);
    return null;
  }
}

// Function to fetch and save test results to the database
async function fetchAndSaveTestResults(startDateTime, endDateTime) {
  console.log('fetchAndSaveTestResults started at:', new Date().toISOString());

  try {
    const testIds = ['1292180','1293122','1292779', '1292781', '1295883','1292990','1292769','1292775','1292950','1292733','1292976','1292765','1292203']; // Example test IDs

    for (const testId of testIds) {
      // Fetch the test attempts for each testId within the given date range
      const testAttempts = await getCompletedTestAttempts(startDateTime, endDateTime);

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

          // Save to the database
          await pool.query(query, values);
          console.log(`Saved/Updated record for email: ${report.candidateEmail}`);
        }
      }
    }

    console.log('fetchAndSaveTestResults completed at:', new Date().toISOString());
  } catch (error) {
    console.error('Error in fetchAndSaveTestResults:', error.message);
  }
}


// Call function immediately when the server starts
fetchAndSaveTestResults();

// Run the fetchAndSaveTestResults every 10 seconds
setInterval(() => {
  console.log('Scheduled task running...');
  fetchAndSaveTestResults();
}, 10000);

app.get('/api/test-counts', async (req, res) => {
  try {
      const testNames = [
          'Clone of_Java Backend Developer',
          'Data_EC_ERIE_Python_PySpark',
          'Senior Azure DevOps Engineer - Cloud EC',
          'Jr DevSecOps Engineer - AWS',
          'Junior Azure DevOps Engineer',
          'AWS Platform Lead',
          'Azure Cloud Engineer - Cloud EC'
      ];

      // Query the database for counts of the specified test names
      const query = `
          SELECT test_name, COUNT(*) AS count
          FROM imocha_results
          WHERE test_name = ANY($1)
          GROUP BY test_name
      `;
      const result = await pool.query(query, [testNames]);

      // Convert the result into a key-value object
      const counts = {};
      result.rows.forEach(row => {
          counts[row.test_name] = parseInt(row.count, 10);
      });

      res.json(counts);
  } catch (error) {
      console.error('Error fetching test counts:', error);
      res.status(500).json({ error: 'Failed to fetch test counts' });
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
app.get('/api/fetch-results', async (req, res) => {
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
    console.error('Error fetching results:', error.message);
    res.status(500).json({ message: 'An error occurred while fetching results.' });
  }
});

app.get('/api/candidates', async (req, res) => {
  try {
      // Retrieve eng_center from the URL query parameters
      const engCenter = req.query.eng_center;

      let query = 'SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info';
      const params = [];

      // If an eng_center value is provided, add a WHERE clause
      if (engCenter) {
          query += ' WHERE eng_center = $1';
          params.push(engCenter);
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Server error');
  }
});


//Shortlisted data
app.get('/api/candidates/shortlisted', async (req, res) => {
  try {
      // Retrieve eng_center from the URL query parameters
      const engCenter = req.query.eng_center;

      // Base query filtering for 'Shortlisted' status
      let query = 'SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info WHERE prescreening_status = $1';
      const params = ['Shortlisted'];

      // If eng_center is provided, add an additional filter condition
      if (engCenter) {
          query += ' AND eng_center = $2';
          params.push(engCenter);
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching shortlisted candidates:', error);
      res.status(500).send('Server error');
  }
});

//Rejected data
app.get('/api/candidates/rejected', async (req, res) => {
  try {
      // Retrieve eng_center from the URL query parameters
      const engCenter = req.query.eng_center;

      // Base query filtering for 'Rejected' status
      let query = 'SELECT rrf_id, candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, date FROM candidate_info WHERE prescreening_status = $1';
      const params = ['Rejected'];

      // If eng_center is provided, add an additional filter condition
      if (engCenter) {
          query += ' AND eng_center = $2';
          params.push(engCenter);
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching rejected candidates:', error);
      res.status(500).send('Server error');
  }
});


// API endpoint to get the prescreening count
app.get('/api/prescreening-count', async (req, res) => {
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
      console.error('Error fetching prescreening count:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/api/move-to-l1-count', async (req, res) => {
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
      console.error('Error fetching Move to L1 count:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
// API endpoint to get the Moved to L2 count
app.get('/api/moved-to-l2-count', async (req, res) => {
  try {
      // Query to fetch the Moved to L2 count
      const query = `
          SELECT COUNT(*) AS moved_to_l2_count
          FROM candidate_info
          WHERE recruitment_phase = 'Moved to L2';
      `;
      const result = await pool.query(query);

      // Send the count as the response
      res.json({ moved_to_l2_count: result.rows[0].moved_to_l2_count });
  } catch (error) {
      console.error('Error fetching Moved to L2 count:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//imocha cloud count
app.get('/api/imocha-results-count', async (req, res) => {
  try {
      // Query to fetch the count
      const query = 'SELECT COUNT(*) AS total_count FROM imocha_results;';
      const result = await pool.query(query);

      // Send the count as the response
      res.json({ total_count: result.rows[0].total_count });
  } catch (error) {
      console.error('Error fetching count from imocha_results:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/candidate-prescreening', async (req, res) => {
  try {
    const query = `
      SELECT candidate_name, role, candidate_email, prescreening_status
      FROM candidate_prescreening;
    `;
    const result = await pool.query(query);

    res.json(result.rows); // Send all records with email
  } catch (error) {
    console.error('Error fetching prescreening candidates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
app.get('/api/technical-profiles', async (req, res) => {
  try {
      // Query to get all technical profiles
      const result = await pool.query(`SELECT id, name, email, status, azure, aws, account FROM panel_details`);
 
      // Respond with the profiles
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).send('Server error');
  }
});
 
 
app.get('/api/email-details', async (req, res) => {
  try {
      // Query to get all technical profiles
      const result = await pool.query(`SELECT email FROM panel_details`);
 
      // Respond with the profiles
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).send('Server error');
  }
});

// prescreening Shortlisted
app.get('/api/get-shortlisted-candidates', async (req, res) => {
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
      AND candidate_info.recruitment_phase NOT IN ('L2 Scheduled', 'Shortlisted in L2', 'Rejected in L2', 'On Hold in L2', 'No iMocha Exam');
    
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
      return res.status(404).json({ message: 'No shortlisted candidates found.' });
    }

    res.status(200).json({
      message: 'Shortlisted candidates retrieved successfully.',
      candidates: result.rows,
    });
  } catch (error) {
    console.error('Error retrieving shortlisted candidates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/get-email-status', async (req, res) => {
  const candidateEmail = req.query.candidate_email;
  if (!candidateEmail) {
    return res.status(400).json({ message: 'candidate_email query parameter is required.' });
  }

  try {
    const queryText = 'SELECT email_status FROM candidate_info WHERE candidate_email = $1';
    const result = await pool.query(queryText, [candidateEmail]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    // result.rows[0].email_status might be null or 'emailsent'
    res.json({ status: result.rows[0].email_status });
  } catch (err) {
    console.error('Error querying database:', err);
    res.status(500).json({ message: 'Database error.' });
  }
});

// API endpoint to update the email status for a candidate.
// Expects a JSON body with candidate_email and status.
app.post('/api/update-email-status', async (req, res) => {
  const { candidate_email, status } = req.body;
  if (!candidate_email || !status) {
    return res.status(400).json({ message: 'candidate_email and status are required.' });
  }

  try {
    const queryText = 'UPDATE candidate_info SET email_status = $1 WHERE candidate_email = $2 RETURNING *';
    const result = await pool.query(queryText, [status, candidate_email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    res.json({ message: 'Email status updated successfully.', candidate: result.rows[0] });
  } catch (err) {
    console.error('Error updating email status:', err);
    res.status(500).json({ message: 'Database error.' });
  }
});

//get form data
app.get('/api/getCandidateData', async (req, res) => {
  try {
    const candidateEmail = req.query.candidateEmail; // Get the email from the query parameters
 
    if (!candidateEmail) {
      return res.status(400).json({ error: 'candidateEmail is required' });
    }
   
    const query = `
      SELECT candidate_name, role, panel_name, l_2_interviewdate, l_1_score, rrf_id, hr_email
      FROM candidate_info WHERE candidate_email = $1;
    `;
 
    const result = await pool.query(query, [candidateEmail]);
 
    if (result.rows.length > 0) {
      return res.json(result.rows[0]); // Return the first result (there should be only one row per email)
    } else {
      return res.status(404).json({ error: 'No candidate found' });
    }
  } catch (error) {
    console.error('Error fetching candidate data:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});
 
 //l2 form update
app.post('/api/updateCandidateFeedback', async (req, res) => {
  try {
    const { candidateEmail, feedback, result } = req.body; // Get the data from the request body
 
    if (!candidateEmail || !feedback || !result) {
      return res.status(400).json({ error: 'candidateEmail, feedback, and result are required' });
    }
 
    let recruitmentPhase;
    if (result === 'Recommended') {
      recruitmentPhase = 'Shortlisted in L2';
    } else if (result === 'Rejected') {
      recruitmentPhase = 'Rejected in L2';
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
    const resultFromDB = await pool.query(query, [feedback, result, recruitmentPhase, candidateEmail]);
 
    // If the candidate was found and updated
    if (resultFromDB.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Candidate feedback and result updated successfully',
        updatedData: resultFromDB.rows[0], // Optionally, return the updated data
      });
    } else {
      return res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (error) {
    console.error('Error updating candidate feedback:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/add-feedback', async (req, res) => {
  const {
      rrf_id, position, candidate_name, interview_date, interviewer_name,
      hr_email, candidate_email, core_cloud_concepts_deployment, core_cloud_concepts_configuration,
      core_cloud_concepts_troubleshooting, core_cloud_concepts_justification,
      core_cloud_concepts_improvements, networking_security_deployment, networking_security_configuration,
      networking_security_troubleshooting, networking_security_justification,
      networking_security_improvements, infrastructure_management_deployment, infrastructure_management_configuration,
      infrastructure_management_troubleshooting, infrastructure_management_justification,
      infrastructure_management_improvements, scalability_high_avail_deployment, scalability_high_avail_configuration,
      scalability_high_avail_troubleshooting, scalability_high_avail_justification,
      scalability_high_avail_improvements, automation_deployment, automation_configuration, automation_troubleshooting,
      automation_justification, automation_improvements, observability_deployment, observability_configuration, observability_troubleshooting,
      observability_justification, observability_improvements, detailed_feedback, result
  } = req.body;

  // Check for required fields
  if (!rrf_id || !position || !candidate_name || !interview_date || !interviewer_name || !hr_email || !candidate_email) {
      return res.status(400).json({
          success: false,
          message: 'Missing required fields.',
      });
  }

  try {
      const query = `
          INSERT INTO feedback_table (
              rrf_id, position, candidate_name, interview_date, interviewer_name,
              hr_email, candidate_email,

              core_cloud_concepts_deployment, core_cloud_concepts_configuration,
              core_cloud_concepts_troubleshooting, core_cloud_concepts_justification,
              core_cloud_concepts_improvements,

              networking_security_deployment, networking_security_configuration,
              networking_security_troubleshooting, networking_security_justification,
              networking_security_improvements,

              infrastructure_management_deployment, infrastructure_management_configuration,
              infrastructure_management_troubleshooting, infrastructure_management_justification,
              infrastructure_management_improvements,

              scalability_high_avail_deployment, scalability_high_avail_configuration,
              scalability_high_avail_troubleshooting, scalability_high_avail_justification,
              scalability_high_avail_improvements,

              automation_deployment, automation_configuration, automation_troubleshooting,
              automation_justification, automation_improvements,

              observability_deployment, observability_configuration, observability_troubleshooting,
              observability_justification, observability_improvements,

              detailed_feedback, result
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17,
              $18, $19, $20, $21, $22,
              $23, $24, $25, $26, $27,
              $28, $29, $30, $31, $32,
              $33, $34, $35, $36, $37,
              $38, $39
          )
      `;
      
      const values = [
          rrf_id, position, candidate_name, interview_date, interviewer_name, hr_email, candidate_email,
          core_cloud_concepts_deployment, core_cloud_concepts_configuration, core_cloud_concepts_troubleshooting,
          core_cloud_concepts_justification, core_cloud_concepts_improvements,
          networking_security_deployment, networking_security_configuration, networking_security_troubleshooting,
          networking_security_justification, networking_security_improvements,
          infrastructure_management_deployment, infrastructure_management_configuration,
          infrastructure_management_troubleshooting, infrastructure_management_justification,
          infrastructure_management_improvements,
          scalability_high_avail_deployment, scalability_high_avail_configuration,
          scalability_high_avail_troubleshooting, scalability_high_avail_justification,
          scalability_high_avail_improvements,
          automation_deployment, automation_configuration, automation_troubleshooting, automation_justification,
          automation_improvements,
          observability_deployment, observability_configuration, observability_troubleshooting,
          observability_justification, observability_improvements,
          detailed_feedback, result
      ];

      await pool.query(query, values);

      return res.status(200).json({
          success: true,
          message: 'Feedback submitted successfully!',
      });
  } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({
          success: false,
          message: 'An error occurred while submitting feedback.',
      });
  }
});

app.post('/api/ecusecasesubmitform', async (req, res) => {
  const data = req.body;

  // Check if required data is provided
  if (!data || !data.candidateEmail || !data.imochaScore || !data.rrfId || !data.position || !data.candidateName || !data.interviewDate || !data.interviewerName || !data.hrEmail) {
    return res.status(400).json({ message: 'Missing required fields' });
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
    data.candidateEmail, data.imochaScore, data.rrfId, data.position, data.candidateName, data.interviewDate, 
    data.interviewerName, data.hrEmail,
    data.usecaseUnderstandingScore1, data.usecaseUnderstandingScore2, data.usecaseUnderstandingScore3, data.usecaseUnderstandingScore4,
    data.usecaseUnderstandingRating, data.usecaseUnderstandingJustification, data.usecaseUnderstandingImprovements,
    data.technicalDesignScore1, data.technicalDesignScore2, data.technicalDesignScore3, data.technicalDesignRating,
    data.technicalDesignJustification, data.technicalDesignImprovements,
    data.solutionImplementationScore1, data.solutionImplementationScore2, data.solutionImplementationScore3, data.solutionImplementationRating,
    data.solutionImplementationJustification, data.solutionImplementationImprovements,
    data.troubleshootingScore1, data.troubleshootingScore2, data.troubleshootingScore3, data.troubleshootingRating,
    data.troubleshootingJustification, data.troubleshootingImprovements,
    data.walkthroughScore1, data.walkthroughScore2, data.walkthroughScore3, data.walkthroughScore4, data.walkthroughRating,
    data.walkthroughJustification, data.walkthroughImprovements,
    data.detailedFeedback, data.result
  ];

  try {
    // Execute the query to insert feedback data into the database
    await pool.query(query, values);
    
    // Return success response
    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error inserting feedback data:', error);
    return res.status(500).json({ success: false, message: 'Error submitting feedback' });
  }
});


// panel call
app.get('/api/panel-candidates-info', async (req, res) => {
  try {
    const { l_2_interviewdate, userEmail } = req.query;

    const query = `
      SELECT candidate_name, candidate_email, role, recruitment_phase, resume, l_2_interviewdate, imocha_report, meeting_link, l_2_interviewtime
      FROM candidate_info
      WHERE prescreening_status = 'Shortlisted'
        AND recruitment_phase = 'L2 Scheduled'
        AND l_2_interviewdate = $1
        AND panel_name = $2;`;  // Add the condition to check for panel_name containing the user's email
    
    // Use the '%' wildcard to match any occurrence of the userEmail in the panel_name field
    const result = await pool.query(query, [l_2_interviewdate, userEmail]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shortlisted candidates:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/hr-candidates-info', async (req, res) => {
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
    console.error('Error fetching shortlisted candidates:', error);
    res.status(500).send('Server error');
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
      "L2 Scheduled",
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
    res.status(500).json({ message: "Failed to update candidate status", error: error.message });
  }
});
app.get('/api/candidate-total-by-team', async (req, res) => {
  try {
    // Extract ECs from query parameters
    const { ecs } = req.query;

    // Validate input
    if (!ecs) {
      return res.status(400).json({ error: 'Please provide ECs as a query parameter.' });
    }

    // Split the provided ECs into an array
    const ecList = ecs.split(',').map(ec => ec.trim());

    // Query to fetch the count of candidates for the specified ECs
    const query = `
      SELECT eng_center, COUNT(*) AS total_count
FROM candidate_info
WHERE eng_center = ANY($1) AND visible = TRUE
GROUP BY eng_center;
    `;

    // Execute the query with the EC list
    const result = await pool.query(query, [ecList]);

    // Transform the result into a key-value object
    const countsByTeam = result.rows.reduce((acc, row) => {
      acc[row.eng_center] = row.total_count;
      return acc;
    }, {});

    res.json(countsByTeam);
  } catch (error) {
    console.error('Error fetching total count by team:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//hr names
app.get('/api/hr-names', async (req, res) => {
  try {
    // Query to fetch HR names from the hr_details table
    const result = await pool.query(`
      SELECT hr_name 
      FROM hr_details;
    `);

    // Extract the HR names from the query result
    const hrNames = result.rows.map(row => row.hr_name);

    // Respond with the HR names in JSON format
    res.json({ success: true, hrNames });
  } catch (error) {
    console.error('Error fetching HR names:', error);
    res.status(500).json({ error: 'An error occurred while fetching HR names' });
  }
});


//hr counts
app.get('/api/hr-phases', async (req, res) => {
  const hrName = req.query.hrName; // Get the HR name from query parameters
  if (!hrName) {
    return res.status(400).json({ success: false, error: 'HR name is required' });
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
    console.error('Error fetching Candidates phases:', error);
    res.status(500).json({ success: false, error: 'An error occurred while fetching Candidates phases' });
  }
});

//phase count
app.get('/api/phase-counts', async (req, res) => {
  try {
      const query = `
          SELECT 
              hr_email,
              recruitment_phase,
              COUNT(*) AS phase_count
          FROM 
              candidate_info
          GROUP BY 
              hr_email, recruitment_phase;
      `;
      
      // Execute the query using pool.query
      const result = await pool.query(query);
      
      // Send the result back as JSON
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch phase counts' });
  }
});

//admin details

app.post('/api/add-admin', async (req, res) => {
  const { vamid, name, email, ec_mapping, status } = req.body;
 
  // Check for required fields including status
  if (!vamid || !name || !email || !ec_mapping || !status) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields.',
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
      message: 'User added/updated successfully!',
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while adding the user.',
    });
  }
});
 
 
 
app.get('/api/admin-details', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vamid, email, name, ec_mapping, status
      FROM admin_table
    `);
 
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }
 
    // Format the data for the frontend
    const formattedData = result.rows.map(row => {
      // Split ec_mapping by commas and trim any extra spaces
      const ecMapping = row.ec_mapping ? row.ec_mapping.split(',').map(item => item.trim()) : [];
 
      return {
        vamid: row.vamid,
        email: row.email,
        name: row.name,
        cloudEC: ecMapping.includes('Cloud EC'), // Check if Cloud EC exists in ec_mapping
        appEC: ecMapping.includes('App EC'),     // Check if App EC exists in ec_mapping
        dataEC: ecMapping.includes('Data EC'),   // Check if Data EC exists in ec_mapping
        coreEC: ecMapping.includes('Core EC'),    // Check if Core EC exists in ec_mapping
        status: row.status
      };
    });
 
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching admin details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
 
app.post('/api/update-ec-mapping', async (req, res) => {
  const { selectedAdmins } = req.body;
 
  if (!selectedAdmins || selectedAdmins.length === 0) {
    return res.status(400).json({ message: 'No admin selections provided' });
  }
 
  try {
    // Iterate over each selected admin and update EC mappings and status
    for (const admin of selectedAdmins) {
      const { vamid, ec_mapping, status } = admin;
 
      if (!vamid || !ec_mapping || !status) {
        continue; // Skip this admin if there's missing data
      }
 
      // Check if the record exists in the admin_table
      const result = await pool.query('SELECT * FROM admin_table WHERE vamid = $1', [vamid]);
 
      if (result.rows.length === 0) {
        // Insert a new record if no matching vamid is found
        await pool.query(`
          INSERT INTO admin_table (vamid, ec_mapping, status)
          VALUES ($1, $2, $3)
        `, [vamid, ec_mapping, status]);
 
      } else {
        // Update the existing record with the new EC mappings and status
        await pool.query(`
          UPDATE admin_table
          SET ec_mapping = $1, status = $2
          WHERE vamid = $3
        `, [ec_mapping, status, vamid]);
      }
    }
 
    return res.status(200).json({ success: true, message: 'EC mappings and status updated successfully!' });
  } catch (error) {
    console.error('Error updating EC mappings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/get-panel-emails', async (req, res) => {
  try {
    const { domain } = req.query;  // Get domain from query parameters
    
    if (!domain) {
      return res.status(400).json({ message: 'Domain is required' });
    }
    
    // Query the database for emails based on the domain
    const result = await pool.query(`
      SELECT email
      FROM panel_details
      WHERE account = $1
    `, [domain]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No emails found for the selected domain' });
    }

    // Extract emails from the result
    const emails = result.rows.map(row => row.email);

    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching panel emails:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function addVisibilityColumn() {
  try {
    await pool.query(`ALTER TABLE candidate_info ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;`);
    console.log("Visibility column added successfully.");
  } catch (error) {
    console.error("Error adding visibility column:", error);
  }
}
addVisibilityColumn();

// Function to get the correct date range
function getDateRange(filterType) {
  const currentDate = new Date();
  let startDate, endDate;

  if (filterType === 'last_week') {
    startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 7); // Last 7 days including today
    endDate = currentDate;
  } else if (filterType === 'last_month') {
    const previousMonth = currentDate.getMonth() - 1;
    startDate = new Date(currentDate.getFullYear(), previousMonth, 1); // Start of last month
    endDate = new Date(currentDate.getFullYear(), previousMonth + 1, 0); // End of last month
  } else {
    return null; // Overall case
  }

  return { 
    startDate: startDate.toISOString().split('T')[0], 
    endDate: endDate.toISOString().split('T')[0] 
  };
}

// API to update visibility in the database
app.post('/api/update-visibility', async (req, res) => {
  const { filterType, startDate, endDate } = req.body;

  if (!filterType) {
      return res.status(400).json({ error: 'Filter type is required.' });
  }

  try {
      await pool.query(`UPDATE candidate_info SET visible = FALSE;`); // Hide all records first

      if (filterType === 'custom_range' && startDate && endDate) {
          await pool.query(
              `UPDATE candidate_info SET visible = TRUE WHERE date BETWEEN $1 AND $2;`,
              [startDate, endDate]
          );
      } else {
          const dateRange = getDateRange(filterType);
          if (dateRange) {
              await pool.query(
                  `UPDATE candidate_info SET visible = TRUE WHERE date BETWEEN $1 AND $2;`,
                  [dateRange.startDate, dateRange.endDate]
              );
          } else {
              await pool.query(`UPDATE candidate_info SET visible = TRUE;`); // Show all for "Overall"
          }
      }

      res.status(200).json({ message: `Records updated for filter: ${filterType}` });
  } catch (error) {
      console.error('Error updating visibility:', error);
      res.status(500).json({ error: 'Failed to update visibility.' });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
