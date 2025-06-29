const sequelize = require("./sequelize");
const Etudiant = require("./etudiant");
const Admin = require("./admin");
const DemandeStage = require("./demandeStage");
const Soutenance = require("./soutenance");
const Finalisation = require("./finalisation");
const DemandeSoutenance = require("./demandeSoutenance");

// Définition des associations
Etudiant.hasMany(DemandeStage, { foreignKey: "etudiantId" });
DemandeStage.belongsTo(Etudiant, { foreignKey: "etudiantId" });

Etudiant.hasMany(Soutenance, { foreignKey: "etudiantId" });
Soutenance.belongsTo(Etudiant, { foreignKey: "etudiantId" });

Etudiant.hasMany(Finalisation, { foreignKey: "etudiantId" });
Finalisation.belongsTo(Etudiant, { foreignKey: "etudiantId" });

Etudiant.hasMany(DemandeSoutenance, { foreignKey: "etudiantId" });
DemandeSoutenance.belongsTo(Etudiant, { foreignKey: "etudiantId" });

// Synchronisation automatique des modèles
sequelize
  .sync({ alter: true })
  .then(() => console.log("Base de données synchronisée (force: true)"))
  .catch((err) => console.error("Erreur de synchronisation:", err));

module.exports = sequelize;
