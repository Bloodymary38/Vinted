const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: {
    type: String,
    maxLength: [50, "Doit faire moins de 50 caractères"],
  },
  product_description: {
    type: String,
    maxLength: [500, "Doit faire moins de 500 caractères"],
  },
  product_price: {
    type: Number,
    max: [100000, "Le prix ne peut être supérieur à 100 000"],
  },
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
