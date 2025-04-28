function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show", type);

  // Remove the toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
function navigateTo(page) {
  window.location.href = page;
}
function navigateToPage() {
  window.location.href = "Dashboard.html";
}
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}
// Fetch candidates info from the API and populate the table
async function fetchCandidatesInfo() {
  const loadingOverlay = document.getElementById("loading-overlay");
  loadingOverlay.style.display = "flex"; // Show the loading overlay

  try {
    const response = await fetch(
      "https://demotag.vercel.app/api/get-shortlisted-candidates"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    const candidates = Array.isArray(data) ? data : data.candidates || [];

    // Get login email from localStorage
    const loggedInEmail = localStorage.getItem("userEmail");


    if (!loggedInEmail) {
      console.error("Login email not found in localStorage.");
      return;
    }

    const tableBody = document.querySelector("#candidates-table tbody");
    tableBody.innerHTML = "";

    // Filter candidates whose hr_email matches loggedInEmail
    const filteredCandidates = candidates.filter(
      (candidate) => candidate.hr_email?.toLowerCase() === loggedInEmail?.toLowerCase()
    );

    for (const candidate of filteredCandidates) {
      const row = document.createElement("tr");
      row.classList.add("candidate");
      row.dataset.status =
        candidate.recruitment_phase === "Imocha Completed"
          ? "completed"
          : "not-completed";

      const formattedDate = candidate.date
        ? new Date(candidate.date).toISOString().split("T")[0]
        : "N/A";

      // Determine next round logic
      let nextRound;
      if (
        candidate.recruitment_phase === "Moved to L2" ||
        candidate.recruitment_phase === "No iMocha Exam"
      ) {
        nextRound = "L2 Technical"; // Button should show L2 Technical
      } else if (
        candidate.recruitment_phase === "Rejected in L1" ||
        candidate.recruitment_phase === "Rejected in L2" ||
        candidate.recruitment_phase === "Rejected in Client Fitment Round" ||
        candidate.recruitment_phase === "Rejected in Project Fitment Round" ||
        candidate.recruitment_phase === "Shortlisted in Fitment Round" ||
        candidate.recruitment_phase === "Rejected in Fitment Round"
      ) {
        nextRound = "No Further Rounds"; // Display 'No Further Rounds' for rejected candidates
      } else {
        nextRound = await getNextRound(
          candidate.rrf_id,
          candidate.recruitment_phase
        );
      }

      console.log(`Final Next Round for ${candidate.rrf_id}:`, nextRound);

      // Determine button visibility and text
      const showPendingText =
        (!candidate.score || candidate.score === "N/A") &&
        candidate.recruitment_phase === "Move to L1";

      row.innerHTML = `
        <td>${candidate.rrf_id}</td>
        <td>${candidate.candidate_name}</td>
        <td>${candidate.hr_email}</td>
        <td>${candidate.candidate_email}</td>
        <td>${candidate.candidate_phone}</td>
        <td>${candidate.role}</td>
        <td>${candidate.score || "N/A"}</td>
        <td>${candidate.recruitment_phase}</td>
        <td>${formattedDate}</td>
        <td>
          ${
            showPendingText
              ? '<span class="pending-text">Pending iMocha Exam</span>'
              : nextRound === "No Further Rounds"
              ? '<span class="rejected-text">No Further Rounds</span>'
              : nextRound
              ? `<button class="schedule-btn">${nextRound}</button>`
              : '<span class="no-next-round">Waiting For Feedback</span>'
          }
        </td>
        <td>
          <button class="feedbackButton" data-email="${candidate.candidate_email}">Feedback</button>
        </td>
      `;

      const button = row.querySelector(".schedule-btn");
      if (button && nextRound && nextRound !== "No Further Rounds") {
        button.addEventListener("click", () =>
          handleScheduleClick(candidate.rrf_id, nextRound)
        );
      }

      tableBody.appendChild(row);
    }

    await sendEmailsForCompletedCandidates(filteredCandidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
  } finally {
    loadingOverlay.style.display = "none";
  }
}

async function getNextRound(rrf_id, recruitment_Phase) {
  try {
    const response = await fetch(
      `https://demotag.vercel.app/api/get-next-round?rrf_id=${rrf_id}&recruitment_phase=${recruitment_Phase}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch next round: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Next round data for RRF_ID ${rrf_id}:`, data);

    // Extracting the next round correctly
    return data && data.nextRound ? data.nextRound : null;
  } catch (error) {
    console.error("Error fetching next round:", error);
    return null;
  }
}

// Add event listener to the table (or a parent container)
document.addEventListener("click", function (event) {
  if (event.target && event.target.classList.contains("feedbackButton")) {
      let candidateEmail = event.target.getAttribute("data-email"); // Get candidate email
      let modal = document.getElementById("feedbackPopup");
      let iframe = document.getElementById("feedbackIframe");

      iframe.src = `finalfeedback.html?email=${encodeURIComponent(candidateEmail)}`; // Pass email as query param
      modal.style.display = "block"; // Show modal
  }
});

// Close modal when clicking the close button
document.querySelector(".custom-close").addEventListener("click", function () {
  document.getElementById("feedbackPopup").style.display = "none";
});




const msalConfig = {
  auth: {
    clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673", // Replace with your Azure AD app client ID
    authority:
      "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323", // Replace with your tenant ID
    redirectUri: "https://demotag.vercel.app", // Must match the redirect URI registered in Azure AD
  },
};

// Initialize MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Get the logged-in user's email from localStorage
const loggedInUserEmail = localStorage.getItem("userEmail");

/**
 * Sends an email for the given candidate if not already sent.
 * Before sending, it checks the candidate's email status by calling the backend.
 * After a successful send, it updates the status to "emailsent" in the candidate_info table.
 */
async function sendEmailForCandidate(candidate) {
  // Only proceed if the candidate has a completed iMocha report.
  if (!candidate.imocha_report) return;

  // Check if an email has already been sent for this candidate by calling your API.
  const emailStatus = await getCandidateEmailStatus(candidate.candidate_email);
  if (emailStatus === "emailsent") {
    console.log(
      `Email already sent for candidate ${candidate.candidate_name} (${candidate.candidate_email}). Skipping email.`
    );
    return;
  }

  // Prepare the token request for Mail.Send
  const tokenRequest = {
    scopes: ["Mail.Send"],
    account: msalInstance.getAllAccounts()[0],
  };

  // Acquire an access token (try silently, then fallback to popup)
  let tokenResponse;
  try {
    tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
  } catch (silentError) {
    console.warn("Silent token acquisition failed; trying popup.", silentError);
    tokenResponse = await msalInstance.acquireTokenPopup(tokenRequest);
  }
  const accessToken = tokenResponse.accessToken;

  // Construct the email message payload for Graph API
  const emailData = {
    message: {
      subject: `iMocha Assessment Completed: RRFID-${candidate.rrf_id} | Role: ${candidate.role} | Candidate: ${candidate.candidate_name}`,
      body: {
        contentType: "HTML",
        content: `
          <h3>Candidate iMocha Test Completed</h3>
          <p><strong>Name:</strong> ${candidate.candidate_name}</p>
          <p><strong>Email:</strong> ${candidate.candidate_email}</p>
          <p><strong>Phone:</strong> ${candidate.candidate_phone}</p>
          <p><strong>Role:</strong> ${candidate.role}</p>
          <p><strong>Score:</strong> ${candidate.score || "N/A"}</p>
          <p><strong>Status:</strong> ${candidate.l_1_status}</p>
          <p><strong>Recruitment Phase:</strong> ${
            candidate.recruitment_phase
          }</p>
          <p><strong>PDF Report:</strong> <a href="${
            candidate.imocha_report
          }" target="_blank">View Report</a></p>
          <p>Sent from: ${loggedInUserEmail}</p>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: candidate.hr_email,
          },
        },
      ],
    },
    saveToSentItems: "true",
  };

  // Send the email via Microsoft Graph API
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error sending email: ${errorData.error.message}`);
  }
  console.log(
    `Email sent for candidate ${candidate.candidate_name} to ${candidate.hr_email}`
  );

  // Update email status in the candidate_info table to "emailsent"
  try {
    await updateEmailStatus(candidate.candidate_email, "emailsent");
    console.log(
      `Email status updated to 'emailsent' for candidate ${candidate.candidate_name}`
    );
  } catch (updateError) {
    console.error(
      `Failed to update email status for candidate ${candidate.candidate_name}:`,
      updateError
    );
  }
}

/**
 * Iterates through candidate records and sends emails for those who have completed iMocha.
 * It checks each candidate’s email status before sending the email.
 * @param {Array<Object>} candidates - Array of candidate objects.
 */
async function sendEmailsForCompletedCandidates(candidates) {
  for (const candidate of candidates) {
    try {
      await sendEmailForCandidate(candidate);
    } catch (error) {
      console.error(
        `Error sending email for candidate ${candidate.candidate_name}:`,
        error
      );
    }
  }
  // showToast(
  //   "Emails processed for all completed iMocha candidates (if any).",
  //   "success"
  // );
}

/**
 * Gets the email status for a candidate by calling a backend API.
 * Expects the API to return JSON in the format: { status: "emailsent" } or { status: null }.
 * @param {string} candidateEmail
 * @returns {Promise<string|null>}
 */
async function getCandidateEmailStatus(candidateEmail) {
  try {
    const response = await fetch(
      `https://demotag.vercel.app/api/get-email-status?candidate_email=${encodeURIComponent(
        candidateEmail
      )}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch email status for ${candidateEmail}`);
    }
    const data = await response.json();
    return data.status; // e.g., "emailsent" or null
  } catch (error) {
    console.error(`Error fetching email status for ${candidateEmail}:`, error);
    return null;
  }
}

/**
 * Updates the email status for a candidate in the candidate_info table.
 * @param {string} candidateEmail
 * @param {string} status - The new status to set (e.g., "emailsent").
 * @returns {Promise<void>}
 */
async function updateEmailStatus(candidateEmail, status) {
  try {
    const response = await fetch(
      "https://demotag.vercel.app/api/update-email-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidate_email: candidateEmail, status }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update email status: ${errorData.message}`);
    }
  } catch (error) {
    console.error(`Error updating email status for ${candidateEmail}:`, error);
    throw error;
  }
}

// Example: Assume you have fetched candidate details from your API.
// Here is a sample candidate array (replace with your actual data from the API):

// Attach an event listener to a button to send emails for all candidates with completed iMocha.
// document.getElementById("sendEmailsBtn").addEventListener("click", async () => {
//   try {
//     // Here you could also fetch candidate details from your backend
//     // For example:
//     // const response = await fetch('https://demotag.vercel.app/api/get-shortlisted-candidates');
//     // const data = await response.json();
//     // const candidates = data.candidates;

//     // For now, we use the sampleCandidates array:
//     await sendEmailsForCompletedCandidates(sampleCandidates);
//   } catch (error) {
//     console.error("Error sending emails:", error);
//     alert("Error sending emails: " + error.message);
//   }
// });

// Call fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchCandidatesInfo);
// Function to filter candidates based on search and status
function filterCandidates() {
  const searchInput = document
    .getElementById("search-input")
    .value.toLowerCase();
  const filterStatus = document.getElementById("filter-status").value;
  const candidates = document.querySelectorAll(".candidate");

  candidates.forEach((candidate) => {
    const name = candidate.cells[0].innerText.toLowerCase();
    const email = candidate.cells[1].innerText.toLowerCase();
    const status = candidate.getAttribute("data-status");
    const matchSearch =
      name.includes(searchInput) || email.includes(searchInput);
    const matchStatus = filterStatus === "all" || filterStatus === status;

    if (matchSearch && matchStatus) {
      candidate.style.display = "";
    } else {
      candidate.style.display = "none";
    }
  });
}

document
  .querySelector("#candidates-table tbody")
  .addEventListener("click", function (event) {
    const button = event.target.closest("button.schedule-btn");
    if (button) {
      handleScheduleClick(event);
    }
  });

// Function to handle the modal for scheduling
async function handleScheduleClick(event) {
  try {
    const candidateRow = event.target.closest("tr");
    if (!candidateRow) {
      throw new Error(
        "Table row not found. Ensure the button is inside a <tr> element."
      );
    }

    const candidateName = candidateRow.cells[0].innerText;
    const button = event.target;

    const modal = document.getElementById("schedule-modal");
    const overlay = document.getElementById("modal-overlay");
    const scheduleBtn = document.getElementById("schedule-btn");

    modal.classList.add("active");
    overlay.classList.add("active");

    scheduleBtn.onclick = async () => {
      try {
        const candidate_name = candidateRow.cells[1].innerText;
        const hr_email = candidateRow.cells[2].innerText;
        const candidateEmail = candidateRow.cells[3].innerText;
        const panelEmail = document.getElementById("panel-select").value;
        const dateTime = document.getElementById("datetime-input").value;
        
        const nextRound = candidateRow.cells[9].innerText; // Fetch next round name dynamically
    
        const date = new Date(dateTime);
        const startDateTime = date.toISOString();
        const endDateTime = new Date(date.getTime() + 30 * 60 * 1000).toISOString();
    
        const tokenRequest = {
          scopes: ["OnlineMeetings.ReadWrite", "Calendars.ReadWrite"],
          account: msalInstance.getAllAccounts()[0],
        };
    
        let tokenResponse;
        try {
          tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
        } catch (silentError) {
          console.warn("Silent token acquisition failed; trying popup.", silentError);
          tokenResponse = await msalInstance.acquireTokenPopup(tokenRequest);
        }
    
        const accessToken = tokenResponse.accessToken;
    
        // 1️⃣ **Create Teams Meeting**
        const meetingRequest = {
          startDateTime,
          endDateTime,
          subject: `${nextRound}: ${candidate_name}`, // Use nextRound dynamically
          participants: {
            organizer: { upn: hr_email },
            attendees: [
              { upn: candidateEmail, role: "attendee" },
              { upn: panelEmail, role: "attendee" },
            ],
          },
        };
    
        const meetingResponse = await fetch(
          "https://graph.microsoft.com/v1.0/me/onlineMeetings",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(meetingRequest),
          }
        );
    
        if (!meetingResponse.ok) {
          throw new Error("Failed to create Teams meeting");
        }
    
        const meetingData = await meetingResponse.json();
        const meetingLink = meetingData.joinWebUrl;
    
        // 2️⃣ **Create Calendar Event with Meeting Details**
        const eventRequest = {
          subject: `${nextRound}: ${candidate_name}`, // Use nextRound dynamically
          start: { dateTime: startDateTime, timeZone: "UTC" },
          end: { dateTime: endDateTime, timeZone: "UTC" },
          location: { displayName: "Microsoft Teams Meeting" },
          attendees: [
            {
              emailAddress: { address: candidateEmail, name: candidate_name },
              type: "required",
            },
            {
              emailAddress: { address: panelEmail, name: "Panel Member" },
              type: "required",
            },
         
          ],
          isOnlineMeeting: true,
          onlineMeetingProvider: "teamsForBusiness",
          onlineMeeting: { joinUrl: meetingLink },
          body: {
            contentType: "HTML",
            content: `
              <p>Dear ${candidate_name},</p>
              <p>You have been scheduled for your <b>${nextRound}</b>.</p>
              <p><b>Interview Details:</b></p>
              <ul>
                <li><b>Date & Time:</b> ${date.toUTCString()}</li>
                <li><b>Panel Member:</b> ${panelEmail}</li>
                <li><b>Meeting Link:</b> <a href="${meetingLink}">${meetingLink}</a></li>
              </ul>
              <p>Please ensure you join on time and have a stable internet connection.</p>
              <p>Best Regards,</p>
              <p><b>TAG Assist Team</b></p>
            `,
          },
        };
    
        const calendarResponse = await fetch(
          "https://graph.microsoft.com/v1.0/me/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventRequest),
          }
        );
    
        if (!calendarResponse.ok) {
          throw new Error("Failed to create calendar event");
        }
    
        // 3️⃣ **Update Status in Backend**
        await fetch("https://demotag.vercel.app/api/update-status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: candidateEmail,
            status: `${nextRound} Round Scheduled`, // Use nextRound dynamically
            panel: panelEmail,
            dateTime: startDateTime,
            meetingLink,
          }),
        });
    
        // 4️⃣ **Success Message & UI Update**
        const successMessage = document.getElementById("success-message");
        successMessage.innerText = `Interview for ${candidate_name} scheduled successfully! Meeting link sent to ${candidateEmail} and ${panelEmail}.`;
        successMessage.style.display = "block";
    
        candidateRow.cells[7].innerText = nextRound; // Update UI with next round name
        button.disabled = true;
    
        setTimeout(() => {
          modal.classList.remove("active");
          overlay.classList.remove("active");
          successMessage.style.display = "none";
        }, 3000);
         window.location.reload(); 
      } catch (error) {
        console.error("Error scheduling Teams meeting:", error);
      }
    };
    
  } catch (error) {
    console.error("Error in handleScheduleClick:", error);
  }
}

// Close modal functionality
document.getElementById("close-modal-btn").addEventListener("click", () => {
  document.getElementById("schedule-modal").classList.remove("active");
  document.getElementById("modal-overlay").classList.remove("active");
});

// Event listeners for search and filter
document
  .getElementById("search-input")
  .addEventListener("input", filterCandidates);
document
  .getElementById("filter-status")
  .addEventListener("change", filterCandidates);

// Adding event listener for the schedule buttons
document.querySelectorAll("schedule-btn").forEach((button) => {
  if (!button.disabled) {
    button.addEventListener("click", handleScheduleClick);
  }
});

document
  .getElementById("domain-select")
  .addEventListener("change", function () {
    var selectedDomain = this.value;
    fetchPanelEmails(selectedDomain);
  });

function fetchPanelEmails(domain) {
  // Fetch the emails for the selected domain from the backend
  fetch(`/api/get-panel-emails?domain=${domain}`)
    .then((response) => response.json())
    .then((data) => {
      const panelSelect = document.getElementById("panel-select");
      panelSelect.innerHTML = '<option value="">Select Panel</option>'; // Clear previous options

      // If no emails were returned
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((email) => {
          let option = document.createElement("option");
          option.value = email;
          option.textContent = email;
          panelSelect.appendChild(option);
        });
      } else {
        let option = document.createElement("option");
        option.textContent = "No panels available for this domain";
        panelSelect.appendChild(option);
      }
    })
    .catch((error) => {
      console.error("Error fetching panel emails:", error);
    });
}

document
  .getElementById("dateRangeForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const selectedEC = document.getElementById("ecCategory").value;

    if (!startDate || !endDate || !selectedEC) {
      alert("Please select all required fields.");
      return;
    }

    document.getElementById("statusMessage").innerText =
      "Processing, please wait...";

    const apiUrl = `https://demotag.vercel.app/api/callTestAttempts/${selectedEC}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await response.json();
      console.log("API Response:", data);
      document.getElementById(
        "statusMessage"
      ).innerText = `Success: ${selectedEC} test attempts processed!`;
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("statusMessage").innerText =
        "Error processing test attempts!";
    }
  });
