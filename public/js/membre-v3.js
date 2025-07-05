document.addEventListener("DOMContentLoaded", function () {
  console.log("VAPCEM DEBUG: DOMContentLoaded event fired.");

  // Check authentication
  const urlParams = new URLSearchParams(window.location.search);
  const token = localStorage.getItem("token") || urlParams.get("token");
  console.log("VAPCEM DEBUG: Token found:", token ? "Yes" : "No");

  if (!token) {
    console.log("VAPCEM DEBUG: No token, redirecting to /login");
    window.location.href = "/login";
    return;
  }

  // Store token if coming from login
  if (urlParams.has("token")) {
    console.log("VAPCEM DEBUG: Storing token from URL params.");
    localStorage.setItem("token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Dashboard functionality
  if (document.querySelector(".dashboard-container")) {
    console.log("VAPCEM DEBUG: Dashboard container found. Initializing.");
    fetchDashboardData();
    initInterventions();

    document.querySelectorAll(".sidebar nav a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const sectionId = this.getAttribute("href").substring(1);
        showSection(sectionId);
      });
    });

    const hashSection = window.location.hash.substring(1);
    console.log("VAPCEM DEBUG: Hash from URL is:", hashSection);
    const defaultSection = hashSection || "dashboard";
    console.log("VAPCEM DEBUG: Default section to show is:", defaultSection);
    showSection(defaultSection);
  } else {
    console.error("VAPCEM DEBUG: ERROR! Dashboard container not found!");
  }

  async function fetchDashboardData() {
    console.log("VAPCEM DEBUG: Fetching dashboard data...");
    try {
      const response = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        console.log("VAPCEM DEBUG: Dashboard data loaded successfully.");
        updateStats(data.stats);
        updateRecentActivity(data.activities);
      } else {
        console.error("VAPCEM DEBUG: Failed to load dashboard data.", data);
      }
    } catch (error) {
      console.error("VAPCEM DEBUG: Error fetching dashboard data:", error);
    }
  }

  function initInterventions() {
    const interventionsBtn = document.getElementById("new-intervention");
    if (interventionsBtn) {
      interventionsBtn.addEventListener("click", () => {
        console.log("VAPCEM DEBUG: New intervention button clicked");
        // TODO: Implement new intervention modal
      });
    }

    const filterBtn = document.getElementById("filter-interventions");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        const status = document.getElementById("intervention-status").value;
        const date = document.getElementById("intervention-date").value;
        console.log(
          `VAPCEM DEBUG: Filtering interventions - Status: ${status}, Date: ${date}`
        );
        loadInterventions(status, date);
      });
    }

    loadInterventions();
  }

  async function loadInterventions(status = "all", date = "") {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (date) params.append("date", date);

      const response = await fetch(`/api/interventions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur de chargement");

      const interventions = await response.json();
      renderInterventions(interventions);
    } catch (error) {
      console.error("VAPCEM DEBUG: Error loading interventions:", error);
    }
  }

  function renderInterventions(interventions) {
    const tbody = document.getElementById("interventions-table-body");
    if (!tbody) return;

    tbody.innerHTML = interventions
      .map(
        (intervention) => `
      <tr>
        <td>${formatDate(intervention.date)}</td>
        <td>${intervention.client}</td>
        <td>${intervention.address}</td>
        <td>${intervention.type}</td>
        <td><span class="status-badge ${intervention.status}">${getStatusText(
          intervention.status
        )}</span></td>
        <td>
          <button class="btn-action view" data-id="${
            intervention.id
          }">Voir</button>
          <button class="btn-action edit" data-id="${
            intervention.id
          }">Modifier</button>
        </td>
      </tr>
    `
      )
      .join("");

    // Add event listeners to action buttons
    document.querySelectorAll(".btn-action.view").forEach((btn) => {
      btn.addEventListener("click", () => viewIntervention(btn.dataset.id));
    });
    document.querySelectorAll(".btn-action.edit").forEach((btn) => {
      btn.addEventListener("click", () => editIntervention(btn.dataset.id));
    });
  }

  function formatDate(dateString) {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  }

  function getStatusText(status) {
    const statusMap = {
      planned: "Planifiée",
      completed: "Terminée",
      cancelled: "Annulée",
    };
    return statusMap[status] || status;
  }

  async function viewIntervention(id) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interventions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Intervention non trouvée");

      const intervention = await response.json();

      // Afficher les détails dans une modal
      const modalContent = `
        <div class="modal-content">
          <h3>Détails de l'intervention #${intervention.id}</h3>
          <p><strong>Date:</strong> ${formatDate(intervention.date)}</p>
          <p><strong>Client:</strong> ${intervention.Client.companyName}</p>
          <p><strong>Adresse:</strong> ${intervention.address}</p>
          <p><strong>Type:</strong> ${intervention.interventionType}</p>
          <p><strong>Statut:</strong> ${getStatusText(intervention.status)}</p>
          ${
            intervention.report
              ? `<p><strong>Rapport:</strong> ${intervention.report}</p>`
              : ""
          }
          ${
            intervention.technicianNotes
              ? `<p><strong>Notes:</strong> ${intervention.technicianNotes}</p>`
              : ""
          }
        </div>
      `;

      showModal(modalContent);
    } catch (error) {
      console.error("VAPCEM DEBUG: Error viewing intervention:", error);
      alert("Erreur lors du chargement des détails");
    }
  }

  async function editIntervention(id) {
    try {
      const token = localStorage.getItem("token");

      // Récupérer les données actuelles
      const response = await fetch(`/api/interventions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Intervention non trouvée");

      const intervention = await response.json();
      const typesResponse = await fetch("/api/interventions/types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const types = await typesResponse.json();

      // Créer le formulaire d'édition
      const form = document.createElement("form");
      form.innerHTML = `
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${
            intervention.date.split("T")[0]
          }" required>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select name="interventionType" required>
            ${types
              .map(
                (type) =>
                  `<option value="${type}" ${
                    type === intervention.interventionType ? "selected" : ""
                  }>
                ${type}
              </option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Statut</label>
          <select name="status" required>
            <option value="planned" ${
              intervention.status === "planned" ? "selected" : ""
            }>Planifiée</option>
            <option value="completed" ${
              intervention.status === "completed" ? "selected" : ""
            }>Terminée</option>
            <option value="cancelled" ${
              intervention.status === "cancelled" ? "selected" : ""
            }>Annulée</option>
          </select>
        </div>
        <div class="form-group">
          <label>Rapport</label>
          <textarea name="report">${intervention.report || ""}</textarea>
        </div>
        <div class="form-group">
          <label>Notes techniques</label>
          <textarea name="technicianNotes">${
            intervention.technicianNotes || ""
          }</textarea>
        </div>
        <button type="submit" class="btn-primary">Enregistrer</button>
      `;

      form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(form));

        try {
          const updateResponse = await fetch(`/api/interventions/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });

          if (!updateResponse.ok) throw new Error("Erreur de mise à jour");

          alert("Intervention mise à jour avec succès");
          loadInterventions();
          closeModal();
        } catch (error) {
          console.error("VAPCEM DEBUG: Error updating intervention:", error);
          alert("Erreur lors de la mise à jour");
        }
      };

      showModal(form);
    } catch (error) {
      console.error("VAPCEM DEBUG: Error editing intervention:", error);
      alert("Erreur lors du chargement des données");
    }
  }

  function showModal(content) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-container">
        <button class="modal-close">&times;</button>
        ${content}
      </div>
    `;

    modal.querySelector(".modal-close").onclick = closeModal;
    modal.querySelector(".modal-backdrop").onclick = closeModal;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = document.querySelector(".modal");
    if (modal) {
      document.body.removeChild(modal);
      document.body.style.overflow = "";
    }
  }

  function updateStats(stats) {
    // Implementation...
  }

  function updateRecentActivity(activities) {
    // Implementation...
  }

  function showSection(sectionId) {
    console.log(`VAPCEM DEBUG: showSection called with ID: '${sectionId}'`);
    const sections = document.querySelectorAll(".dashboard-section");
    console.log(`VAPCEM DEBUG: Found ${sections.length} sections to manage.`);
    sections.forEach((section) => {
      section.style.display = "none";
    });
    console.log("VAPCEM DEBUG: All sections hidden.");

    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
      console.log(`VAPCEM DEBUG: Showing section #${sectionId}`);
      sectionToShow.style.display = "block";
    } else {
      console.error(
        `VAPCEM DEBUG: ERROR! Section with ID #${sectionId} not found. Falling back to dashboard.`
      );
      showSection("dashboard");
    }

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

  // AI Pest Identification logic...
});
