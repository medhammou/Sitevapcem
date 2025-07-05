document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  const urlParams = new URLSearchParams(window.location.search);
  const token = localStorage.getItem("token") || urlParams.get("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  // Store token if coming from login
  if (urlParams.has("token")) {
    localStorage.setItem("token", token);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Dashboard functionality
  if (document.querySelector(".dashboard-container")) {
    // Load dashboard data
    fetchDashboardData();

    // Handle navigation
    document.querySelectorAll(".sidebar nav a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const sectionId = this.getAttribute("href").substring(1);
        showSection(sectionId);
      });
    });

    // Show default section on load
    const hashSection = window.location.hash.substring(1);
    const defaultSection = hashSection || "dashboard";
    showSection(defaultSection);
  }

  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        updateStats(data.stats);
        updateRecentActivity(data.activities);
      } else {
        console.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  function updateStats(stats) {
    document.querySelector(".stat-value:nth-child(1)").textContent =
      stats.interventions;
    document.querySelector(".stat-value:nth-child(2)").textContent =
      stats.clients;
    document.querySelector(".stat-value:nth-child(3)").textContent =
      stats.products;
  }

  function updateRecentActivity(activities) {
    const activityList = document.querySelector(".activity-list");
    activityList.innerHTML = activities
      .map(
        (activity) => `
          <li>
            <strong>${activity.type}</strong> - ${activity.description}
            <small>${new Date(activity.date).toLocaleString()}</small>
          </li>
        `
      )
      .join("");
  }

  function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.style.display = "none";
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = "block";
    } else {
      // Fallback to dashboard if section doesn't exist
      showSection("dashboard");
    }

    // Update active nav item
    document.querySelectorAll(".sidebar nav li").forEach((li) => {
      li.classList.remove("active");
    });
    const navItem = document.querySelector(
      `.sidebar nav a[href="#${sectionId}"]`
    );
    if (navItem) {
      navItem.parentNode.classList.add("active");
    }
  }

  // AI Pest Identification
  if (document.getElementById("ai-identification")) {
    const imageInput = document.getElementById("pest-image");
    const imagePreview = document.getElementById("image-preview");
    const analyzeBtn = document.getElementById("analyze-btn");
    const resultsContainer = document.getElementById("ai-results");

    imageInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
          analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      }
    });

    analyzeBtn.addEventListener("click", async function () {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = "Analyse en cours...";

      try {
        const file = imageInput.files[0];
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/ai/identify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        displayResults(data);
      } catch (error) {
        console.error("Error:", error);
        resultsContainer.innerHTML = `<div class="error">Erreur lors de l'analyse</div>`;
      } finally {
        analyzeBtn.textContent = "Analyser";
      }
    });

    function displayResults(data) {
      if (!data.success) {
        resultsContainer.innerHTML = `<div class="error">${data.error}</div>`;
        return;
      }

      let html = `<h3>Résultats d'analyse</h3>`;

      data.pests.forEach((pest, index) => {
        const recommendation = data.recommendations[index];
        html += `
              <div class="pest-result">
                <h4>${pest.name} (${pest.scientificName})</h4>
                <div class="confidence-meter">
                  <div class="confidence-level" style="width: ${
                    pest.confidence * 100
                  }%"></div>
                </div>
                <p>Niveau de risque: <strong>${pest.riskLevel}</strong></p>
                <p>Options de traitement: ${pest.treatmentOptions}</p>
                
                <div class="recommendations">
                  <h5>Recommandations:</h5>
                  <ul>
                    ${recommendation.immediateActions
                      .map((action) => `<li>${action}</li>`)
                      .join("")}
                  </ul>
                  <h5>Prévention à long terme:</h5>
                  <ul>
                    ${recommendation.longTermPrevention
                      .map((action) => `<li>${action}</li>`)
                      .join("")}
                  </ul>
                </div>
              </div>
            `;
      });

      resultsContainer.innerHTML = html;
    }
  }
});
