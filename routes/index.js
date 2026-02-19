import express from "express";

const router = express.Router();

// Use the cart module
import * as cartDB from "../cartModule.js";

// GET request to the homepage

router.get("/", function (req, res) {
  res.render("homeView", {
    user: req.user,
  });
});

router.get("/products", async function (req, res) {
  let searchQuery = req.query.search || "";
  let minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  let maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

  let result = await cartDB.searchProducts({
    searchTerm: searchQuery,
    minPrice,
    maxPrice,
    isadmin: false,
  });

  res.format({
    "application/json": function () {
      res.json({
        query: searchQuery,
        minPrice,
        maxPrice,
        products: result,
      });
    },
    "text/html": function () {
      res.render("products", {
        products: result,
        searchQuery,
        minPrice,
        maxPrice,
      });
    },
    default: function () {
      res.status(406).send("Not Acceptable");
    },
  });
});

router.post("/products", function (req, res) {
  const { search, minPrice, maxPrice } = req.body;

  res.redirect(
    `/products?search=${search || ""}&minPrice=${minPrice || ""}&maxPrice=${maxPrice || ""}`,
  );
});

export { router };
