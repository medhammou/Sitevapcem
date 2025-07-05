const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

// Modèles
const User = sequelize.define("User", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: Sequelize.STRING, unique: true },
  password: { type: Sequelize.STRING },
  role: { type: Sequelize.ENUM("admin", "technician", "client") },
  fullName: { type: Sequelize.STRING },
});

const Client = sequelize.define("Client", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: Sequelize.STRING },
  address: { type: Sequelize.TEXT },
  contactPerson: { type: Sequelize.STRING },
  phone: { type: Sequelize.STRING },
});

const Pest = sequelize.define("Pest", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING },
  scientificName: { type: Sequelize.STRING },
  riskLevel: { type: Sequelize.ENUM("low", "medium", "high") },
  treatmentOptions: { type: Sequelize.TEXT },
  image: { type: Sequelize.STRING },
});

const Intervention = sequelize.define("Intervention", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: Sequelize.DATE, allowNull: false },
  address: { type: Sequelize.TEXT, allowNull: false },
  interventionType: {
    type: Sequelize.ENUM(
      "désinsectisation",
      "dératisation",
      "désinfection",
      "autre"
    ),
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM("planned", "completed", "cancelled"),
    defaultValue: "planned",
  },
  report: { type: Sequelize.TEXT },
  technicianNotes: { type: Sequelize.TEXT },
  clientId: { type: Sequelize.INTEGER, allowNull: false },
  assignedTo: { type: Sequelize.INTEGER }, // User ID
  pestId: { type: Sequelize.INTEGER },
  aiConfidence: { type: Sequelize.FLOAT },
});

// Relations
User.hasMany(Client);
Client.belongsTo(User);

Client.hasMany(Intervention, { foreignKey: "clientId" });
Intervention.belongsTo(Client, { foreignKey: "clientId" });

User.hasMany(Intervention, { foreignKey: "assignedTo" });
Intervention.belongsTo(User, { foreignKey: "assignedTo" });

module.exports = { sequelize, User, Client, Intervention };
