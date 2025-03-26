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
const feedbackFormIframe = document.getElementById('feedbackFormIframe');
const feedbackCloseBtn = document.querySelector(".close-btn");

    const roundDetailsMap = {
            'L2 Technical Round Scheduled': 'L2 Technical',
            'Client Fitment Round Scheduled': 'Client Fitment Round',
            'Project Fitment Round Scheduled': 'Project Fitment Round',
            'Fitment Round Scheduled': 'Fitment Round',
            'EC Fitment Round Scheduled': 'EC Fitment Round'
        };


function logout() {
    window.location.href = '/';
}

interviewsBtn.addEventListener("click", function () {
    if (calendarContainer.style.display === "none") {
        calendarContainer.style.display = "block"; // Show the calendar
        toggleSidebar(); // Automatically open the sidebar

        fetchMeetingsForSelectedDate(currentDate);

    } else {
        calendarContainer.style.display = "none"; // Hide the calendar
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

function joinMeetingAndShowFeedback(candidateEmail, recruitmentPhase, meetingLink) {
    // Add meetingLink parameter to the function
    const roundDetails = roundDetailsMap[recruitmentPhase] || recruitmentPhase;

    openFeedbackForm(candidateEmail, roundDetails);  // Pass roundDetails to the popup
    window.open(meetingLink, "_blank");  // Use the passed meetingLink directly

    const iframe = document.getElementById('feedbackFormIframe');
    iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}&roundDetails=${encodeURIComponent(roundDetails)}`;
}






function getFeedbackFormUrl(recruitmentPhase) {
    // Mapping recruitment phase to feedback form URLs
   const feedbackFormUrls = {
        'L2 Technical Round Scheduled': 'L2-Technical.html',
        'Shortlisted in L2': 'L2-Technical.html',
        'Client Fitment Round Scheduled': 'feedbackform.html',
        'Shortlisted in Client Fitment Round': 'feedbackform.html',
        'Project Fitment Round Scheduled': 'feedbackform.html',
        'Shortlisted in Project Fitment Round': 'feedbackform.html',
        'Fitment Round Scheduled': 'feedbackform.html',
        'Shortlisted in Fitment Round': 'feedbackform.html',
        'EC Fitment Round Scheduled': 'feedbackform.html',
        'Shortlisted in EC Fitment Round': 'feedbackform.html',
        'Project Fitment Round':'feedbackform.html',
        'Fitment Round':'feedbackform.html',
        'L2 Technical':'L2-Technical.html',
        'Client Fitment Round':'feedbackform.html',
        'EC Fitment Round':'feedbackform.html',
    };

    // Return the corresponding URL or default if not matched
    return feedbackFormUrls[recruitmentPhase] || 'default-feedback.html'; // Default feedback form if not matched
}

function openFeedbackForm(candidateEmail, recruitmentPhase) {
    localStorage.setItem('roundDetails', recruitmentPhase);  // Storing round details
    const modal = document.getElementById("feedbackModal");
    modal.style.display = "block";

    const iframe = document.getElementById('feedbackFormIframe');
    iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}`;
}



// function openFeedbackForm1(candidateEmail, recruitmentPhase) {
//     const modal = document.getElementById("feedbackModal");
//     modal.style.display = "block";

//     const iframe = document.getElementById('feedbackFormIframe');
//     iframe.src = `${getFeedbackFormUrl(recruitmentPhase)}?candidateEmail=${encodeURIComponent(candidateEmail)}`;
// }


function closeFeedbackModal() {
    const modal = document.getElementById("feedbackModal");
    modal.style.display = "none";
}

window.onclick = function(event) {
    var modal = document.getElementById("feedbackModal");
    if (event.target == modal) {
        closeFeedbackModal();
    }
}

let currentDate = new Date();
let selectedDate = null;
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

meetingDateElement.textContent = `${monthNames[currentMonth]} ${currentDate.getDate()}, ${currentYear}`;

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

        if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
            dayElement.classList.add("active");
        }

        dayElement.addEventListener("click", () => {
            selectedDate = new Date(year, month, day);
            meetingDateElement.textContent = `${monthNames[month]} ${day}, ${year}`;

            // Fetch and display meetings for the selected date
            fetchMeetingsForSelectedDate(selectedDate);

            // Clear any previously selected date
            const allDays = calendarGrid.querySelectorAll('.day');
            allDays.forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
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
    const meetingContainer = document.getElementById('meeting-container'); 
    const feedbackContainer = document.getElementById('feedback-container'); 
    const userEmail = localStorage.getItem("userEmail");

    try {
        if (selectedDate) {
            selectedDate.setHours(0, 0, 0, 0);
        } else {
            selectedDate = new Date();
            selectedDate.setHours(0, 0, 0, 0);
        }
        const formattedSelectedDate = selectedDate.toLocaleDateString('en-CA');

        console.log('Fetching meetings for date:', formattedSelectedDate);

        // Fetch shortlisted candidates (Meetings)
        const response = await fetch(`https://demotag.vercel.app/api/panel-candidates-info?l_2_interviewdate=${formattedSelectedDate}&userEmail=${userEmail}`);
        if (!response.ok) {
            throw new Error('Failed to fetch shortlisted candidates');
        }
        const candidatesData = await response.json();
        console.log('Candidates fetched:', candidatesData);

        // Fetch feedback for the selected date
        console.log('Fetching feedback for date:', formattedSelectedDate);
        const feedbackResponse = await fetch(`https://demotag.vercel.app/api/feedback-for-panel-member?interview_date=${formattedSelectedDate}&userEmail=${userEmail}`);
        if (!feedbackResponse.ok) {
            throw new Error('Failed to fetch feedback');
        }
        const feedbacks = await feedbackResponse.json();
        console.log('Feedback fetched:', feedbacks);

        // Clear previous content
        meetingContainer.innerHTML = ''; 
        feedbackContainer.innerHTML = ''; 

        // Display meeting cards
        if (candidatesData.length === 0 && feedbacks.length === 0) {
            meetingContainer.innerHTML = '<p>No meetings scheduled for this date.</p>';
        } else {
            candidatesData.forEach(candidate => {
                const formattedDate = new Date(candidate.l_2_interviewdate).toLocaleDateString('en-CA'); // Format as 'YYYY-MM-DD'
    
                // Get the round details based on the recruitment phase
                const roundDetails = roundDetailsMap[candidate.recruitment_phase] || candidate.recruitment_phase;  // Default to the phase name if no match
    
                const candidateCard = document.createElement('div');
                candidateCard.classList.add('meeting-card');
    
                const cardContent = `
                    <div class="meeting-header">
                        <div>
                            <h4 class="meeting-title">Meeting with - ${candidate.candidate_name}</h4>
                        </div>
                    </div>
                    <div class="meeting-details">
                        <div class="meeting-info">
                            <div class="meeting-location">Inteview Details: ${roundDetails}</div>
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
                        <button class="btn btn-resume"><a href="${candidate.resume}" target="_blank">Candidate Resume</a></button>
                        <button class="btn btn-mocha"><a href="${candidate.imocha_report}" target="_blank">iMocha Result</a></button>
    
                        <button class="btn btn-feedback" onclick="openFeedbackForm('${candidate.candidate_email}', '${candidate.recruitment_phase}')">Feedback Form</button>
                    </div>
                `;
    
                candidateCard.innerHTML = cardContent;
                    
        localStorage.setItem('roundDetails', roundDetails);
        localStorage.setItem('emailcandidate', candidate.candidate_email);
        console.log(candidate.candidate_email);
                meetingContainer.appendChild(candidateCard);  // Add the card to the container
            });
        }
        // Display feedback cards
        if (feedbacks.length > 0) {
                feedbacks.forEach((feedback) => {
                const feedbackCard = document.createElement('div');
                feedbackCard.classList.add('feedback-card');
            
                feedbackCard.innerHTML = `
                    <div class="feedback-header">
                        <h4 class="feedback-title">Feedback for - ${feedback.candidate_name}</h4>
                    </div>
                    <div class="feedback-details">
                        <p><b>Position:</b> ${feedback.position}</p>
                        <p><b>Interview Round:</b> ${feedback.round_details}</p>
                        <p><b>Email:</b> ${feedback.candidate_email}</p>
                        <p><b>Result:</b> ${feedback.result}</p>
                        <p><b>Submitted At:</b> ${new Date(feedback.submitted_at).toLocaleString()}</p>
                    </div>
                    <div class="feedback-content">
                        <p><strong>Feedback:</strong> ${feedback.detailed_feedback}</p>
                    </div>
                    <div class="buttons">
                        <button class="btn btn-feedback" onclick="openFeedbackForm('${feedback.candidate_email}', '${feedback.round_details}')">Feedback Form</button>
                    </div>
                `;
            
                feedbackContainer.appendChild(feedbackCard);
            });            
        }
    }catch (error) {
        console.error("Error fetching meetings:", error);
        meetingContainer.innerHTML = '<p>Error fetching meetings.</p>';
    }
}





// Fetch previous feedback for a candidate
async function fetchFeedbackForCandidate(candidateEmail) {
    const feedbackContainer = document.getElementById('feedback-container');

    try {
        const response = await fetch(`https://demotag.vercel.app/api/candidate-feedback?candidateEmail=${candidateEmail}`);
        if (!response.ok) {
            throw new Error('Failed to fetch feedback');
        }

        const feedbacks = await response.json();
        console.log(`Feedback fetched for ${candidateEmail}:`, feedbacks);

        if (feedbacks.length === 0) {
            return; // No feedback found, do nothing
        }

        feedbacks.forEach(feedback => {
            const feedbackCard = document.createElement('div');
            feedbackCard.classList.add('feedback-card');

            feedbackCard.innerHTML = `
                <div class="feedback-header">
                    <h4>Feedback for ${feedback.candidate_name} (${feedback.position})</h4>
                </div>
                <div class="feedback-details">
                    <p><strong>Interviewer:</strong> ${feedback.interviewer_name}</p>
                    <p><strong>HR Email:</strong> ${feedback.hr_email}</p>
                    <p><strong>Interview Date:</strong> ${new Date(feedback.interview_date).toLocaleDateString('en-CA')}</p>
                    <p><strong>Round Details:</strong> ${feedback.round_details}</p>
                    <p><strong>iMocha Score:</strong> ${feedback.imocha_score}</p>
                    <p><strong>RRF ID:</strong> ${feedback.rrf_id}</p>
                    <p><strong>Result:</strong> ${feedback.result}</p>
                    <p><strong>Feedback:</strong> ${feedback.detailed_feedback}</p>
                    <p><strong>Submitted At:</strong> ${new Date(feedback.submitted_at).toLocaleString()}</p>
                </div>
            `;

            feedbackContainer.appendChild(feedbackCard);
        });

    } catch (error) {
        console.error("Error fetching feedback:", error);
        feedbackContainer.innerHTML = '<p>Error fetching feedback.</p>';
    }
}



function openFeedbackModal(roundDetails) {
    const feedbackFormUrl = getFeedbackFormUrl(roundDetails);
    
    const feedbackFormIframe = document.getElementById('feedbackFormIframe');
    feedbackFormIframe.src = feedbackFormUrl;
    
    document.getElementById('feedbackModal').style.display = 'block';

}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
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
