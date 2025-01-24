
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
  const loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.style.display = 'flex'; // Show the loading overlay

  try {
    const response = await fetch('https://tagaiaccelerator.vercel.app/api/get-shortlisted-candidates');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debugging line

    const candidates = Array.isArray(data) ? data : data.candidates || [];

    const tableBody = document.querySelector('#candidates-table tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    candidates.forEach(candidate => {
      const row = document.createElement('tr');
      row.classList.add('candidate');
      row.dataset.status = candidate.recruitment_phase === 'Imocha Completed' ? 'completed' : 'not-completed';

      const formattedDate = candidate.date
        ? new Date(candidate.date).toISOString().split('T')[0]
        : 'N/A';

      // const isScoreAvailable = candidate.score !== null && candidate.score !== undefined;
      const isEligibleForScheduling = candidate.recruitment_phase === 'Moved to L2' || candidate.recruitment_phase === 'No iMocha Exam';

      row.innerHTML = `
    <td>${candidate.rrf_id}</td>
    <td>${candidate.candidate_name}</td>
    <td>${candidate.candidate_email}</td>
    <td>${candidate.candidate_phone}</td>
    <td>${candidate.role}</td>
    <td>${candidate.score || 'N/A'}</td>
    <td>${candidate.recruitment_phase}</td>
    <td>${formattedDate}</td>
    <td><button class="schedule-btn" ${isEligibleForScheduling ? '' : 'disabled'}>Schedule L2</button></td>
  `;

      const button = row.querySelector('.schedule-btn');
      if (isEligibleForScheduling) {
        button.addEventListener('click', handleScheduleClick);
      }

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
  } finally {
    loadingOverlay.style.display = 'none'; // Hide the loading overlay
  }
}





// Call fetch function when the page loads
document.addEventListener('DOMContentLoaded', fetchCandidatesInfo);
// Function to filter candidates based on search and status
function filterCandidates() {
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const filterStatus = document.getElementById('filter-status').value;
  const candidates = document.querySelectorAll('.candidate');

  candidates.forEach((candidate) => {
    const name = candidate.cells[0].innerText.toLowerCase();
    const email = candidate.cells[1].innerText.toLowerCase();
    const status = candidate.getAttribute('data-status');
    const matchSearch = name.includes(searchInput) || email.includes(searchInput);
    const matchStatus = filterStatus === 'all' || filterStatus === status;

    if (matchSearch && matchStatus) {
      candidate.style.display = '';
    } else {
      candidate.style.display = 'none';
    }
  });
}

document.querySelector('#candidates-table tbody').addEventListener('click', function (event) {
  const button = event.target.closest('button.schedule-btn');
  if (button) {
    handleScheduleClick(event);
  }
});

// Function to handle the modal for scheduling
function handleScheduleClick(event) {
  try {
    const candidateRow = event.target.closest('tr');
    if (!candidateRow) {
      throw new Error('Table row not found. Ensure the button is inside a <tr> element.');
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
        const candidateEmail = candidateRow.cells[2].innerText; // Candidate email
        const panel = document.getElementById('panel-select').value; // Panel email
        const dateTime = document.getElementById('datetime-input').value;

        // API request to create Teams meeting and update status
        const response = await fetch(`https://tagaiaccelerator.vercel.app/api/update-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: candidateEmail,
            status: 'L2 Scheduled',
            panel: panel,
            dateTime: dateTime,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update candidate status');
        }

        const data = await response.json();
        const successMessage = document.getElementById("success-message");
        successMessage.innerText = `Interview for ${candidateName} scheduled successfully! Meeting link sent to ${candidateEmail} and ${panel}.`;
        successMessage.style.display = "block";

        // Update status in the table
        candidateRow.cells[6].innerText = 'L2 Scheduled';
        button.disabled = true;

        // Close modal after delay
        setTimeout(() => {
          modal.classList.remove("active");
          overlay.classList.remove("active");
          successMessage.style.display = "none";
        }, 3000);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };
  } catch (error) {
    console.error('Error in handleScheduleClick:', error);
  }
}




// Close modal functionality
document.getElementById('close-modal-btn').addEventListener('click', () => {
  document.getElementById("schedule-modal").classList.remove("active");
  document.getElementById("modal-overlay").classList.remove("active");
});

// Event listeners for search and filter
document.getElementById('search-input').addEventListener('input', filterCandidates);
document.getElementById('filter-status').addEventListener('change', filterCandidates);

// Adding event listener for the schedule buttons
document.querySelectorAll('schedule-btn').forEach(button => {
  if (!button.disabled) {
    button.addEventListener('click', handleScheduleClick);
  }
});
