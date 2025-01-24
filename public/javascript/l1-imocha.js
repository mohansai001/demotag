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
            const response = await fetch(
              `https://tagaiaccelerator.vercel.app/api/hr/${hrId}`
            );

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

      window.onload = function () {
        const candidateDetails = JSON.parse(
          localStorage.getItem("candidateDetails")
        );
        if (candidateDetails) {
          const candidateName = candidateDetails.candidateName;
          const candidateNameElements =
            document.querySelectorAll(".candidateName");
          candidateNameElements.forEach((element) => {
            element.innerText = candidateName;
            element.value = candidateName;
          });

          const candidateEmail = candidateDetails.candidateEmail;
          const candidateEmailElements =
            document.querySelectorAll(".candidateEmail");
          candidateEmailElements.forEach((element) => {
            element.innerText = candidateEmail;
            element.value = candidateEmail;
          });

          document.getElementById("statusText").innerText = candidateDetails.statusText;
          document.getElementById("role").innerText = candidateDetails.role;
          document.getElementById("finalSummary").innerText = candidateDetails.finalSummary;
          document.getElementById("globalHrEmail").innerText = candidateDetails.globalHrEmail;
          document.getElementById("globalRrfId").innerText = candidateDetails.globalRrfId;


          const candidatePhoneNumber = candidateDetails.candidatePhoneNumber;
          const candidatePhoneNumberElements = document.querySelectorAll(
            ".candidatePhoneNumber"
          );
          candidatePhoneNumberElements.forEach((element) => {
            element.innerText = candidatePhoneNumber;
            element.value = candidatePhoneNumber;
          });

          const suitabilityPercentage = candidateDetails.suitabilityPercentage;
          const suitabilityElements = document.querySelectorAll(
            ".suitabilityPercentage"
          );
          suitabilityElements.forEach((element) => {
            element.innerText = suitabilityPercentage + "%";
          });
        }
      };

      const sendEmailInvite = async () => {
        const sendButton = document.querySelector(".send-email-btn");
        sendButton.textContent = "Sending...";
        sendButton.disabled = true;

        const candidateDetails = JSON.parse(
          localStorage.getItem("candidateDetails")
        );

        if (!candidateDetails) {
          showToast("No candidate details found.", "error");
          sendButton.textContent = "Send Exam Invite";
          sendButton.disabled = false;
          return;
        }

        const { candidateName, candidateEmail, role, globalHrEmail } = candidateDetails;

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
        };

        const inviteId = roleToInviteIdMap[role];
        if (!inviteId) {
          showToast("Invalid role selected. Please check the role.", "error");
          sendButton.textContent = "Send Exam Invite";
          sendButton.disabled = false;
          return;
        }

        const targetUrl = `https://tagaiaccelerator.vercel.app/api/invite-candidate`;
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
          showToast(
            "Failed to send invite request. Please try again.",
            "error"
          );
          sendButton.textContent = "Send Exam Invite";
          sendButton.disabled = false;
        }
      };

      function skipEmailInvite() {
        const recruitmentPhase = "No iMocha Exam";
    
        // Update recruitment phase in the database
        fetch('https://tagaiaccelerator.vercel.app/api/update-candidate-recruitment-phase', {
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
    
