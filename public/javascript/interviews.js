const calendarContainer = document.getElementById("calendarContainer");
const interviewsBtn = document.getElementById("interviewsBtn");
const meetingDateElement = document.querySelector(".meeting-date");
const calendarGrid = document.querySelector(".calendar-grid");
const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const meetingContainer = document.getElementById("meeting-container");
const calendarMonthYearElement = document.getElementById("calendarMonthYear");

function joinMeetingAndShowFeedback(candidateEmail) {
    window.open(document.getElementById("joinLink").href, "_blank");
}

function openFeedbackForm(candidateEmail) {
    document.getElementById("feedbackModal").style.display = "block";

    const iframe = document.getElementById('feedbackFormIframe');
    iframe.src = `L2-Technical.html?candidateEmail=${encodeURIComponent(candidateEmail)}`;
}

function closeFeedbackModal() {
    document.getElementById("feedbackModal").style.display = "none";
}

window.onclick = function (event) {
    var modal = document.getElementById("feedbackModal");
    if (event.target == modal) {
        modal.style.display = "none";
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

async function fetchMeetingsForSelectedDate(selectedDate) {
    const meetingContainer = document.getElementById('meeting-container'); // Ensure this element exists
    try {
        selectedDate.setHours(0, 0, 0, 0);
        const formattedSelectedDate = selectedDate.toLocaleDateString('en-CA');

        console.log('Fetching meetings for date:', formattedSelectedDate);

        const response = await fetch(`https://demotag.vercel.app/api/panel-candidates-info?l_2_interviewdate=${formattedSelectedDate}`);
        if (!response.ok) {
            throw new Error('Failed to fetch shortlisted candidates');
        }

        const candidates = await response.json();
        console.log('Candidates fetched:', candidates);  // Log the fetched candidates to check

        meetingContainer.innerHTML = ''; // Clear the container first

        // Check if no candidates are found
        if (candidates.length === 0) {
            meetingContainer.innerHTML = '<p>No meetings scheduled for this date.</p>';
            return;  // Exit the function early if no candidates are found
        }

        // Loop through candidates and create meeting cards
        candidates.forEach(candidate => {
            const formattedDate = new Date(candidate.l_2_interviewdate).toLocaleDateString('en-CA'); // Format as 'YYYY-MM-DD'

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
                        <div class="meeting-location">Role: ${candidate.role}</div>
                        <div class="meeting-location">Email: ${candidate.candidate_email}</div>
                        <div class="meeting-location">🕐 ${formattedDate} , ${candidate.l_2_interviewtime}</div>
                    </div>

                    <button class="btn-teams" onclick="joinMeetingAndShowFeedback('${candidate.candidate_email}')">
                        <img src="teams.png" alt="Teams Logo" class="teams-logo">
                        <a href="${candidate.meeting_link}" target="_blank" class="join-link" id="joinLink">Join Meeting</a>
                    </button>
                </div>
                
                <div class="buttons">
                    <button class="btn btn-resume"><a href="${candidate.resume}" target="_blank">Candidate Resume</a></button>
                    <button class="btn btn-mocha"><a href="${candidate.imocha_report}" target="_blank">iMocha Result</a></button>

                    <button class="btn btn-feedback" onclick="openFeedbackForm('${candidate.candidate_email}')">Feedback Form</button>
                    <div id="feedbackModal" class="modal">
                        <div class="modal-content">
                            <span class="close-btn" onclick="closeFeedbackModal()">&times;</span>
                            <h2>Feedback Form</h2>
                            <iframe id="feedbackFormIframe" src="L2-Technical.html" width="100%" height="100%"></iframe>
                        </div>
                    </div>
                </div>
            `;

            candidateCard.innerHTML = cardContent;
            meetingContainer.appendChild(candidateCard);
        });
    } catch (error) {
        console.error("Error fetching meetings:", error);
        meetingContainer.innerHTML = '<p>Error fetching meetings.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    fetchMeetingsForSelectedDate(today);
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('show');
    if (sidebar.classList.contains('show')) {
      mainContent.classList.add('shift');
    } else {
      mainContent.classList.remove('shift');
    }
  }

renderCalendar(currentMonth, currentYear);
monthSelector.value = currentMonth;
yearSelector.value = currentYear;

// Populate the year selector
for (let i = 1951; i <= 2200; i++) {
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

// Event listener for the previous month button
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

// Event listener for the next month button
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