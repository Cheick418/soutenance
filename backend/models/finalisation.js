const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Finalisation = sequelize.define("finalisation", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  theme: { type: DataTypes.STRING, allowNull: false },
  rapport_final: { type: DataTypes.STRING },
  accord_rapporteur: { type: DataTypes.STRING },
  statut: { type: DataTypes.STRING, defaultValue: "en attente" }, // en attente, valide, refuse
  raison_refus: { type: DataTypes.STRING },
  // Champs pour la finalisation après soutenance
  note: { type: DataTypes.DECIMAL(4, 2) }, // Note sur 20 (ex: 16.50)
  mention: {
    type: DataTypes.ENUM(
      "Passable",
      "Assez bien",
      "Bien",
      "Très bien",
      "Excellent"
    ),
  },
  validation: { type: DataTypes.BOOLEAN, defaultValue: true }, // Par défaut validé
  rapport_corrections: { type: DataTypes.STRING }, // Chemin du PDF de corrections
  commentaires: { type: DataTypes.TEXT }, // Commentaires du jury
  statut_finalisation: {
    type: DataTypes.ENUM(
      "en attente",
      "valide_definitivement",
      "refuse_corrections",
      "en_attente_corrections"
    ),
    defaultValue: "en attente",
  }, // en attente, valide_definitivement, refuse_corrections, en_attente_corrections
});

module.exports = Finalisation;
