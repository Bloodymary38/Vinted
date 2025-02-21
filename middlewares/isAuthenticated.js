const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // Cette route est réservée aux user authentifiés
  // ils vont envoyer leurs token, je dois vérifier si le token reçu est valide

  try {
    const currentUser = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });

    // Si j'ai reçu le bon token ===> authorized
    if (currentUser) {
      req.user = currentUser;
      // Je passe au middleware suivant
      console.log("      authent ok     ");
      next();
    } else {
      console.log("      authent ko     ");
      return res.status(401).json({ message: "Erreur d'authentification" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
