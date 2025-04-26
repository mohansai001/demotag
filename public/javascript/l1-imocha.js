function navigateBack() {
  window.location.href = "cloudrecruit.html";
}
// Show Toast Function
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.className = `toast ${type}`; // success, error
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

async function fetchHRDetails() {
  const hrId = document.getElementById("hr-id-dropdown").value;

  if (hrId) {
    try {
      const response = await fetch(`https://demotag.vercel.app/api/hr/${hrId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch HR details");
      }

      const data = await response.json();

      document.getElementById("hr-name").textContent = data.name;
      document.getElementById("hr-email").textContent = data.email;

      document.getElementById("hr-details-card").style.display = "block";
    } catch (error) {
      showToast(error.message, "error");
    }
  } else {
    document.getElementById("hr-details-card").style.display = "none";
  }
}

//getting candidateID using local storage

const candidateId = localStorage.getItem("candidateId");

let globalRrfId; // Declare a global variable

window.onload = function () {

  const candidateDetails = JSON.parse(localStorage.getItem("candidateDetails"));
  if (candidateDetails) {
    const candidateName = candidateDetails.candidateName;
    const candidateNameElements = document.querySelectorAll(".candidateName");
    candidateNameElements.forEach((element) => {
      element.innerText = candidateName;
      element.value = candidateName;
    });

    const candidateEmail = candidateDetails.candidateEmail;
    const candidateEmailElements = document.querySelectorAll(".candidateEmail");
    candidateEmailElements.forEach((element) => {
      element.innerText = candidateEmail;
      element.value = candidateEmail;
    });

    document.getElementById("statusText").innerText = candidateDetails.statusText;
    document.getElementById("role").innerText = candidateDetails.role;
    document.getElementById("finalSummary").innerText =
  candidateDetails.finalSummary.split("- Recommendation:")[0].trim();
    document.getElementById("globalHrEmail").innerText = candidateDetails.globalHrEmail;
    document.getElementById("globalRrfId").innerText = candidateDetails.globalRrfId;

    // Store globalRrfId in a global variable
    globalRrfId = candidateDetails.globalRrfId;
    console.log("Global RRF ID:", globalRrfId); // Log for debugging

    const candidatePhoneNumber = candidateDetails.candidatePhoneNumber;
    const candidatePhoneNumberElements = document.querySelectorAll(".candidatePhoneNumber");
    candidatePhoneNumberElements.forEach((element) => {
      element.innerText = candidatePhoneNumber;
      element.value = candidatePhoneNumber;
    });

    const suitabilityPercentage = candidateDetails.suitabilityPercentage;
    const suitabilityElements = document.querySelectorAll(".suitabilityPercentage");
    suitabilityElements.forEach((element) => {
      element.innerText = suitabilityPercentage + "%";
    });
  }
  fetchRoundsFromDB(globalRrfId)
};


const sendEmailInvite = async () => {
  saveRoundsToDB()
  const sendButton = document.querySelector(".send-email-btn");
  sendButton.textContent = "Sending...";
  sendButton.disabled = true;

  const candidateDetails = JSON.parse(localStorage.getItem("candidateDetails"));

  if (!candidateDetails) {
    showToast("No candidate details found.", "error");
    sendButton.textContent = "Send Exam Invite";
    sendButton.disabled = false;
    return;
  }

  const { candidateName, candidateEmail, role, globalHrEmail } =
    candidateDetails;

  const roleToInviteIdMap = {
    "Junior Azure DevOps Engineer": 1292765,
    "Senior Azure DevOps Engineer": 1292976,
    "Junior AWS DevOps Engineer": 1292733,
    "Senior AWS DevOps Engineer": 1292950,
    "Junior Azure Platform Engineer": 1292775,
    "Junior AWS Platform Engineer": 1292769,
    "Senior AWS Platform Engineer": 1292990,
    "Lead AWS Platform Engineer": 1295883,
    "Junior Azure Cloudops Engineer": 1292781,
    "Junior AWS Cloudops Engineer": 1292779,
    "AWS Data Engineer": 1303946,
    "Azure Data Engineer": 1293813,
    "Databricks Data Engineer": 1293971,
    "Hadoop Data Engineer": 1263132,
    "DataStage Data Engineer": 1304065,
    "IBM MDM Data Engineer": 1233151,
    "ETL Data Engineer": 1294495,
    "Oracle Data Engineer": 1302835,
    "IDMC Data Engineer": 1294495,
    "Marklogic Data Engineer": 1304066,
    "SQL Data Engineer": 1304100,
    "Snowflake Data Engineer": 1292173,
    "SSIS Data Engineer": 1293822,
    "Power BI Data – BI Visualization Engineer": 1303985,
    "Tableau Data – BI Visualization Engineer": 1303999,
    "WebFOCUS Data – BI Visualization Engineer": 1304109,
    DataAnalyst: 1304111,
    "Data Modeller": 1304149,
    "Junior .Net Cloud Native Application Engineer - Backend": 1304441,
    "Senior .Net Cloud Native Application Engineer - Backend": 1228695,
    "Junior Java Cloud Native Application Engineer - Backend": 1302022,
    "Senior Java Cloud Native Application Engineer - Backend": 1228712,
    "Junior Angular Cloud Native Application Engineer - Frontend": 1228715,
    "Senior Angular Cloud Native Application Engineer - Frontend": 1228781,
    "Junior React Cloud Native Application Engineer - Frontend": 1288123,
    "Senior React Cloud Native Application Engineer - Frontend": 1228853,
    "Junior Mendix LCNC Platform Engineer": 1229987,
    "Senior Mendix LCNC Platform Engineer": 1229987,
  };

  const inviteId = roleToInviteIdMap[role];
  if (!inviteId) {
    showToast("Invalid role selected. Please check the role.", "error");
    sendButton.textContent = "Send Exam Invite";
    sendButton.disabled = false;
    return;
  }

  const targetUrl = `https://demotag.vercel.app/api/invite-candidate`;
  const requestData = {
    email: candidateEmail,
    name: candidateName,
    sendEmail: "yes",
    callbackURL: "https://www.imocha.io/",
    redirectURL: "https://www.imocha.io/",
    disableMandatoryFields: 0,
    hideInstruction: 0,
    ccEmail: globalHrEmail,
  };

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestData,
        inviteId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    showToast("Invite sent successfully.", "success");
    sendButton.textContent = "Invite Sent";
    setTimeout(() => {
      window.location.href = "candidatespage.html";
    }, 3000);
  } catch (error) {
    showToast("Failed to send invite request. Please try again.", "error");
    sendButton.textContent = "Send Exam Invite";
    sendButton.disabled = false;
  }
};

function skipEmailInvite() {
  saveRoundsToDB()
  const recruitmentPhase = "No iMocha Exam";

  // Update recruitment phase in the database
  fetch('https://demotag.vercel.app/api/update-candidate-recruitment-phase', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          id: candidateId,
          recruitment_phase: recruitmentPhase
      })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          console.log("Recruitment phase updated to 'No iMocha Exam'");
      } else {
          console.log("Error updating recruitment phase");
      }
  })
  .catch(error => {
      console.error("Error:", error);
      console.log("Error updating recruitment phase");
  });


  setTimeout(() => {
      showToast("Skipping iMocha exam", "success");
  }, 0);

  setTimeout(() => {
      window.location.href = "candidatespage.html";
  }, 3000);
}


document.getElementById("addStepButton").addEventListener("click", function () {
  document.getElementById("popupForm").style.display = "flex";
});

// Close the popup when the close button is clicked
document.getElementById("closeButton").addEventListener("click", function () {
  document.getElementById("popupForm").style.display = "none";
});

// Save the new step
// Save the new step
document.getElementById("saveButton").addEventListener("click", function () {
  const name = document.getElementById("name").value;
  const position = document.getElementById("position").value;

  if (name && position) {
    const stepsContainer = document.querySelector(".steps-container");

    // Create a new step element
    const newStep = document.createElement("div");
    newStep.classList.add("step");
    newStep.innerHTML = `
      <div class="step-circle"></div> <!-- Number will be updated later -->
      <div class="step-title">${name}</div>
    `;

    if (position === "before") {
      // Find all steps titled "Fitment"
      const fitmentSteps = Array.from(stepsContainer.children).filter(step =>
        step.querySelector(".step-title").textContent.includes("Fitment")
      );

      // Select the last Fitment step in the list
      const lastFitmentStep = fitmentSteps[fitmentSteps.length - 1];

      // Insert before the last found Fitment step
      if (lastFitmentStep) {
        stepsContainer.insertBefore(newStep, lastFitmentStep);
      } else {
        stepsContainer.appendChild(newStep);
      }
    } else if (position === "after") {
      stepsContainer.appendChild(newStep);
    }

    // Update step numbers correctly
    updateStepNumbers(stepsContainer);

    // Close the popup
    document.getElementById("popupForm").style.display = "none";
    document.getElementById("name").value = ""; // Reset input
  }
});
 
// Helper function to update step numbers
function updateStepNumbers(stepsContainer) {
  let number = 1; // Start numbering from 1
  // Loop through all the steps in the container
  stepsContainer.querySelectorAll(".step").forEach((step) => {
    const stepCircle = step.querySelector(".step-circle");
    stepCircle.textContent = number; // Update the step number
    number++; // Increment the step number for the next iteration
  });
}


function saveRoundsToDB() {
  const rrf_id = globalRrfId; // Replace with dynamic rrf_id if needed
  const rounds = [];

  // Get all steps (rounds) from the UI
  document.querySelectorAll(".steps-container .step").forEach((step) => {
    const roundName = step.querySelector(".step-title").textContent; // Get round name
    rounds.push({ rrf_id, recruitment_rounds: roundName }); // Store it in an array
  });

  // Send the rounds to the backend (Duplicates will be ignored)
  fetch("https://demotag.vercel.app/api/saveRounds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rounds }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast("New rounds saved successfully!", "success");
      } else {
        showToast("No new rounds added. Duplicates were ignored.", "error");
      }
    })
    .catch(error => {
      console.error("Error saving rounds:", error);
    });
}

function displayRounds(rounds) {
  const stepsContainer = document.querySelector(".steps-container");

  // Clear existing steps before adding new ones
  stepsContainer.innerHTML = "";

  // Sort rounds by round_order before displaying (just in case)
  rounds.sort((a, b) => a.round_order - b.round_order);

  rounds.forEach((round, index) => {
    const stepDiv = document.createElement("div");
    if (index < 3) {
      stepDiv.classList.add("step"); // For rounds 1, 2, 3, regular step
    } else {
      stepDiv.classList.add("step", "feedback"); // For rounds 4 and above, add feedback class
    }

    stepDiv.innerHTML = `
      <div class="step-circle">${index + 1}</div>
      <div class="step-title">${round.recruitment_rounds}</div>
    `;

    // Add event listener to steps 4 and above for opening the feedback form popup
    if (index >= 3) {
      stepDiv.addEventListener("click", function () {
        openFeedbackFormPopup(round);
      });
    }

    stepsContainer.appendChild(stepDiv);
  });
}

function openFeedbackFormPopup(round) {
  // Create and show a modal or popup with the feedback form
  const popupForm = document.createElement("div");
  popupForm.classList.add("popup-form");

  // Add the content of the feedback form
  popupForm.innerHTML = `
    <div class="popup-feedback">
      <span class="close-btn" onclick="closePopupForm()">&times;</span>
      <h2>Feedback for Round: ${round.recruitment_rounds}</h2>
      <iframe src="feedbackform.html" width="100%" height="90%"></iframe>
    </div>
  `;

  // Append to the body or a specific container
  document.body.appendChild(popupForm);
  popupForm.style.display = "block";
}

function closePopupForm() {
  // Close the feedback form popup
  const popupForm = document.querySelector(".popup-form");
  if (popupForm) {
    popupForm.style.display = "none";
    popupForm.remove();
  }
}
function fetchRoundsFromDB(globalRrfId) {
  fetch(`https://demotag.vercel.app/api/getRounds?rrf_id=${globalRrfId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.rounds.length > 0) {
        displayRounds(data.rounds);
      } else {
        console.warn("No rounds found for this RRF ID.");
      }
    })
    .catch((error) => {
      console.error("Error fetching rounds:", error);
    });
}




// Add event listeners for buttons
// document.getElementById("skipImocha").addEventListener("click", saveRoundsToDB);
// document.getElementById("sendEmail").addEventListener("click", saveRoundsToDB);

