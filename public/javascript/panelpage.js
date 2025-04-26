const calendarContainer = document.getElementById("calendarContainer");
const interviewsBtn = document.getElementById("interviewsBtn");
const meetingDateElement = document.querySelector(".meeting-date");
const calendarGrid = document.querySelector(".calendar-grid");
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const meetingContainer = document.getElementById("meeting-container");
const feedbackContainer = document.getElementById("feedback-container");

const calendarMonthYearElement = document.getElementById("calendarMonthYear");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackFormIframe = document.getElementById("feedbackFormIframe");
const feedbackCloseBtn = document.querySelector(".close-btn");

const roundDetailsMap = {
  "L2 Technical Round Scheduled": "L2 Technical",
  "Client Fitment Round Scheduled": "Client Fitment Round",
  "Project Fitment Round Scheduled": "Project Fitment Round",
  "Fitment Round Scheduled": "Fitment Round",
  "EC Fitment Round Scheduled": "EC Fitment Round",
};

function logout() {
  window.location.href = "/";
}

interviewsBtn.addEventListener("click", function () {
  if (calendarContainer.style.display === "none") {
    calendarContainer.style.display = "block"; // Show the calendar
    meetingContainer.style.display = "block"; // Show the meeting container
    toggleSidebar(); // Automatically open the sidebar

    fetchMeetingsForSelectedDate(currentDate);
  } else {
    calendarContainer.style.display = "none"; // Hide the calendar
    meetingContainer.style.display = "none"; // Hide the meeting container
  }
});

function loadCalendarAndFetchMeetings() {
  calendarContainer.style.display = "block";
  renderCalendar(currentMonth, currentYear);
  fetchMeetingsForSelectedDate(currentDate);
}

window.onload = function () {
  loadCalendarAndFetchMeetings();
};

function joinMeetingAndShowFeedback(
  candidateEmail,
  recruitmentPhase,
  meetingLink
) {
  // Add meetingLink parameter to the function
  const roundDetails = roundDetailsMap[recruitmentPhase] || recruitmentPhase;

  openFeedbackForm(candidateEmail, roundDetails); // Pass roundDetails to the popup
  window.open(meetingLink, "_blank"); // Use the passed meetingLink directly

  const iframe = document.getElementById("feedbackFormIframe");
  iframe.src = `${getFeedbackFormUrl(
    recruitmentPhase
  )}?candidateEmail=${encodeURIComponent(
    candidateEmail
  )}&roundDetails=${encodeURIComponent(roundDetails)}`;
}

function getFeedbackFormUrl(recruitmentPhase) {
  // Mapping recruitment phase to feedback form URLs
  const feedbackFormUrls = {
    "L2 Technical Round Scheduled": "L2-Technical.html",
    "Shortlisted in L2": "L2-Technical.html",
    "Client Fitment Round Scheduled": "feedbackform.html",
    "Shortlisted in Client Fitment Round": "feedbackform.html",
    "Project Fitment Round Scheduled": "projectfitment.html",
    "Shortlisted in Project Fitment Round": "feedbackform.html",
    "Fitment Round Scheduled": "feedbackform.html",
    "Shortlisted in Fitment Round": "feedbackform.html",
    "EC Fitment Round Scheduled": "feedbackform.html",
    "Shortlisted in EC Fitment Round": "feedbackform.html",
    "Project Fitment Round": "projectfitment.html",
    "Fitment Round": "feedbackform.html",
    "L2 Technical": "L2-Technical.html",
    "Client Fitment Round": "feedbackform.html",
    "EC Fitment Round": "feedbackform.html",
  };

  // Return the corresponding URL or default if not matched
  return feedbackFormUrls[recruitmentPhase] || "default-feedback.html"; // Default feedback form if not matched
}

// function openFeedbackForm(candidateEmail, recruitmentPhase) {
//     localStorage.setItem('roundDetails', recruitmentPhase);  // Storing round details
//     const modal = document.getElementById("feedbackModal");
//     modal.style.display = "block";

//     const iframe = document.getElementById('feedbackFormIframe');
//     iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}`;
// }

// function openFeedbackForm1(candidateEmail, recruitmentPhase) {
//     const modal = document.getElementById("feedbackModal");
//     modal.style.display = "block";

//     const iframe = document.getElementById('feedbackFormIframe');
//     iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}`;
// }

// async function openFeedbackForm(candidateEmail, recruitmentPhase) {
//     try {
//         // Fetch ec_select value for the candidate
//         const response = await fetch('https://demotag.vercel.app/api/get-ec-select', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ candidateEmail }),
//         });

//         if (!response.ok) {
//             throw new Error("Failed to fetch ec_select value.");
//         }

//         const data = await response.json();

//         // Check if ec_select is "App"
//         if (data.ec_select === "App") {
//             // Navigate to L2_App_Technical.html
//             window.location.href = `L2_App_Technical.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`;
//         }
//                 else if (data.ec_select === "Data") {
//             // Navigate to L2_Data_Technical.html
//             window.location.href = `L2_Data_Technical.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`;

//         }else {
//             // Open the default feedback form in a modal
//             localStorage.setItem('roundDetails', recruitmentPhase); // Storing round details
//             const modal = document.getElementById("feedbackModal");
//             modal.style.display = "block";

//             const iframe = document.getElementById('feedbackFormIframe');
//             iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}`;
//         }
//     } catch (error) {
//         console.error("Error opening feedback form:", error);
//         alert("Failed to open feedback form. Please try again.");
//     }
// }

function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  modal.style.display = "none";
}

window.onclick = function (event) {
  var modal = document.getElementById("feedbackModal");
  if (event.target == modal) {
    closeFeedbackModal();
  }
};

let currentDate = new Date();
let selectedDate = null;
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

meetingDateElement.textContent = `${
  monthNames[currentMonth]
} ${currentDate.getDate()}, ${currentYear}`;

function renderCalendar(month, year) {
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = firstDay.getDay();
  const lastDay = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDay.getDate();

  calendarGrid.innerHTML = "";

  // Fill in empty days from previous month
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.classList.add("day", "other-month");
    calendarGrid.appendChild(emptyDay);
  }

  // Fill in days for the current month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");
    dayElement.textContent = day;

    if (
      day === currentDate.getDate() &&
      month === currentDate.getMonth() &&
      year === currentDate.getFullYear()
    ) {
      dayElement.classList.add("active");
    }

    dayElement.addEventListener("click", () => {
      selectedDate = new Date(year, month, day);
      meetingDateElement.textContent = `${monthNames[month]} ${day}, ${year}`;

      // Fetch and display meetings for the selected date
      fetchMeetingsForSelectedDate(selectedDate);

      // Clear any previously selected date
      const allDays = calendarGrid.querySelectorAll(".day");
      allDays.forEach((d) => d.classList.remove("selected"));
      dayElement.classList.add("selected");
    });

    calendarGrid.appendChild(dayElement);
  }
}

// async function fetchFeedbackForSelectedDate(selectedDate) {
//     const feedbackContainer = document.getElementById('feedback-container');
//     const userEmail = localStorage.getItem("userEmail");

//     try {
//         selectedDate.setHours(0, 0, 0, 0);
//         const formattedSelectedDate = selectedDate.toLocaleDateString('en-CA');

//         console.log('Fetching feedback for date:', formattedSelectedDate);

//         const response = await fetch(`https://demotag.vercel.app/api/feedback-for-panel-member?interview_date=${formattedSelectedDate}&userEmail=${userEmail}`);
//         if (!response.ok) {
//             throw new Error('Failed to fetch feedback');
//         }

//         const feedbacks = await response.json();
//         console.log('Feedback fetched:', feedbacks);

//         feedbackContainer.innerHTML = '';

//         if (feedbacks.length === 0) {
//             feedbackContainer.innerHTML = '<p>No feedback available for this date.</p>';
//             return;
//         }

//         feedbacks.forEach((feedback) => {
//             const feedbackCard = document.createElement('div');
//             feedbackCard.classList.add('meeting-card'); // Using the same class for consistency

//             feedbackCard.innerHTML = `
//                 <div class="meeting-header">
//                     <h4 class="meeting-title">Feedback for - ${feedback.candidate_name} (${feedback.position})</h4>
//                 </div>
//                 <div class="meeting-details">
//                     <p><strong>Round Details:</strong> ${feedback.round_details}</p>
//                     <p><strong>Result:</strong> ${feedback.result}</p>
//                     <p><strong>Detailed Feedback:</strong> ${feedback.detailed_feedback}</p>
//                     <p><strong>Submitted At:</strong> ${new Date(feedback.submitted_at).toLocaleString()}</p>
//                 </div>
//             `;

//             feedbackContainer.appendChild(feedbackCard);
//         });
//     } catch (error) {
//         console.error("Error fetching feedback:", error);
//         feedbackContainer.innerHTML = '<p>Error fetching feedback.</p>';
//     }
// }

// Call fetchFeedbackForSelectedDate after fetching meetings
async function fetchMeetingsForSelectedDate(selectedDate) {
  const meetingContainer = document.getElementById("meeting-container");
  const feedbackContainer = document.getElementById("feedback-container");
  const userEmail = localStorage.getItem("userEmail");

  try {
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
    } else {
      selectedDate = new Date();
      selectedDate.setHours(0, 0, 0, 0);
    }
    const formattedSelectedDate = selectedDate.toLocaleDateString("en-CA");
    console.log("Fetching data for date:", formattedSelectedDate);

    // API Calls (Handled Separately)
    let candidatesData = [];
    let allFeedbacks = [];

    // Fetch shortlisted candidates (Meetings)
    try {
      const response = await fetch(
        `https://demotag.vercel.app/api/panel-candidates-info?l_2_interviewdate=${formattedSelectedDate}&userEmail=${userEmail}`
      );
      if (response.ok) {
        candidatesData = await response.json();
        console.log("Candidates fetched:", candidatesData);
      } else {
        console.error("Failed to fetch shortlisted candidates");
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }

    // Fetch feedback for the selected date
    try {
      const feedbackResponse = await fetch(
        `https://demotag.vercel.app/api/feedback-for-panel-member?interview_date=${formattedSelectedDate}&userEmail=${userEmail}`
      );
      if (feedbackResponse.ok) {
        const feedbacks = await feedbackResponse.json();
        allFeedbacks = [...allFeedbacks, ...feedbacks];
        console.log("Feedback fetched:", feedbacks);
      } else {
        console.error("Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }

    // Fetch feedback from the feedback-table API
    try {
      const feedbackTableResponse = await fetch(
        `https://demotag.vercel.app/api/feedback-table?interview_date=${formattedSelectedDate}&userEmail=${userEmail}`
      );
      if (feedbackTableResponse.ok) {
        const feedbackTableData = await feedbackTableResponse.json();
        allFeedbacks = [...allFeedbacks, ...feedbackTableData];
        console.log("Additional feedback fetched:", feedbackTableData);
      } else {
        console.error("Failed to fetch feedback from table");
      }
    } catch (error) {
      console.error("Error fetching feedback from table:", error);
    }

    // Clear previous content
    meetingContainer.innerHTML = "";
    feedbackContainer.innerHTML = "";

    // Display meeting cards (if available)
    if (candidatesData.length > 0) {
      candidatesData.forEach((candidate) => {
        const formattedDate = new Date(
          candidate.l_2_interviewdate
        ).toLocaleDateString("en-CA");
        const roundDetails =
          roundDetailsMap[candidate.recruitment_phase] ||
          candidate.recruitment_phase ||
          "L2 Technical";

        const candidateCard = document.createElement("div");
        candidateCard.classList.add("meeting-card");

        candidateCard.innerHTML = `
                    <div class="meeting-header">
                        <div>
                            <h4 class="meeting-title">Meeting with - ${candidate.candidate_name}</h4>
                        </div>
                    </div>
                    <div class="meeting-details">
                        <div class="meeting-info">
                            <div class="meeting-location">Interview Details: ${roundDetails}</div>
                            <div class="meeting-location">Role: ${candidate.role}</div>
                            <div class="meeting-location">Email: ${candidate.candidate_email}</div>
                            <div class="meeting-location">🕐 ${formattedDate} , ${candidate.l_2_interviewtime}</div>
                        </div>
                        <button class="btn-teams" onclick="joinMeetingAndShowFeedback('${candidate.candidate_email}', '${candidate.recruitment_phase}', '${candidate.meeting_link}')">
                            <img src="teams.png" alt="Teams Logo" class="teams-logo">
                            <a href="${candidate.meeting_link}" target="_blank" class="join-link">Join Meeting</a>
                        </button>
                    </div>
<div class="buttons">
    <button class="btn btn-resume">
        <a href="${candidate.resume}" target="_blank">Candidate Resume</a>
    </button>
    <button class="btn btn-mocha">
        <a href="${candidate.imocha_report}" target="_blank">iMocha Result</a>
    </button>
    <button class="btn btn-feedback" 
        onclick="openFeedbackForm('${candidate.candidate_email}', '${roundDetails}')">
        Feedback Form
    </button>
  <button class="btn btn-previous-feedbacks" onclick="openPreviousFeedbacks('${candidate.candidate_email}')">Previous Feedbacks</button>

</div>

                `;

        meetingContainer.appendChild(candidateCard);
      });
    } else {
      meetingContainer.innerHTML =
        "<p>No meetings scheduled for this date.</p>";
    }

    // Display feedback cards (if available)
    if (allFeedbacks.length > 0) {
      allFeedbacks.forEach((feedback) => {
        const feedbackCard = document.createElement("div");
        feedbackCard.classList.add("feedback-card");

        feedbackCard.innerHTML = `
                    <div class="feedback-header">
                        <h4 class="feedback-title">Feedback for - ${
                          feedback.candidate_name
                        }</h4>
                    </div>
                    <div class="feedback-details">
                        <p><b>Position:</b> ${feedback.position || "N/A"}</p>
                        <p><b>Interview Round:</b> ${
                          feedback.round_details || "L2 Technical"
                        }</p>
                        <p><b>Email:</b> ${feedback.candidate_email}</p>
                        <p><b>Result:</b> ${feedback.result || "N/A"}</p>
                        <p><b>Submitted At:</b> ${
                          feedback.submitted_at
                            ? new Date(feedback.submitted_at).toLocaleString()
                            : "N/A"
                        }</p>
                    </div>
                    <div class="feedback-content">
                    
                    </div>
                    <div class="buttons">
                        <button class="btn btn-feedback" onclick="openFeedbackForm('${
                          feedback.candidate_email
                        }', '${feedback.round_details || "L2 Technical"}')">
                            Feedback Form
                        </button>
                    </div>
                `;

        feedbackContainer.appendChild(feedbackCard);
      });
    } else {
      // feedbackContainer.innerHTML = '<p>No feedback available for this date.</p>';
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

  function viewPreviousFeedback(candidateEmail) {
    window.location.href = `finalfeedback.html?email=${encodeURIComponent(candidateEmail)}`;
  }

// Fetch previous feedback for a candidate
async function fetchFeedbackForCandidate(candidateEmail) {
  const feedbackContainer = document.getElementById("feedback-container");

  try {
    const response = await fetch(
      `https://demotag.vercel.app/api/candidate-feedback?candidateEmail=${candidateEmail}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch feedback");
    }

    const feedbacks = await response.json();
    console.log(`Feedback fetched for ${candidateEmail}:`, feedbacks);

    if (feedbacks.length === 0) {
      return; // No feedback found, do nothing
    }

    feedbacks.forEach((feedback) => {
      const feedbackCard = document.createElement("div");
      feedbackCard.classList.add("feedback-card");

      feedbackCard.innerHTML = `
                <div class="feedback-header">
                    <h4>Feedback for ${feedback.candidate_name} (${
        feedback.position
      })</h4>
                </div>
                <div class="feedback-details">
                    <p><strong>Interviewer:</strong> ${
                      feedback.interviewer_name
                    }</p>
                    <p><strong>HR Email:</strong> ${feedback.hr_email}</p>
                    <p><strong>Interview Date:</strong> ${new Date(
                      feedback.interview_date
                    ).toLocaleDateString("en-CA")}</p>
                    <p><strong>Round Details:</strong> ${
                      feedback.round_details
                    }</p>
                    <p><strong>iMocha Score:</strong> ${
                      feedback.imocha_score
                    }</p>
                    <p><strong>RRF ID:</strong> ${feedback.rrf_id}</p>
                    <p><strong>Result:</strong> ${feedback.result}</p>
                    <p><strong>Feedback:</strong> ${
                      feedback.detailed_feedback
                    }</p>
                    <p><strong>Submitted At:</strong> ${new Date(
                      feedback.submitted_at
                    ).toLocaleString()}</p>
                </div>
            `;

      feedbackContainer.appendChild(feedbackCard);
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    feedbackContainer.innerHTML = "<p>Error fetching feedback.</p>";
  }
}

function openFeedbackModal(roundDetails) {
  const feedbackFormUrl = getFeedbackFormUrl(roundDetails);

  const feedbackFormIframe = document.getElementById("feedbackFormIframe");
  feedbackFormIframe.src = feedbackFormUrl;

  document.getElementById("feedbackModal").style.display = "block";
}

function closeAppFeedbackModal() {
  const modal = document.getElementById("feedback-modal");
  if (modal) {
    modal.style.display = "none"; // For custom modal

    // If using Bootstrap 5 modal
    // const modalInstance = bootstrap.Modal.getInstance(modal);
    // if (modalInstance) modalInstance.hide();

    // Optional: reset iframe content if needed
    const iframe = document.getElementById("feedback-iframe");
    if (iframe) {
      iframe.src = "";
    }
  } else {
    console.warn("Modal not found with id 'feedback-modal'");
  }
}

// Update the openFeedbackForm function to track opened windows
const feedbackWindows = {}; // Track opened feedback windows

async function openFeedbackForm(candidateEmail, recruitmentPhase) {
  try {
    const response = await fetch("https://demotag.vercel.app/api/get-engcenter-select", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ candidateEmail }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch eng_center and position.");
    }

    const data = await response.json();
    const { eng_center, role } = data;
    const windowFeatures = "width=1000,height=800,top=100,left=100";

    // Round-specific HTML logic
    const isL2Round =
      recruitmentPhase === "L2 Technical" ||
      recruitmentPhase === "Shortlisted in L2";

    if (recruitmentPhase === "Project Fitment Round") {
      feedbackWindows[candidateEmail] = window.open(
        `projectfitment.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`,
        `feedbackWindow_${candidateEmail}`,
        windowFeatures
      );
    } else if (recruitmentPhase === "EC Fitment Round") {
      feedbackWindows[candidateEmail] = window.open(
        `ecfitment.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`,
        `feedbackWindow_${candidateEmail}`,
        windowFeatures
      );
    } else if (eng_center === "App EC" && isL2Round) {
      feedbackWindows[candidateEmail] = window.open(
        `L2_App_Technical.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}&position=${encodeURIComponent(role)}`,
        `feedbackWindow_${candidateEmail}`,
        windowFeatures
      );
    } else if (eng_center === "Data") {
      feedbackWindows[candidateEmail] = window.open(
        `L2_Data_Technical.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`,
        `feedbackWindow_${candidateEmail}`,
        windowFeatures
      );
    } else {
      feedbackWindows[candidateEmail] = window.open(
        `feedbackform.html?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(recruitmentPhase)}`,
        `feedbackWindow_${candidateEmail}`,
        windowFeatures
      );
    }
  } catch (error) {
    console.error("Error opening feedback form:", error);
    alert("Failed to open feedback form. Please try again.");
  }
}


// Enhanced closeFeedbackModal function
function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  modal.style.display = "none";

  // Reset iframe source to prevent resubmission
  const iframe = document.getElementById("feedbackFormIframe");
  iframe.src = "about:blank";

  // Close any tracked feedback windows
  Object.values(feedbackWindows).forEach((win) => {
    if (win && !win.closed) {
      win.close();
    }
  });
}

// Add message listener to handle window closing
window.addEventListener("message", function (event) {
  if (event.data.action === "feedbackSubmitted") {
    const candidateEmail = event.data.candidateEmail;
    if (
      feedbackWindows[candidateEmail] &&
      !feedbackWindows[candidateEmail].closed
    ) {
      feedbackWindows[candidateEmail].close();
      delete feedbackWindows[candidateEmail];
    }
    // Refresh feedback data
    fetchMeetingsForSelectedDate(currentDate);
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}

renderCalendar(currentMonth, currentYear);
monthSelector.value = currentMonth;
yearSelector.value = currentYear;

// Populate the year selector
for (let i = 1901; i <= 2500; i++) {
  const yearOption = document.createElement("option");
  yearOption.value = i;
  yearOption.textContent = i;
  if (i === currentYear) {
    yearOption.selected = true;
  }
  yearSelector.appendChild(yearOption);
}

// Event listener for changing month
monthSelector.addEventListener("change", (event) => {
  currentMonth = parseInt(event.target.value);
  renderCalendar(currentMonth, currentYear);
});

// Event listener for changing year
yearSelector.addEventListener("change", (event) => {
  currentYear = parseInt(event.target.value);
  renderCalendar(currentMonth, currentYear);
});

// Event listeners for next and previous month buttons
document.getElementById("prevMonthBtn").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
  monthSelector.value = currentMonth;
  yearSelector.value = currentYear;
});

document.getElementById("nextMonthBtn").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
  monthSelector.value = currentMonth;
  yearSelector.value = currentYear;
});
function openPreviousFeedbacks(email) {
  const iframeUrl = `finalfeedback.html?email=${encodeURIComponent(email)}`;

  const popup = document.createElement("div");
  popup.className = "custom-feedback-popup"; // give it your new custom class name

  popup.innerHTML = `
    <div class="custom-popup-content">
      <button class="custom-close-btn" onclick="this.parentElement.parentElement.remove()">X</button>
      <iframe src="${iframeUrl}" width="100%" height="600px" style="border:none;"></iframe>
    </div>
  `;

  document.body.appendChild(popup);
}

