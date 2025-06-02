function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show", type);

  // Remove the toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
document.getElementById("ec-name").value = getQueryParam("selectedValue") || "";

function navigateToPage() {
  window.location.href = "ECselection.html";
}
async function loadCandidateCounts() {
  try {
    const response = await fetch("https://demotag.vercel.app/api/candidate-counts");
    const data = await response.json();

    // Update the counts on the page
    document.getElementById("uploadCount").innerText = data.totalCount;
    document.getElementById("shortlistedCount").innerText =
      data.shortlistedCount;
    document.getElementById("rejectedCount").innerText = data.rejectedCount;
  } catch (error) {
    console.error("Error fetching candidate counts:", error);
  }
}

// Call the function to load data when the page loads
document.addEventListener("DOMContentLoaded", loadCandidateCounts);

function navigateTo(page) {
  window.location.href = page;
}
// AWS S3 configuration

AWS.config.update({
  region: "us-east-1", // Update with your region
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:583ab747-d668-4305-8c02-0a7e39d4b791", // Update with your Identity Pool ID
  }),
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: "tagteam-bucket" }, // Update with your bucket name if needed
});

let selectedRole = "";
let selectedCloudProvider = "";
let globalSelectedLevel = "";

function fetchJobDescription(role, cloudProvider, selectedLevel) {
  globalSelectedLevel = selectedLevel;
  console.log("Selected role:", role);
  console.log("Cloud Provider:", cloudProvider);
  console.log("selected level:", selectedLevel);

  let fileName = "";
  switch (role) {
    case "Cloud Native Application Engineer - Backend":
      fileName = `Job Description/${selectedLevel}_${cloudProvider}_App.txt`;
      break;
    case "Cloud Native Application Engineer - Frontend":
      fileName = `Job Description/${selectedLevel}_${cloudProvider}_App.txt`;
      break;
    case "LCNC Platform Engineer":
      fileName = `Job Description/${selectedLevel}_${cloudProvider}_APP.txt`;
      break;
    case "Integration Engineer":
      fileName = `Job Description/${selectedLevel}_${cloudProvider}_App.txt`;
      break;
    default:
      console.log("Role not found");
      return Promise.reject("Role not found");
  }

  var params = {
    Bucket: "tagteam-bucket", // Make sure this matches the bucket name in S3
    Key: fileName,
  };

  console.log("Fetching file with params:", params); // Debugging info

  return new Promise((resolve, reject) => {
    s3.getObject(params, function (err, data) {
      if (err) {
        console.log("Error fetching file:", err);
        reject(err);
      } else {
        globalJobDescription = data.Body.toString("utf-8");
        console.log("Fetched Job Description Content:", globalJobDescription);
        resolve(globalJobDescription);
      }
    });
  });
}

function selectRoleAndOpenPopup(role, dropdownId) {
  console.log("Selected role:", role);
  selectedRole = role;

  // Get the selected cloud provider value
  var cloudProvider = document.querySelector(
    'input[name="cloudProvider"]:checked'
  );
  if (!cloudProvider) {
    // Show the custom popup if no cloud provider is selected
    document.getElementById("cloudProviderPopup").style.display = "block";
    return; // Stop further execution
  }
  selectedCloudProvider = cloudProvider ? cloudProvider.value : null;

  // Log the selected cloud provider
  console.log("Selected Cloud Provider:", selectedCloudProvider);

  // Get the selected level from the specific dropdown using its id
  var selectedLevel = document.getElementById(dropdownId).value;
  console.log("Selected Level:", selectedLevel); // Log the selected dropdown value

  openPopup(); // Open the popup after setting the role and provider

  // Fetch job description after the popup is opened
  fetchJobDescription(role, selectedCloudProvider, selectedLevel)
    .then((jobDescription) => {
      console.log("Job description fetched:", jobDescription);
    })
    .catch((error) => {
      console.error("Error fetching job description:", error);
    });
}

function closeCloudProviderPopup() {
  document.getElementById("cloudProviderPopup").style.display = "none";
}

function openPopup() {
  document.getElementById("resume-popup").style.display = "flex";
}

function closePopup() {
  document.getElementById("resume").value = "";
  document.getElementById("resume-popup").style.display = "none";
  var progressBar = document.querySelector(".progress-bar");
  progressBar.style.width = "0%";
}

// Declare a global variable for HR email
let globalHrEmail;
let globalRrfId;

async function uploadResume() {
  var fileInput = document.getElementById("resume");
  var file = fileInput.files[0];

  // Get the HR email input
  var hrEmail = document.getElementById("hr-email").value;
  var rrfId = document.getElementById("RRF-ID").value;

  // Validate HR email
  if (!hrEmail || !validateEmail(hrEmail)) {
    displaySuccessPopup("Please enter a valid HR email.");
    return;
  }

  // Store the HR email in the global variable
  globalHrEmail = hrEmail;
  globalRrfId = rrfId;

  // Get the selected cloud provider value
  var cloudProvider = document.querySelector(
    'input[name="cloudProvider"]:checked'
  );
  var selectedProvider = cloudProvider ? cloudProvider.value : null;
  console.log("Selected Cloud Provider:", selectedProvider);

  if (file) {
    var progressBar = document.querySelector(".progress-bar");
    progressBar.style.width = "0%"; // Reset progress bar

    // Start progress bar animation
    animateProgressBar(progressBar);

    try {
      let processedFile = file;

      // Check if the file is a .docx file
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        displaySuccessPopup("Converting DOCX to PDF, please wait...");

        // Prepare the file for upload to the conversion endpoint
        let formData = new FormData();
        formData.append("word", file);

        // Send the file to the /docxtopdf endpoint for conversion
        const response = await fetch("https://demotag.vercel.app/docxtopdf", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          processedFile = new File([blob], file.name.replace(".docx", ".pdf"), {
            type: "application/pdf",
          });
          displaySuccessPopup("DOCX file successfully converted to PDF.");
        } else {
          throw new Error("Error converting DOCX to PDF.");
        }
      } else if (file.type !== "application/pdf") {
        throw new Error(
          "Unsupported file type. Please upload a PDF or DOCX file."
        );
      }

      // Simulate upload delay (for demonstration purposes)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Upload the resume to GitHub
      var originalFileName = processedFile.name;
      var timestamp = Date.now();
      var fileName = timestamp + "_" + originalFileName;
      var githubUrl = await uploadToGitHub(fileName, processedFile);

      if (githubUrl) {
        // Resume successfully uploaded
        progressBar.style.width = "100%"; // Set progress bar to 100% on success
        displaySuccessPopup(
          "Resume uploaded successfully: " + processedFile.name
        );
     closePopup();
        setTimeout(function() {
          closeSuccessPopup(); // You should have a function that closes the popup
        }, 3000); // Assuming this closes another popup or message

        document.querySelector(".role-selection-container").style.display =
          "none";
        document.querySelector(".container").style.display = "block";

        // Send the resume URL to ChatPDF API for evaluation
        await evaluateResumeWithChatPDF(githubUrl);
      } else {
        // Resume already evaluated, reset the progress bar
        console.log("Inside else block: Resume already evaluated");
        progressBar.style.width = "0%";

        setTimeout(() => {
          displaySuccessPopup("Resume already evaluated.");
          closePopup();
        }, 100); // slight delay helps with UI race conditions
      }
    } catch (error) {
      console.error("Error uploading file: ", error);
      progressBar.style.width = "0%"; // Reset progress bar on failure
      displaySuccessPopup("Failed to upload resume.");
    }
  } else {
    displaySuccessPopup("Please upload a valid PDF or DOCX file.");
  }
}

// Helper function to validate email
function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function displaySuccessPopup(message) {
  var popup = document.getElementById("successPopup");
  var popupMessage = document.getElementById("popupMessage");
  popupMessage.textContent = message;
  popup.style.display = "block";
}

function closeSuccessPopup() {
  var popup = document.getElementById("successPopup");
  popup.style.display = "none";
}

function animateProgressBar(progressBar) {
  var width = 0;
  var interval = setInterval(function () {
    if (width >= 90) {
      // Stop at 90% until upload finishes
      clearInterval(interval);
    } else {
      width++;
      progressBar.style.width = width + "%";
    }
  }, 20); // Adjust speed as necessary
}
async function getGithubToken() {
  try {
    const response = await fetch("https://demotag.vercel.app/api/github-token");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    return data.token; // Return the GitHub token
  } catch (error) {
    console.error("Failed to fetch GitHub token:", error);
    return null; // Handle the error as needed
  }
}

async function uploadToGitHub(fileName, file) {
  const githubToken = await getGithubToken(); // Fetch the GitHub token here
  if (!githubToken) {
    console.error("GitHub token is not available.");
    return null;
  }
  const repoOwner = "MohansaiAnde"; // Your GitHub username
  const repoName = "Tagteam"; // Your repository name

  const folderPath = "resumes"; // Folder where resumes are stored

  // Sanitize the file name
  const sanitizedFileName = fileName.includes("_")
    ? fileName.split("_").slice(1).join("_")
    : fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}/${sanitizedFileName}`;

  try {
    // Get the total number of resumes in the folder
    const folderApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`;
    const folderResponse = await fetch(folderApiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    });

    if (folderResponse.status === 200) {
      const folderData = await folderResponse.json();
      const totalResumes = folderData.length;
      console.log(`Total resumes before upload: ${totalResumes}`);
    } else {
      console.error(
        "Failed to retrieve folder contents:",
        await folderResponse.text()
      );
    }

    // Read the file content
    const fileReader = new FileReader();
    const base64Content = await new Promise((resolve, reject) => {
      fileReader.onload = (event) => resolve(event.target.result.split(",")[1]); // Extract base64 content
      fileReader.onerror = (error) => reject(error);
      fileReader.readAsDataURL(file);
    });

    // Check if the file already exists in the GitHub repository
    const checkFileResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    });

    let sha = null;
    if (checkFileResponse.status === 200) {
      // File exists, get the sha
      const existingFileData = await checkFileResponse.json();
      sha = existingFileData.sha;

      // Get existing file's content and compare it with the current file
      const existingBase64Content = existingFileData.content.replace(/\n/g, ""); // Remove newlines for comparison
      if (existingBase64Content === base64Content) {
        console.log("The file content is the same. No upload needed.");
        return null;
      }
    }

    // Proceed with the upload if the file doesn't exist or content has changed
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload resume: ${sanitizedFileName}`,
        content: base64Content,
        sha: sha, // Include the sha if it's an update
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("Resume uploaded successfully.");

      // Get the updated total number of resumes after the upload
      const updatedFolderResponse = await fetch(folderApiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
        },
      });

      if (updatedFolderResponse.status === 200) {
        const updatedFolderData = await updatedFolderResponse.json();
        const count = updatedFolderData.length;
        console.log(`Total resumes after upload: ${count}`);

        // Send updated count to the database
        await sendCountToDatabase(count);
      } else {
        console.error(
          "Failed to retrieve updated folder contents:",
          await updatedFolderResponse.text()
        );
      }

      return responseData.content.download_url; // Return the GitHub download URL
    } else {
      console.error("GitHub API error:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

// Function to send resume count to the database
async function sendCountToDatabase(count) {
  try {
    const response = await fetch("https://demotag.vercel.app/send-resumes-count", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count }),
    });

    if (response.ok) {
      console.log("Resumes count updated successfully.");
    } else {
      console.error("Failed to update count:", await response.text());
    }
  } catch (error) {
    console.error("Error sending count to database:", error);
  }
}

async function getValidApiKey(resumeUrl) {
  const apiKeys = [
    "sec_E4JRJ65jEgOUQLyjvOBOLBgx28e6IAV1",
    "sec_w01JRJV5FqzTdgtkwHsz9VYyJqTnsOxB",
    "sec_hHOWE4EocbyJfrqnU7ZLDFKxhiZwSQRY", // Add more keys as needed
    "sec_q9zdNmA1zOPQY5YrN6oXTucSLAjTzE2P",
    "sec_ZsT30w926Wlo35LdJ0kpOWXprarObgwP",
    "sec_ELtQJOZKC9dGCpaTRqb8kVzLSiOvfT89",
    "sec_zk4jxZJSQh95LaNGVebPta6bGfEM6yVl",
  ];
  for (let apiKey of apiKeys) {
    try {
      const apiUrl = "https://api.chatpdf.com/v1/sources/add-url";

      // Try sending the resume URL with the current API key
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ url: resumeUrl }),
      });

      if (response.ok) {
        console.log(`Valid API key found: ${apiKey}`);
        return apiKey; // Return the valid key
      } else if (response.status === 401) {
        console.warn(
          `API key expired or unauthorized: ${apiKey}. Trying the next key...`
        );
      } else if (response.status === 403) {
        console.warn(
          `Quota exceeded for API key: ${apiKey}. Moving to the next key...`
        );
      } else if (response.status === 429) {
        console.error(`Rate limit exceeded for API key: ${apiKey}.`);
        return null; // Exit if rate limit is exceeded, as further retries might not work
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error with API key: ${apiKey}`, error.message);
    }
  }

  console.error("No valid API key found.");
  return null; // Return null if no key works
}

async function evaluateResumeWithChatPDF(resumeUrl) {
  console.log("Resume URL:", resumeUrl);
  console.log("Job Description:", globalJobDescription);
  document.getElementById("loading-popup").style.display = "block";

  if (!globalJobDescription) {
    console.error("Job description is empty. Cannot proceed.");
    return;
  }

  const validApiKey = await getValidApiKey(resumeUrl);
  if (!validApiKey) {
    document.getElementById("loading-popup").style.display = "none";
    document.getElementById("evaluation-result-container").innerHTML =
      "All API keys failed. Please update your API key list.";
    return;
  }

  try {
    // Resume evaluation code continues here...
    const apiUrl = "https://api.chatpdf.com/v1/sources/add-url";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": validApiKey,
      },
      body: JSON.stringify({ url: resumeUrl }),
    });

    const uploadData = await response.json();
    const sourceId = uploadData.sourceId;

    // Request for evaluation of the resume with job description
    const evaluationResponse = await fetch(
      "https://api.chatpdf.com/v1/chats/message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": validApiKey,
        },
        body: JSON.stringify({
          sourceId: sourceId,
          messages: [
            {
              role: "user",
              content: `
                You are an expert HR assistant tasked with pre-screening resumes. Given a resume, analyze it thoroughly and provide a structured evaluation based on the following criteria:
    
    **Job Role Retrieval:**
    ${globalJobDescription}
    
    **Candidate Overview:**
    - Extract the candidate's full name.
    - Identify the total years of professional experience.
    - Determine the current or most recent job designation.
    
    **Contact Information:**
    - Verify if essential details (email, phone number, location) are present.
    
    **Education:**
    - Identify the highest level of education and the field of study.
    - Note any relevant certifications or specialized training.
    
    **Work Experience:**
    - Summarize the candidate's work history, focusing on the most recent or relevant positions.
    - Highlight any roles or responsibilities that align with the job opening.
    
    **Skills:**
    - List key technical and soft skills mentioned.
    - Identify any skills that are particularly relevant to the position.
    
    **Achievements:**
    - Note any significant accomplishments or awards.
    - Highlight quantifiable achievements (e.g., "increased sales by 20%").
    
    **Candidate Stability:**
    - Note any red flags (e.g., unexplained gaps in employment, frequent job changes).
    
    **Skill Gaps**
    - Evaluate the candidate’s resume by comparing the listed skills against the required technical skills for the specified job role.
    - Identify any gaps where the candidate lacks experience or proficiency.
    - For each gap, briefly explain the missing skill and its relevance to the role, using specific keywords to highlight the absence of those skills.
    - If the candidate is rejected, include the explanation of the skill gaps in the result. 
    **Result:** Based on the analysis for the role of [Current Role] – Strong Match (meets/exceeds most requirements), Potential Match (meets key but lacks some), Not Suitable (does not meet essentials); add "Shortlisted for the next round" if suitable, or "Rejected" with gaps if not. Analyze and give the suitability percentage.
                            `,
            },
          ],
        }),
      }
    );

    if (!evaluationResponse.ok) {
      const errorText = await evaluationResponse.text();
      throw new Error(
        `HTTP error! status: ${evaluationResponse.status}, message: ${errorText}`
      );
    }

    const evaluationData = await evaluationResponse.json();
    const evaluationContent = evaluationData.content; // Assuming structured evaluation text is in `content`

    // Request for generating multiple-choice questions
    const questionResponse = await fetch(
      "https://api.chatpdf.com/v1/chats/message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": validApiKey,
        },
        body: JSON.stringify({
          sourceId: sourceId,
          messages: [
            {
              role: "user",
              content: `
                            Analyze the technical skills extracted from the resume and generate multiple-choice questions that assess the candidate's knowledge and expertise in those skills. Focus on:
                          1. Core technical skills and tools mentioned in the resume.
                          2. Industry-standard practices related to these skills.
                          3. Technical concepts and their applications.
                          For each skill, generate a question with four answer options (A, B, C, D), including one correct answer.
                          `,
            },
          ],
        }),
      }
    );

    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      throw new Error(
        `HTTP error! status: ${questionResponse.status}, message: ${errorText}`
      );
    }

    const questionData = await questionResponse.json();
    const questionsContent = questionData.content;

    document.getElementById("loading-popup").style.display = "none";

    // Display evaluation in cards
    displayEvaluationInCards(
      evaluationContent,
      resumeUrl,
      globalHrEmail,
      globalRrfId,
      selectedValue
    );

    // Log questions content (can be displayed as needed)
    console.log(questionsContent);
    return; // Exit loop after a successful request
  } catch (error) {
    console.error(`Error with API key: ${apiKey}`, error.message);
  }
  document.getElementById("loading-popup").style.display = "none";
  document.getElementById("evaluation-result-container").innerHTML =
    "All API keys failed. Please update your API key list.";
}

async function processResumeEvaluation(resumeUrl, role) {
  try {
    const jobDescription = await fetchJobDescription(role);
    if (jobDescription) {
      console.log("Job description fetched:", jobDescription); // Log to verify
      const evaluationResult = await evaluateResumeWithChatPDF(
        resumeUrl,
        jobDescription
      );
      console.log("Evaluation result:", evaluationResult);
      // Handle the evaluation result, display it on UI, etc.
    } else {
      console.error("Job description is empty after fetching.");
    }
  } catch (error) {
    console.error("Error in processing resume evaluation:", error);
  }
}
// Global variable to store the selected role

function downloadContentAsFile(
  content,
  candidateName,
  selectedRole,
  globalSelectedLevel,
  selectedCloudProvider,
  statusText
) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin + 15; // Starting yPosition
  const lineHeight = 8;
  const maxYPosition = pageHeight - margin;
  // let suitabilityPercentage = '';  // Define suitabilityPercentage here

  // Function to add a new page and reset y position
  function addNewPage() {
    doc.addPage();
    yPosition = margin + 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(
      margin - 5,
      margin - 5,
      contentWidth + 10,
      pageHeight - margin,
      "F"
    );
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(
      margin - 5,
      margin - 5,
      contentWidth + 10,
      pageHeight - margin,
      "S"
    );
  }

  // Add background and borders for the first page
  doc.setFillColor(240, 240, 240);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin, "F");
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin, "S");

  // Add the title (Evaluation Report) and candidate name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text(`Evaluation Report for: ${candidateName.trim()}`, margin, yPosition);
  yPosition += 10;

  // Add the role title
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text(
    `Role: ${globalSelectedLevel}_${selectedCloudProvider}_${selectedRole.trim()}`,
    margin,
    yPosition
  );
  yPosition += 15;

  // Only include specific sections
  const sections = [
    { title: "Candidate Overview", keyword: "Candidate Overview" },
    { title: "Candidate Stability", keyword: "Candidate Stability" },
    { title: "Result", keyword: "Result" },
  ];

  sections.forEach((section) => {
    const startIndex = content.indexOf(section.keyword);
    const endIndex = content.indexOf("\n\n", startIndex);

    if (startIndex !== -1) {
      let sectionContent = content
        .substring(startIndex, endIndex)
        .trim()
        .replace(/[#*]/g, "");

      // Remove the section keyword from the content
      sectionContent = sectionContent
        .replace(new RegExp(`${section.keyword}\\s*:?`), "")
        .trim();

      // Add the section title to the PDF
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.setFont("helvetica", "bold");
      if (yPosition + 15 > maxYPosition) {
        addNewPage();
      }
      doc.text(section.title, margin, yPosition);
      yPosition += 10;

      // Add section content to the PDF
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(sectionContent, contentWidth);

      lines.forEach((line) => {
        if (yPosition + lineHeight > maxYPosition) {
          addNewPage();
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 5; // Spacing between sections

      // Check if the section is the "Result" section to extract statusText and suitabilityPercentage
      if (section.title === "Result") {
        if (
          sectionContent.includes("Shortlisted for the next round") ||
          suitabilityPercentage >= 75
        ) {
          statusText = "Shortlisted";
        } else if (sectionContent.includes("Rejected")) {
          statusText = "Rejected";
        }

        // Always extract the suitability percentage
        const percentageMatch = sectionContent.match(
          /Suitability Percentage:\s*(\d+)%/
        );
        suitabilityPercentage = percentageMatch ? percentageMatch[1] : "";

        // if (suitabilityPercentage >= 75) {
        //     statusText = "Shortlisted";
        // }

        console.log("Candidate Status:", statusText);
      }
    }
  });

  // Set default for statusText if undefined
  statusText = statusText || "Rejected";

  // Append the status text in the PDF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(statusText === "Shortlisted" ? "green" : "red");

  // Construct status message
  let statusTextWithPercentage = `Status: ${statusText}`;
  if (suitabilityPercentage) {
    statusTextWithPercentage += ` (${suitabilityPercentage}% Matching With JD)`;
  }

  // Add status to the PDF
  if (yPosition + lineHeight > maxYPosition) {
    addNewPage();
  }
  doc.text(statusTextWithPercentage, margin, yPosition);

  // Save the PDF with the file name
  const currentDate = new Date().toISOString().split("T")[0];
  const fileName = `${candidateName.trim()}_${globalSelectedLevel}_${selectedCloudProvider}_${selectedRole.trim()}_${currentDate}.pdf`;
  doc.save(fileName);
}

// Function to display evaluation content in card format and allow downloading as PDF

function displayEvaluationInCards(
  content,
  resumeUrl,
  globalHrEmail,
  globalRrfId,
  selectedValue
) {
  console.log("Evaluation Content:", content);

  const container = document.getElementById("evaluation-result-container");
  container.innerHTML = ""; // Clear any previous content
  //let selectedLevel = document.getElementById(dropdownId) ? document.getElementById(dropdownId).value : "Unknown Level"; // Ensure selectedLevel is captured

  const nameKeyword = "Full Name:";
  let candidateName = "";
  let role =
    (globalSelectedLevel || "Unknown Level") +
    " " +
    (selectedCloudProvider || "Unknown Provider") +
    " " +
    (selectedRole || "Unknown Role");
  let candidateEmail = ""; // To store the candidate's email for the invitation
  let candidateStatus = ""; // To store the candidate status (Shortlisted or Rejected)
  let cloudProvider = selectedCloudProvider || "Unknown provider";
  let candidatePhoneNumber = "";

  // Extract the candidate name for UI display
  if (content.includes(nameKeyword)) {
    const startIndex = content.indexOf(nameKeyword) + nameKeyword.length;
    const endIndex = content.indexOf("\n", startIndex);
    candidateName = content.substring(startIndex, endIndex).trim();
  }

  // Extract the email from the content (assuming it follows a specific format)
  // Extract the email from the content (assuming it follows a specific format)
  const emailKeyword = "Email:"; // Change as per actual content format
  if (content.includes(emailKeyword)) {
    const startIndex = content.indexOf(emailKeyword) + emailKeyword.length;
    const endIndex = content.indexOf("\n", startIndex);
    candidateEmail = content.substring(startIndex, endIndex).trim();

    // Remove any "**" characters from the email
    candidateEmail = candidateEmail.replace(/\*\*/g, "");

    // Remove any spaces inside the email
    candidateEmail = candidateEmail.replace(/\s+/g, "");
  }

  const phonekeyword = "Phone Number:";
  if (content.includes(phonekeyword)) {
    const startIndex = content.indexOf(phonekeyword) + phonekeyword.length;
    const endIndex = content.indexOf("\n", startIndex);
    candidatePhoneNumber = content.substring(startIndex, endIndex).trim();

    // Remove any "**" characters from the email
    candidatePhoneNumber = candidatePhoneNumber.replace(/\*\*/g, "");

    // Remove any spaces inside the email
    candidatePhoneNumber = candidatePhoneNumber.replace(/\s+/g, "");
  }

  // Extract the role from the content if it's there, otherwise use the selectedRole
  const roleKeyword = "Job Role Retrieval";
  if (content.includes(roleKeyword)) {
    const startIndex = content.indexOf(roleKeyword) + roleKeyword.length;
    const endIndex = content.indexOf("\n", startIndex);
    role = content.substring(startIndex, endIndex).trim();
  }

  // Display the candidate name in the UI if available
  if (candidateName) {
    candidateName = candidateName.replace(/\*\*/g, "");
    candidateName = candidateName.replace(/\s+/g, "");
    const nameHeading = document.createElement("h2");
    nameHeading.textContent = `Candidate: ${candidateName}`;
    nameHeading.classList.add("hidden");
    container.appendChild(nameHeading);
  }

  if (role) {
    const roleHeading = document.createElement("h3");
    roleHeading.textContent = `Role: ${role}`;
    roleHeading.classList.add("hidden");
    container.appendChild(roleHeading);
  }

  const sections = [
    { title: "Job Role Retrieval", keyword: "Job Role Retrieval" },
    { title: "Candidate Overview", keyword: "Candidate Overview" },
    { title: "Contact Information", keyword: "Contact Information" },
    { title: "Education", keyword: "Education" },
    { title: "Work Experience", keyword: "Work Experience" },
    { title: "Skills", keyword: "Skills" },
    { title: "Achievements", keyword: "Achievements" },
    { title: "Candidate Stability", keyword: "Candidate Stability" },
    { title: "Skill Gaps", keyword: "Skill Gaps" },
    { title: "Result", keyword: "Result" },
  ];

  let textContent = ""; // Do not include candidate name here
  let anyContentDisplayed = false; // Flag to check if any content is added
  let isShortlisted = false; // Flag to determine if the candidate is shortlisted
  let statusText = ""; // To store status (shortlisted or rejected)
  let suitabilityPercentage = ""; // Store percentage of matching suitability

  sections.forEach((section, index) => {
    const startIndex = content.indexOf(section.keyword);
    const nextIndex =
      index < sections.length - 1
        ? content.indexOf(sections[index + 1].keyword)
        : content.length;

    if (startIndex !== -1) {
      anyContentDisplayed = true; // Set flag to true if any section is displayed

      let sectionContent = content.substring(startIndex, nextIndex).trim();
      sectionContent = sectionContent.replace(/[#*]/g, "");

      // Remove the section title from the content
      sectionContent = sectionContent
        .replace(new RegExp(`${section.keyword}\\s*:?`), "")
        .trim();

      // Shorten the content to a preview
      const previewContent = sectionContent.split("\n").slice(0, 3).join("\n"); // Show only the first 3 lines

      const card = document.createElement("div");
      card.classList.add("card");
      card.style.color = "#b0b0b0";

      const heading = document.createElement("h2");
      heading.textContent = section.title;
      card.appendChild(heading);

      const p = document.createElement("p");
      p.textContent = previewContent;
      card.appendChild(p);

      container.appendChild(card);

      // Add the section content to the downloadable text (without candidate name)
      textContent += `${section.title}\n${sectionContent}\n\n`;

      // Check if the recommendation section includes "Shortlisted" or "Rejected"
      // Check if the recommendation section includes "Shortlisted" or "Rejected"
      if (section.title === "Result") {
        finalSummary = sectionContent;
        suitabilityPercentage = sectionContent.match(
          /Suitability Percentage:\s*(\d+)%/
        )?.[1];
        if (
          sectionContent.includes("Shortlisted for the next round") ||
          suitabilityPercentage >= 75
        ) {
          statusText = "Shortlisted";
          suitabilityPercentage = sectionContent.match(
            /Suitability Percentage:\s*(\d+)%/
          )?.[1]; // Extract percentage
          isShortlisted = true; // Mark as shortlisted
        } else if (sectionContent.includes("Rejected")) {
          statusText = "Rejected";
          suitabilityPercentage = sectionContent.match(
            /Suitability Percentage:\s*(\d+)%/
          )?.[1];
        }

        // Print status in the console
        console.log("Candidate Status:", statusText); // Prints Shortlisted or Rejected

        // Send the status to the database based on the result
        const updateField =
          statusText === "Rejected" ? "rejected" : "shortlisted";

        // API call to update the relevant column in resume_counts
        fetch("https://demotag.vercel.app/update-resume-count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field: updateField,
            value: 1, // Increment the count by 1
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Database update successful:", data);
          })
          .catch((error) => {
            console.error("Error updating database:", error);
          });
      }
    }
  });

  // Find the "Recommendation" heading and append status text next to it
  const headings = document.querySelectorAll("h2"); // Get all h2 elements
  headings.forEach((heading) => {
    if (heading.textContent.trim() === "Result") {
      const statusSpan = document.createElement("span");
      statusSpan.textContent = statusText
        ? ` - ${statusText} (${suitabilityPercentage}% Matching With JD)`
        : "";
      statusSpan.style.color = statusText === "Shortlisted" ? "green" : "red";
      heading.appendChild(statusSpan);
    }
  });

  // If no valid content was displayed, show an error popup
  if (!anyContentDisplayed) {
    displayInvalidFormatPopup(
      "The content format is invalid or the required sections are missing."
    );
    return;
  }

  sendCandidateInfoToDB(
    candidateName,
    candidateEmail,
    statusText,
    role,
    suitabilityPercentage,
    candidatePhoneNumber,
    resumeUrl,
    globalHrEmail,
    globalRrfId,
    selectedValue
  );
  sendPrescreeningInfoToDB(
    candidateName,
    candidateEmail,
    statusText,
    role,
    suitabilityPercentage,
    candidatePhoneNumber,
    resumeUrl,
    globalHrEmail,
    globalRrfId
  );
  sendRRFToDB(globalRrfId, role, selectedValue, (status = "open"));
  sendCandidateDetailsToHR(
    candidateName,
    candidateEmail,
    statusText,
    role,
    suitabilityPercentage,
    candidatePhoneNumber,
    resumeUrl,
    globalHrEmail,
    globalRrfId,
    selectedValue,
    finalSummary
  );

  // Create a unique container for inputs and button
  const feedbackContainer = document.createElement("div");
  feedbackContainer.classList.add("feedback-container");

  // Create email input field
  // const emailInput = document.createElement('input');
  // emailInput.type = 'email';
  // emailInput.placeholder = 'Enter Email';
  // emailInput.value = candidateEmail; // Prefill with candidateEmail value
  // emailInput.classList.add('editable-field');
  // emailInput.style.marginBottom = '10px'; // Add spacing
  // feedbackContainer.appendChild(emailInput);

  // // Create phone number input field
  // const phoneInput = document.createElement('input');
  // phoneInput.type = 'tel';
  // phoneInput.placeholder = 'Enter Phone Number';
  // phoneInput.value = candidatePhoneNumber; // Prefill with candidatePhoneNumber value
  // phoneInput.classList.add('editable-field');
  // phoneInput.style.marginBottom = '20px'; // Add spacing
  // feedbackContainer.appendChild(phoneInput);

  document.body.appendChild(feedbackContainer);

  // Create a download button
  const downloadButton = document.createElement("button");
  downloadButton.classList.add("download-btn");
  downloadButton.innerHTML =
    '<i class="fas fa-download"></i> Download Feedback';
  downloadButton.onclick = () =>
    downloadContentAsFile(
      textContent,
      candidateName,
      selectedRole,
      globalSelectedLevel,
      selectedCloudProvider
    );
  container.appendChild(downloadButton);
  const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";

  // ... rest of your code with the updated URL

  const candidateDetails = {
    candidateName: candidateName,
    candidateEmail: candidateEmail,
    statusText: statusText,
    role: role,
    suitabilityPercentage: suitabilityPercentage,
    candidatePhoneNumber: candidatePhoneNumber,
    finalSummary: finalSummary,
    globalHrEmail: globalHrEmail,
    globalRrfId: globalRrfId,
    eng_center: selectedValue,
  };
  localStorage.setItem("candidateDetails", JSON.stringify(candidateDetails));

  if (!isShortlisted) {
    const nextButton = document.createElement("button");
    nextButton.classList.add("next-btn");
    nextButton.textContent = "Next";
    nextButton.onclick = function () {
      window.location.href = "prescreeningform.html";
    };
    container.appendChild(nextButton);
  }

  // Create a wrapper div for the back button
  const backButtonWrapper = document.createElement("div");
  backButtonWrapper.classList.add("back-button-wrapper"); // Add a class for styling

  const backButton = document.createElement("button");
  backButton.classList.add("back-btnss");
  backButton.innerHTML = "Back";
  backButton.onclick = () => {
    // Navigate to the next step in the process, e.g., scheduling an interview
    document.querySelector(".role-selection-container").style.display = "block";
    document.getElementById("evaluation-result-container").innerHTML = "";
    var progressBar = document.querySelector(".progress-bar");
    progressBar.style.width = "0%"; // Reset progress bar
    location.reload();

    // Adjust the URL as needed
  };
  backButtonWrapper.appendChild(backButton);

  // Add the wrapper div to the container
  container.appendChild(backButtonWrapper);
}
function sendCandidateInfoToDB(
  name,
  email,
  status,
  role,
  suitabilityPercentage,
  candidatePhoneNumber,
  resumeUrl,
  globalHrEmail,
  globalRrfId,
  selectedValue
) {
  // Determine the recruitment phase based on the status
  let recruitmentPhase;

  if (status.toLowerCase() === "rejected") {
    recruitmentPhase = "prescreening";
  } else if (status.toLowerCase() === "shortlisted") {
    recruitmentPhase = "Move to L1";
  }

  // The resume_score column will now store the suitability percentage
  const resume_score = `${suitabilityPercentage}% Matching With JD`;

  fetch("https://demotag.vercel.app/api/add-candidate-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume: resumeUrl,
      candidate_name: name,
      candidate_email: email,
      prescreening_status: status,
      candidate_phone: candidatePhoneNumber,
      role: role,
      recruitment_phase: recruitmentPhase, // Add the recruitment_phase value
      resume_score: resume_score, // Add the suitability percentage as the resume_score
      hr_email: globalHrEmail,
      rrf_id: globalRrfId,
      eng_center: selectedValue,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Candidate information saved successfully:", data);
        const candidateId = data.data.id;
        console.log(`Candidate ID: ${candidateId}`);
        localStorage.setItem("candidateId", candidateId);
      }
    })
    .catch((error) => {
      console.error("Error saving candidate information:", error);
    });
}

function sendPrescreeningInfoToDB(
  name,
  email,
  status,
  role,
  suitabilityPercentage,
  candidatePhoneNumber,
  resumeUrl,
  globalHrEmail,
  globalRrfId
) {
  // Determine the recruitment phase based on the status
  let recruitmentPhase;

  if (status.toLowerCase() === "rejected") {
    recruitmentPhase = "Rejected";
  } else if (status.toLowerCase() === "shortlisted") {
    recruitmentPhase = "Move to L1";
  }

  // The resume_score column will now store the suitability percentage
  const resume_score = `${suitabilityPercentage}% Matching With JD`;

  fetch("https://demotag.vercel.app/api/add-prescreening-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume: resumeUrl,
      candidate_name: name,
      candidate_email: email,
      prescreening_status: status,
      role: role,
      recruitment_phase: recruitmentPhase,
      candidate_phone: candidatePhoneNumber, // Add the recruitment_phase value
      resume_score: resume_score, // Add the suitability percentage as the resume_score
      hr_email: globalHrEmail,
      rrf_id: globalRrfId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Candidate information saved successfully:", data);
    })
    .catch((error) => {
      console.error("Error saving candidate information:", error);
    });
}

const msalConfig = {
  auth: {
    clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673", // Replace with your Azure AD app client ID
    authority:
      "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323", // Replace with your tenant ID
    redirectUri: "https://demotag.vercel.app", // Ensure this matches Azure AD's redirect URI
  },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

async function sendCandidateDetailsToHR(
  candidateName,
  candidateEmail,
  statusText,
  role,
  suitabilityPercentage,
  candidatePhoneNumber,
  resumeUrl,
  globalHrEmail,
  globalRrfId,
  selectedValue,
  finalSummary
) {
  const loggedInUserEmail = localStorage.getItem("userEmail");

  if (!loggedInUserEmail) {
    showToast("User is not logged in. Please log in again.", "error");
    return;
  }

  try {
    // Get the access token for sending email
    const account = msalInstance.getAllAccounts()[0];
    if (!account) {
      throw new Error("No active account! Please login first.");
    }

    const tokenRequest = {
      scopes: ["Mail.Send"],
      account: account,
    };

    // Try to get token silently first
    let tokenResponse;
    try {
      tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        // If silent token acquisition fails, try popup
        tokenResponse = await msalInstance.acquireTokenPopup(tokenRequest);
      } else {
        throw error;
      }
    }

    // Prepare the email data
    const emailData = {
      message: {
        subject: `Prescreening Result: RRFID-${globalRrfId} - ${candidateName} for ${role} Role`,
        body: {
          contentType: "HTML",
          content: `
                            <h3>Candidate Pre-screening Details</h3>
                            <p><strong>Name:</strong> ${candidateName}</p>
                            <p><strong>Email:</strong> ${candidateEmail}</p>
                            <p><strong>Status:</strong> ${statusText}</p>
                            <p><strong>Role:</strong> ${role}</p>
                            <p><strong>Suitability Score:</strong> ${suitabilityPercentage}% Matching With JD</p>
                            <p><strong>Phone Number:</strong> ${candidatePhoneNumber}</p>
                            <p><strong>Resume:</strong> <a href="${resumeUrl}">View Resume</a></p>
                            <p><strong>Result:</strong> ${finalSummary}</p>
                            <br />
                            <p>Please take the necessary actions based on the pre-screening results.</p>
                        `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: globalHrEmail,
            },
          },
        ],
      },
    };

    // Send the email using Microsoft Graph API directly
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ? errorData.error.message : "Failed to send email"
      );
    }

    console.log("Email sent successfully");
    showToast("Email sent successfully!", "success");
  } catch (error) {
    console.error("Error:", error);
    showToast(`Failed to send email: ${error.message}`, "error");

    // If there's a permission error, let the user know they need admin consent
    if (error.message?.includes("permission")) {
      showToast(
        "This app needs permission to send emails. Please contact your administrator to grant the necessary permissions.",
        "error"
      );
    }
  }
}

// Call the function when needed (e.g., on button click)
// document.getElementById('sendEmailButton').addEventListener('click', sendCandidateDetailsToHR);

function sendRRFToDB(globalRrfId, role, selectedValue, status = "open") {
  fetch("https://demotag.vercel.app/api/rrf-update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rrf_id: globalRrfId,
      role: role,
      eng_center: selectedValue,
      rrf_status: status, // This way, you can send a dynamic status
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("RRF information saved successfully:", data);
      }
    })
    .catch((error) => {
      console.error("Error saving RRF information:", error);
    });
}

function displayInvalidFormatPopup(message) {
  console.log("Displaying invalid format popup");

  // Create a popup container
  const popup = document.createElement("div");
  popup.classList.add("popup");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "20px";
  popup.style.backgroundColor = "white";
  popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
  popup.style.zIndex = 1000;

  // Create a message element
  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  popup.appendChild(messageElement);

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.onclick = () => document.body.removeChild(popup);
  popup.appendChild(closeButton);

  // Add popup to the body
  document.body.appendChild(popup);
}
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}
function showInterviews() {
  // Hide the dashboard and table containers
  document.querySelector(".dashboard-container").style.display = "none";
  document.querySelector(".table-container").style.display = "none";
  document.querySelector(".button-container").style.display = "none";

  // Show the interviews section
  document.getElementById("interviews").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  populateRRFDropdownWithSearch();
});

async function populateRRFDropdownWithSearch() {
  try {
    // Fetch RRF IDs from your API
    const response = await fetch('https://demotag.vercel.app/api/rrf-ids');
    const rrfIds = await response.json();
    
    // Get the existing select element
    const selectElement = document.getElementById('RRF-ID');
    
    // Important: Don't remove the original select - just hide it
    // This ensures other functions can still access it
    selectElement.style.display = 'none';
    
    // Create the first option (default option)
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select RRF ID';
    selectElement.appendChild(defaultOption);
    
    // Fill the original select with options from API
    if (rrfIds.length > 0) {
      rrfIds.forEach(id => {
        const option = document.createElement('option');
        option.value = id.rrfid;
        option.textContent = id.rrfid;
        selectElement.appendChild(option);
      });
    }
    
    // Create a container div for our custom dropdown
    const container = document.createElement('div');
    container.style.width = selectElement.style.width || '82%';
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    
    // Create the search input
    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'text');
    searchInput.setAttribute('placeholder', 'Search RRF ID...');
    searchInput.style.width = '100%';
    searchInput.style.padding = selectElement.style.padding || '8px';
    searchInput.style.marginTop = selectElement.style.marginTop || '5px';
    searchInput.style.backgroundColor = selectElement.style.backgroundColor || '#E6E6FA';
    searchInput.style.border = '1px solid #ccc';
    searchInput.style.borderRadius = '4px';
    searchInput.style.boxSizing = 'border-box';
    
    // Create the dropdown list container
    const dropdownList = document.createElement('div');
    dropdownList.style.display = 'none';
    dropdownList.style.position = 'absolute';
    dropdownList.style.width = '100%';
    dropdownList.style.maxHeight = '200px';
    dropdownList.style.overflowY = 'auto';
    dropdownList.style.backgroundColor = '#fff';
    dropdownList.style.border = '1px solid #ccc';
    dropdownList.style.borderTop = 'none';
    dropdownList.style.borderRadius = '0 0 4px 4px';
    dropdownList.style.zIndex = '1000';
    dropdownList.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    // Insert our custom elements right after the hidden select
    selectElement.parentNode.insertBefore(container, selectElement.nextSibling);
    container.appendChild(searchInput);
    container.appendChild(dropdownList);
    
    // Prepare the RRF ID data
    const rrfIdValues = rrfIds.map(id => id.rrfid);
    
    // Set up event listeners
    setupSearchFunctionality(searchInput, dropdownList, rrfIdValues, selectElement);
    
  } catch (error) {
    console.error('Error loading RRF IDs:', error);
  }
}

function setupSearchFunctionality(searchInput, dropdownList, rrfIdValues, originalSelect) {
  // Focus event - show all options
  searchInput.addEventListener('focus', () => {
    updateDropdownOptions(dropdownList, rrfIdValues, searchInput, originalSelect);
    dropdownList.style.display = 'block';
  });

  // Input event - filter options
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredIds = rrfIdValues.filter(id =>
      id.toLowerCase().includes(searchTerm)
    );
    updateDropdownOptions(dropdownList, filteredIds, searchInput, originalSelect);
    dropdownList.style.display = 'block';
  });

  // Blur event - handle manual entry
  searchInput.addEventListener('blur', () => {
    const typedValue = searchInput.value.trim();
    const match = rrfIdValues.find(id => id.toLowerCase() === typedValue.toLowerCase());
    if (match) {
      originalSelect.value = match;
      originalSelect.dispatchEvent(new Event('change'));
    } else {
      // Optionally clear invalid input
      searchInput.value = '';
      originalSelect.value = '';
    }

    // Hide the dropdown after short delay to allow click event if needed
    setTimeout(() => {
      dropdownList.style.display = 'none';
    }, 200);
  });

  // Handle click outside
  document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== dropdownList) {
      dropdownList.style.display = 'none';
    }
  });

  // Prevent dropdown from closing when clicking inside it
  dropdownList.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

function updateDropdownOptions(dropdownList, options, searchInput, originalSelect) {
  // Clear previous options
  dropdownList.innerHTML = '';
  
  if (options.length === 0) {
    const noResults = document.createElement('div');
    noResults.textContent = 'No matching RRF IDs found';
    noResults.style.padding = '8px';
    noResults.style.color = '#666';
    noResults.style.fontStyle = 'italic';
    noResults.style.textAlign = 'center';
    dropdownList.appendChild(noResults);
    return;
  }
  
  // Add filtered options
  options.forEach(option => {
    const optionElement = document.createElement('div');
    optionElement.textContent = option;
    optionElement.style.padding = '8px';
    optionElement.style.cursor = 'pointer';
    optionElement.style.borderBottom = '1px solid #eee';
    
    // Hover effects
    optionElement.addEventListener('mouseover', () => {
      optionElement.style.backgroundColor = '#f5f5f5';
    });
    
    optionElement.addEventListener('mouseout', () => {
      optionElement.style.backgroundColor = '';
    });
    
    // Selection event
    optionElement.addEventListener('click', () => {
      // Update the search input
      searchInput.value = option;
      
      // Update the original select value (CRITICAL for compatibility)
      originalSelect.value = option;
      
      // Trigger change event on original select for any listeners
      const changeEvent = new Event('change', { bubbles: true });
      originalSelect.dispatchEvent(changeEvent);
      
      // Hide dropdown
      dropdownList.style.display = 'none';
      
      console.log('Selected RRF ID:', option);
    });
    
    dropdownList.appendChild(optionElement);
  });
}
async function fetchCandidates() {
  try {
    const response = await fetch("https://demotag.vercel.app/api/candidates");
    const data = await response.json();

    const tableBody = document.querySelector("#candidateTable tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    data.forEach((candidate) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${candidate.candidate_name}</td>
                <td>${candidate.candidate_email}</td>
                <td>${candidate.prescreening_status}</td>
                <td>${candidate.role}</td>
                <td>${candidate.recruitment_phase}</td>
                <td>${candidate.resume_score || "-"}</td>
            `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching candidate data:", error);
  }
}

// Fetch candidates on page load
window.onload = fetchCandidates;

const params = new URLSearchParams(window.location.search);
const selectedValue = params.get("selectedValue");

// Display or use the selected value
if (selectedValue) {
  console.log("Selected Value:", selectedValue); // For debugging
  document.getElementById("selectedValueDisplay").innerText = selectedValue;
}
function addPrefix() {
  const rrfInput = document.getElementById("RRF-ID");
  const value = rrfInput.value;
  if (!value.startsWith("POS-")) {
    rrfInput.value = "POS-" + value.replace(/^POS-/, "");
  }
}


