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