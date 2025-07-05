const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { sequelize, Intervention, Client, User } = require("./models/db");
const app = express();
const port = 3001;

// Configuration de base
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Route pour la page membre
app.get("/membre", (req, res) => {
  res.sendFile(path.join(__dirname, "views/membre.html"));
});

// ... (conserver toutes les routes API existantes)

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log("Routes disponibles:");
  console.log("- GET /membre");
  console.log("- GET /api/interventions");
  console.log("- POST /api/interventions");
  console.log("- GET /api/interventions/types");
  console.log("- GET /api/interventions/:id");
  console.log("- PUT /api/interventions/:id");
  console.log("- GET /api/dashboard");
});
