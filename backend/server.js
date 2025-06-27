const express = require("express");
const cors = require("cors");
const sequelize = require("./models");
const Admin = require("./models/admin");
const Etudiant = require("./models/etudiant");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const DemandeStage = require("./models/demandeStage");
const Soutenance = require("./models/soutenance");
const multer = require("multer");
const path = require("path");
const Finalisation = require("./models/finalisation");
const DemandeSoutenance = require("./models/demandeSoutenance");
const { Op } = require("sequelize");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // autorise seulement le frontend React
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Middleware de vérification du token
function authenticateToken(req, res, next) {
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ error: "Token manquant" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = user;
    next();
  });
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  // Vérifier admin
  const admin = await Admin.findOne({ where: { email, password } });
  if (admin) {
    const token = jwt.sign({ id: admin.id, type: "admin" }, JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ type: "admin", user: admin, token });
  }
  // Vérifier étudiant
  const etudiant = await Etudiant.findOne({ where: { email, password } });
  if (etudiant) {
    const token = jwt.sign({ id: etudiant.id, type: "etudiant" }, JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ type: "etudiant", user: etudiant, token });
  }
  // Sinon, erreur
  res.status(401).json({ error: "Email ou mot de passe incorrect" });
});

// Exemple de route protégée
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "Accès autorisé", user: req.user });
});

app.post("/api/etudiants", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const {
    ine,
    nom,
    prenom,
    email,
    specialite,
    niveau,
    telephone,
    password,
    status,
  } = req.body;
  try {
    const etudiant = await Etudiant.create({
      ine,
      nom,
      prenom,
      email,
      specialite,
      niveau,
      telephone,
      password,
      status,
    });
    res.json(etudiant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Liste des étudiants (admin seulement)
app.get("/api/etudiants", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const etudiants = await Etudiant.findAll();
  res.json(etudiants);
});

// Modification d'un étudiant (admin seulement, sauf mot de passe)
app.put("/api/etudiants/:id", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const { id } = req.params;
  const { ine, nom, prenom, email, specialite, telephone, status } = req.body;
  try {
    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant)
      return res.status(404).json({ error: "Étudiant non trouvé" });
    // On ne modifie pas le mot de passe ici
    await etudiant.update({
      ine,
      nom,
      prenom,
      email,
      specialite,
      telephone,
      status,
    });
    res.json(etudiant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Créer une demande de stage (étudiant)
app.post("/api/demandes", authenticateToken, async (req, res) => {
  if (req.user.type !== "etudiant")
    return res.status(403).json({ error: "Accès refusé" });
  try {
    const demande = await DemandeStage.create({
      ...req.body,
      etudiantId: req.user.id,
    });
    res.json(demande);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Liste des demandes (admin = toutes, étudiant = les siennes)
app.get("/api/demandes", authenticateToken, async (req, res) => {
  let demandes;
  if (req.user.type === "admin") {
    demandes = await DemandeStage.findAll();
  } else if (req.user.type === "etudiant") {
    demandes = await DemandeStage.findAll({
      where: { etudiantId: req.user.id },
    });
  } else {
    return res.status(403).json({ error: "Accès refusé" });
  }
  res.json(demandes);
});

// Détail d'une demande
app.get("/api/demandes/:id", authenticateToken, async (req, res) => {
  const demande = await DemandeStage.findByPk(req.params.id);
  if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
  // Étudiant ne peut voir que ses demandes
  if (req.user.type === "etudiant" && demande.etudiantId !== req.user.id)
    return res.status(403).json({ error: "Accès refusé" });
  res.json(demande);
});

// Valider une demande (admin)
app.put("/api/demandes/:id/valider", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const { tuteur_nom, tuteur_mail, tuteur_numero } = req.body;
  const demande = await DemandeStage.findByPk(req.params.id);
  if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
  await demande.update({
    statut: "valide",
    tuteur_nom,
    tuteur_mail,
    tuteur_numero,
    raison_refus: null,
  });
  res.json(demande);
});

// Refuser une demande (admin)
app.put("/api/demandes/:id/refuser", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const { raison_refus } = req.body;
  const demande = await DemandeStage.findByPk(req.params.id);
  if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
  await demande.update({
    statut: "refuse",
    raison_refus,
    tuteur_nom: null,
    tuteur_mail: null,
    tuteur_numero: null,
  });
  res.json(demande);
});

// Multer config : stockage dans uploads/, noms uniques, PDF only
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + ext;
    cb(null, name);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Seuls les fichiers PDF sont autorisés"));
};
const upload = multer({ storage, fileFilter });

// Créer une demande de soutenance (étudiant, upload 3 fichiers)
app.post(
  "/api/soutenances",
  authenticateToken,
  upload.fields([
    { name: "rapport", maxCount: 1 },
    { name: "accord_maitre", maxCount: 1 },
    { name: "accord_tuteur", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.type !== "etudiant")
      return res.status(403).json({ error: "Accès refusé" });
    try {
      const { theme } = req.body;
      const files = req.files;
      if (!files.rapport || !files.accord_maitre || !files.accord_tuteur) {
        return res.status(400).json({ error: "3 fichiers PDF requis" });
      }
      const soutenance = await Soutenance.create({
        etudiantId: req.user.id,
        theme,
        rapport: files.rapport[0].filename,
        accord_maitre: files.accord_maitre[0].filename,
        accord_tuteur: files.accord_tuteur[0].filename,
      });
      res.json(soutenance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Liste des soutenances (admin = toutes, étudiant = les siennes)
app.get("/api/soutenances", authenticateToken, async (req, res) => {
  let soutenances;
  if (req.user.type === "admin") {
    soutenances = await Soutenance.findAll();
  } else if (req.user.type === "etudiant") {
    soutenances = await Soutenance.findAll({
      where: { etudiantId: req.user.id },
    });
  } else {
    return res.status(403).json({ error: "Accès refusé" });
  }
  res.json(soutenances);
});

// Détail d'une soutenance
app.get("/api/soutenances/:id", authenticateToken, async (req, res) => {
  const soutenance = await Soutenance.findByPk(req.params.id);
  if (!soutenance)
    return res.status(404).json({ error: "Soutenance non trouvée" });
  if (req.user.type === "etudiant" && soutenance.etudiantId !== req.user.id)
    return res.status(403).json({ error: "Accès refusé" });
  res.json(soutenance);
});

// Télécharger un document PDF
app.get(
  "/api/soutenances/:id/download/:type",
  authenticateToken,
  async (req, res) => {
    const { id, type } = req.params;
    const soutenance = await Soutenance.findByPk(id);
    if (!soutenance)
      return res.status(404).json({ error: "Soutenance non trouvée" });
    if (req.user.type === "etudiant" && soutenance.etudiantId !== req.user.id)
      return res.status(403).json({ error: "Accès refusé" });
    let file;
    if (type === "rapport") file = soutenance.rapport;
    else if (type === "accord_maitre") file = soutenance.accord_maitre;
    else if (type === "accord_tuteur") file = soutenance.accord_tuteur;
    else return res.status(400).json({ error: "Type de document invalide" });
    const filePath = path.join(__dirname, "uploads", file);
    res.download(filePath);
  }
);

// Valider une soutenance (admin)
app.put("/api/soutenances/:id/valider", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const { rapporteur_nom, rapporteur_mail, rapporteur_numero } = req.body;
  const soutenance = await Soutenance.findByPk(req.params.id);
  if (!soutenance)
    return res.status(404).json({ error: "Soutenance non trouvée" });
  await soutenance.update({
    statut: "valide",
    raison_refus: null,
    rapporteur_nom,
    rapporteur_mail,
    rapporteur_numero,
  });
  res.json(soutenance);
});

// Refuser une soutenance (admin)
app.put("/api/soutenances/:id/refuser", authenticateToken, async (req, res) => {
  if (req.user.type !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
  const { raison_refus } = req.body;
  const soutenance = await Soutenance.findByPk(req.params.id);
  if (!soutenance)
    return res.status(404).json({ error: "Soutenance non trouvée" });
  await soutenance.update({ statut: "refuse", raison_refus });
  res.json(soutenance);
});

// Liste des thèmes validés pour l'étudiant connecté
app.get("/api/themes-valides", authenticateToken, async (req, res) => {
  if (req.user.type !== "etudiant")
    return res.status(403).json({ error: "Accès refusé" });
  const demandes = await DemandeStage.findAll({
    where: { etudiantId: req.user.id, statut: "valide" },
  });
  const themes = demandes.map((d) => d.theme);
  res.json(themes);
});

// Thèmes de soutenance validés pour l'étudiant (pour finalisation)
app.get(
  "/api/themes-soutenances-valides",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "etudiant")
      return res.status(403).json({ error: "Accès refusé" });
    const soutenances = await Soutenance.findAll({
      where: { etudiantId: req.user.id, statut: "valide" },
    });
    const themes = soutenances.map((s) => s.theme);
    res.json(themes);
  }
);

// Thèmes de finalisation validés pour l'étudiant (pour demande de soutenance)
app.get(
  "/api/themes-finalises-valides",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "etudiant")
      return res.status(403).json({ error: "Accès refusé" });
    const finals = await Finalisation.findAll({
      where: { etudiantId: req.user.id, statut: "valide" },
    });
    // Exclure ceux déjà demandés
    const demandes = await DemandeSoutenance.findAll({
      where: { etudiantId: req.user.id },
    });
    const dejaDemandes = demandes.map((d) => d.finalisationId);
    const finalsFiltrees = finals.filter((f) => !dejaDemandes.includes(f.id));
    res.json(finalsFiltrees.map((f) => ({ id: f.id, theme: f.theme })));
  }
);

// Créer une finalisation (étudiant, upload 2 fichiers)
app.post(
  "/api/finalisations",
  authenticateToken,
  upload.fields([
    { name: "rapport_final", maxCount: 1 },
    { name: "accord_rapporteur", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.type !== "etudiant")
      return res.status(403).json({ error: "Accès refusé" });
    try {
      const { theme } = req.body;
      const files = req.files;
      if (!files.rapport_final || !files.accord_rapporteur) {
        return res.status(400).json({ error: "2 fichiers PDF requis" });
      }
      const finalisation = await Finalisation.create({
        etudiantId: req.user.id,
        theme,
        rapport_final: files.rapport_final[0].filename,
        accord_rapporteur: files.accord_rapporteur[0].filename,
      });
      res.json(finalisation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Liste des finalisations (admin = toutes, étudiant = les siennes)
app.get("/api/finalisations", authenticateToken, async (req, res) => {
  let finalisations;
  if (req.user.type === "admin") {
    finalisations = await Finalisation.findAll();
  } else if (req.user.type === "etudiant") {
    finalisations = await Finalisation.findAll({
      where: { etudiantId: req.user.id },
    });
  } else {
    return res.status(403).json({ error: "Accès refusé" });
  }
  res.json(finalisations);
});

// Détail d'une finalisation
app.get("/api/finalisations/:id", authenticateToken, async (req, res) => {
  const finalisation = await Finalisation.findByPk(req.params.id);
  if (!finalisation)
    return res.status(404).json({ error: "Finalisation non trouvée" });
  if (req.user.type === "etudiant" && finalisation.etudiantId !== req.user.id)
    return res.status(403).json({ error: "Accès refusé" });
  res.json(finalisation);
});

// Télécharger un document PDF de finalisation
app.get(
  "/api/finalisations/:id/download/:type",
  authenticateToken,
  async (req, res) => {
    const { id, type } = req.params;
    const finalisation = await Finalisation.findByPk(id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });
    if (req.user.type === "etudiant" && finalisation.etudiantId !== req.user.id)
      return res.status(403).json({ error: "Accès refusé" });
    let file;
    if (type === "rapport_final") file = finalisation.rapport_final;
    else if (type === "accord_rapporteur")
      file = finalisation.accord_rapporteur;
    else return res.status(400).json({ error: "Type de document invalide" });
    const filePath = path.join(__dirname, "uploads", file);
    res.download(filePath);
  }
);

// Valider une finalisation (admin)
app.put(
  "/api/finalisations/:id/valider",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });
    const finalisation = await Finalisation.findByPk(req.params.id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });
    await finalisation.update({ statut: "valide", raison_refus: null });
    res.json(finalisation);
  }
);

// Refuser une finalisation (admin)
app.put(
  "/api/finalisations/:id/refuser",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });
    const { raison_refus } = req.body;
    const finalisation = await Finalisation.findByPk(req.params.id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });
    await finalisation.update({ statut: "refuse", raison_refus });
    res.json(finalisation);
  }
);

// Finaliser un document après soutenance (admin)
app.put(
  "/api/finalisations/:id/finaliser",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });

    const { note, mention, validation, commentaires, statut_finalisation } =
      req.body;
    const finalisation = await Finalisation.findByPk(req.params.id);

    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });

    // Validation des données
    if (note && (note < 0 || note > 20)) {
      return res.status(400).json({ error: "La note doit être entre 0 et 20" });
    }

    if (
      mention &&
      !["Passable", "Assez bien", "Bien", "Très bien", "Excellent"].includes(
        mention
      )
    ) {
      return res.status(400).json({ error: "Mention invalide" });
    }

    try {
      await finalisation.update({
        note,
        mention,
        validation: validation !== undefined ? validation : true,
        commentaires,
        statut_finalisation: statut_finalisation || "valide_definitivement",
      });

      res.json(finalisation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Upload du rapport de corrections (PDF)
app.post(
  "/api/finalisations/:id/upload-corrections",
  authenticateToken,
  upload.single("rapport_corrections"),
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });

    const finalisation = await Finalisation.findByPk(req.params.id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });

    if (!req.file) return res.status(400).json({ error: "Fichier PDF requis" });

    try {
      await finalisation.update({
        rapport_corrections: req.file.filename,
      });

      res.json({ message: "Rapport de corrections uploadé avec succès" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Télécharger le rapport de corrections
app.get(
  "/api/finalisations/:id/download-corrections",
  authenticateToken,
  async (req, res) => {
    const finalisation = await Finalisation.findByPk(req.params.id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });

    if (req.user.type === "etudiant" && finalisation.etudiantId !== req.user.id)
      return res.status(403).json({ error: "Accès refusé" });

    if (!finalisation.rapport_corrections) {
      return res
        .status(404)
        .json({ error: "Aucun rapport de corrections disponible" });
    }

    const filePath = path.join(
      __dirname,
      "uploads",
      finalisation.rapport_corrections
    );
    res.download(filePath);
  }
);

// Liste des finalisations en attente de finalisation (admin)
app.get(
  "/api/finalisations-en-attente",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });

    const finalisations = await Finalisation.findAll({
      where: {
        statut: "valide", // Seulement les finalisations déjà validées
        statut_finalisation: {
          [Op.or]: ["en attente", "en_attente_corrections"], // En attente de finalisation OU resoumis après corrections
        },
      },
      order: [["id", "ASC"]],
    });

    res.json(finalisations);
  }
);

// Créer une demande de passage en soutenance (étudiant)
app.post("/api/demande-soutenance", authenticateToken, async (req, res) => {
  if (req.user.type !== "etudiant")
    return res.status(403).json({ error: "Accès refusé" });
  const { finalisationId } = req.body;
  // Vérifier que la finalisation est bien à l'étudiant et validée
  const final = await Finalisation.findOne({
    where: { id: finalisationId, etudiantId: req.user.id, statut: "valide" },
  });
  if (!final) return res.status(400).json({ error: "Finalisation invalide" });
  // Vérifier qu'il n'y a pas déjà une demande pour cette finalisation
  const deja = await DemandeSoutenance.findOne({ where: { finalisationId } });
  if (deja)
    return res
      .status(400)
      .json({ error: "Demande déjà effectuée pour ce dossier" });
  const demande = await DemandeSoutenance.create({
    etudiantId: req.user.id,
    finalisationId,
  });
  res.json(demande);
});

// Liste des demandes de passage en soutenance
app.get("/api/demande-soutenance", authenticateToken, async (req, res) => {
  let demandes;
  if (req.user.type === "admin") {
    demandes = await DemandeSoutenance.findAll({
      order: [
        ["ordre", "ASC"],
        ["id", "ASC"],
      ],
    });
  } else if (req.user.type === "etudiant") {
    demandes = await DemandeSoutenance.findAll({
      where: { etudiantId: req.user.id },
      order: [["id", "ASC"]],
    });
  } else {
    return res.status(403).json({ error: "Accès refusé" });
  }
  res.json(demandes);
});

// Détail d'une demande de passage en soutenance
app.get("/api/demande-soutenance/:id", authenticateToken, async (req, res) => {
  const demande = await DemandeSoutenance.findByPk(req.params.id);
  if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
  if (req.user.type === "etudiant" && demande.etudiantId !== req.user.id)
    return res.status(403).json({ error: "Accès refusé" });
  res.json(demande);
});

// Valider une demande de passage en soutenance (admin)
app.put(
  "/api/demande-soutenance/:id/valider",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });
    let { date, heure, salle, president_jury, tuteur, maitre_stage } = req.body;
    const demande = await DemandeSoutenance.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
    // Si tuteur ou maitre_stage non fournis, on va chercher la dernière demande de stage validée
    if (!tuteur || !maitre_stage) {
      const lastStage = await DemandeStage.findOne({
        where: { etudiantId: demande.etudiantId, statut: "valide" },
        order: [["id", "DESC"]],
      });
      if (lastStage) {
        if (!tuteur) {
          tuteur = `${lastStage.tuteur_nom || ""} (${
            lastStage.tuteur_mail || ""
          }, ${lastStage.tuteur_numero || ""})`;
        }
        if (!maitre_stage) {
          maitre_stage = `${lastStage.maitre_nom || ""} (${
            lastStage.maitre_mail || ""
          }, ${lastStage.maitre_numero || ""})`;
        }
      }
    }
    // Calcul de l'ordre (dernier ordre + 1)
    const maxOrdre = (await DemandeSoutenance.max("ordre")) || 0;
    await demande.update({
      statut: "valide",
      ordre: maxOrdre + 1,
      date,
      heure,
      salle,
      president_jury,
      tuteur,
      maitre_stage,
    });
    res.json(demande);
  }
);

// Ignorer une demande (admin)
app.put(
  "/api/demande-soutenance/:id/ignorer",
  authenticateToken,
  async (req, res) => {
    if (req.user.type !== "admin")
      return res.status(403).json({ error: "Accès refusé" });
    const demande = await DemandeSoutenance.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ error: "Demande non trouvée" });
    await demande.update({ statut: "ignore" });
    res.json(demande);
  }
);

// Resoumettre des documents après corrections (étudiant)
app.put(
  "/api/finalisations/:id/resoumettre",
  authenticateToken,
  upload.fields([
    { name: "rapport_final", maxCount: 1 },
    { name: "accord_rapporteur", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.type !== "etudiant")
      return res.status(403).json({ error: "Accès refusé" });

    const finalisation = await Finalisation.findByPk(req.params.id);
    if (!finalisation)
      return res.status(404).json({ error: "Finalisation non trouvée" });

    if (finalisation.etudiantId !== req.user.id)
      return res.status(403).json({ error: "Accès refusé" });

    if (finalisation.statut_finalisation !== "refuse_corrections")
      return res
        .status(400)
        .json({ error: "Cette finalisation ne peut pas être resoumise" });

    try {
      const updates = {};

      if (req.files.rapport_final) {
        updates.rapport_final = req.files.rapport_final[0].filename;
      }

      if (req.files.accord_rapporteur) {
        updates.accord_rapporteur = req.files.accord_rapporteur[0].filename;
      }

      // Remettre en attente de validation
      updates.statut_finalisation = "en_attente_corrections";

      await finalisation.update(updates);

      res.json({ message: "Documents resoumis avec succès" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});
