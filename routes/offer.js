const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const User = require("../models/User");
// Importe de mon middleware que j'ai délocalisé
const isAuthenticated = require("../middlewares/isAuthenticated");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

mongoose.connect("mongodb://localhost:27017/vinted");

// Déclaration de la fonction qui permet de transformer mes images en base 64
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

///

router.get("/offers", async (req, res) => {
  try {
    console.log("offers");

    // on recup tous les params de la query
    const page = parseInt(req.query.page) || 1; // Page par défaut = 1
    //const page = Number(req.query.page) || 1; // autre parse au choix
    const title = req.query.title || "";
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin) : 0;
    const priceMax = req.query.priceMax
      ? parseFloat(req.query.priceMax)
      : Infinity;
    //const sort = req.query.sort || "default"; // Tri par défaut

    // on construit le filtre
    let filters = {};

    // Filtre insensible à la casse
    //////////////////////   regex
    // const regEx = /Pantalon/i;
    // const toto = "hello";
    // const regtoto = new RegExp(toto, "i");
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    // Filtre par prix min et/ou max
    // gte / lte / gt / lt
    if (priceMin || priceMax) {
      filters.product_price = {};
      if (priceMin) filters.product_price.$gte = parseFloat(priceMin);
      if (priceMax) filters.product_price.$lte = parseFloat(priceMax);
    }

    // Gestion du tri
    // ASC = 1 = ascending => croissant
    // -1  = desc = descending => decroissant
    const sortOptions = {};
    if (req.query.sort === "price-desc") {
      sortOptions.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sortOptions.product_price = 1;
    }

    // gte / lte / gt / lt

    const skip = (page - 1) * 5;

    const offersLength = await Offer.countDocuments(filters); // ts les enregs du filtre

    // FIND
    const offers = await Offer.find(filters)
      .sort(sortOptions)
      .skip(skip) // on ignore les x premiers articles
      .limit(5) // on veut 5 par page
      //      .select("product_name product_price");
      .select()
      .populate("owner", "account"); // par defaut ca ajoute la cle id
    const objRetour = {
      offersCount: offersLength,
      offers: offers,
    };

    return res.status(200).json(objRetour);
  } catch (error) {
    return res.status(error.error || 500).json({ message: error.message });
  }
});

///

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log("/offer/publish");

      if (
        !req.body.title ||
        !req.body.description ||
        !req.body.price ||
        !req.body.condition ||
        !req.body.city ||
        !req.body.brand ||
        !req.body.size ||
        !req.body.color
      ) {
        throw { message: "Veuillez remplir tous les champs", error: 400 };
      }
      if (!req.files) {
        throw { message: "Veuillez ajouter une photo du produit", error: 400 };
      }

      //console.log("secure url : " + cloudinaryResponse);
      // ici l'image est stockee sur cloud +  rentrer l'offre en BDD

      ///////////////////////////////                            // Destructuring :
      //remplace  req.body.??? par des variables
      const { title, description, price } = req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        product_image: {
          //secure_url: cloudinaryResponse.secure_url,
          //name: req.files.picture.name,
        },
        owner: req.user,
      });

      const convertedPicture = convertToBase64(req.files.picture);

      //console.log(req.files);

      // Envoie de mon image sur Cloudinary
      const uniqueFileName = `image_${Date.now()}`; // Exemple : "image_1708234567890"

      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedPicture,
        {
          folder: `/vinted/offers`,
          public_id: uniqueFileName,
        }
      );

      newOffer.product_image = cloudinaryResponse;

      await newOffer.save();

      return res
        .status(201)
        .json(await newOffer.populate("owner", "account id"));

      //res.status(201).json(newOffer);
    } catch (error) {
      return res.status(error.error || 500).json({ message: error.message });
    }
  }
);

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    res.status(200).json(offer);
  } catch (error) {
    return res.status(error.error || 500).json({ message: error.message });
  }
});

module.exports = router;
