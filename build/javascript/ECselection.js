function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}

function navigateTo(url) {
  window.location.href = url;
}

function navigateToPage() {
  window.location.href = "Dashboard.html";
}

function navigateTo(page, value) {
  // Append the selected value as a query parameter
  const url = `${page}?selectedValue=${encodeURIComponent(value)}`;
  window.location.href = url;
}

// Get the 'ec_mapping' values from the URL
const urlParams = new URLSearchParams(window.location.search);
const ecMappingParam = urlParams.get("ec_mapping");

// Disable non-matching cards if ec_mapping is present
if (ecMappingParam) {
  // Split the ec_mapping parameter to handle multiple values
  const ecMappings = ecMappingParam.split(',').map(item => item.trim());  // Get array of EC values

  const cards = document.querySelectorAll(".card");  // Get all card elements

  cards.forEach((card) => {
    const cardTitle = card.querySelector(".card-title").innerText.trim();  // Get the title of the card

    // If the card title does not match any of the ec_mapping values, disable it
    if (!ecMappings.includes(cardTitle)) {
      card.style.pointerEvents = "none";  // Disable interaction with the card
      card.style.opacity = "0.5";  // Optional: make the disabled cards look grayed out
    } else {
      card.style.pointerEvents = "auto";  // Enable interaction with the card
      card.style.opacity = "1";  // Restore the normal appearance of the enabled cards
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  // Select your logout div using its class name
  const logoutButton = document.querySelector('.logout-option');

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      // Get the stored ID from localStorage
      const loginId = localStorage.getItem('loggin-id');

      if (!loginId) {
        console.error('No login ID found. Cannot process logout time update.');
        // Clear session and redirect anyway as a fallback
        localStorage.clear(); 
        window.location.href = 'index.html'; // Redirect to the login page
        return;
      }
      
      try {
        // Call the endpoint to update the logout time in your database
        const response = await fetch('/api/log-logout', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: loginId }),
        });

        if (!response.ok) {
          console.error('Failed to update logout time:', await response.text());
        } else {
          console.log('Logout time updated successfully.');
        }

      } catch (error) {
        console.error('Error during logout API call:', error);
      } finally {
        // This block runs regardless of whether the API call succeeded or failed
        
        // **IMPORTANT**: Clear the session data from the browser
        localStorage.removeItem('loggin-id');
        localStorage.removeItem('userEmail');
        // Or use localStorage.clear() to remove everything

        // Redirect to the login page
        window.location.href = 'index.html'; 
      }
    });
  }
});
