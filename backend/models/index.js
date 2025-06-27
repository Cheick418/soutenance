const sequelize = require("./sequelize");
const Etudiant = require("./etudiant");
const Admin = require("./admin");
const DemandeStage = require("./demandeStage");
const Soutenance = require("./soutenance");
const Finalisation = require("./finalisation");
const DemandeSoutenance = require("./demandeSoutenance");

// Synchronisation automatique des modèles
sequelize
  .sync({ alter: true })
  .then(() => console.log("Base de données synchronisée (alter: true)"))
  .catch((err) => console.error("Erreur de synchronisation:", err));

module.exports = sequelize;
