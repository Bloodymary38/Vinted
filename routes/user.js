const express = require("express");
const router = express.Router();
const User = require("../models/User");

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

////////////////////            SIGNUP
router.post("/user/signup", async (req, res) => {
  console.clear();

  console.log("/user/signup");

  try {
    // test si param vide
    if (!req.body.username || !req.body.password || !req.body.email) {
      return res.status(400).json({ message: "Paramètre manquant" });
    }

    // test si user deja existant en BDD par email
    let newUser = await User.findOne({ email: req.body.email });
    if (newUser) {
      // mail deja present en BDD
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }

    // creation nouveau user
    const salt = uid2(16);
    const token = uid2(64);
    const passwordSalt = req.body.password + salt;
    const hash = SHA256(passwordSalt).toString(encBase64);

    newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: req.body.avatar ? req.body.avatar : null,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();

    return res.status(201).json({
      _id: newUser.id,
      token: newUser.token,
      account: { username: newUser.account.username },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

////////////////////            LOGIN

router.post("/user/login", async (req, res) => {
  console.log("/user/login");
  console.clear();

  try {
    const currentUser = await User.findOne({ email: req.body.email });
    const temp = "Accès non autorisé";

    if (!currentUser) {
      return res.status(401).json({
        message: temp,
      });
    } else {
      // on a une entree en BDD qui match
      // on compare le hash en bdd avec celui construit avec le pwd passe en param dans la requete de login
      const hash2 = SHA256(req.body.password + currentUser.salt).toString(
        encBase64
      );

      if (hash2 === currentUser.hash) {
        // TODO
        return res.status(200).json({
          _id: currentUser.id,
          token: currentUser.token,
          account: { username: currentUser.account.username },
        });
      } else {
        return res.status(401).json({
          message: temp,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
