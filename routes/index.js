import express from "express";

const router = express.Router();
// Use the cart module
import * as cartDB from "../cartModule.js";
import * as userModule from "../userModule.js";
import { Order, User } from "../models/index.js";
import passport from "passport";
import { ensureAuthenticated, ensureAuthorized } from "../middleware/auth.js";

router.get("/login", function (req, res) {
  res.render("login", {
    user: req.user,
    messages: req.session.messages,
  });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.render("login", {
        messages: info?.message || "Invalid username or password.",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      if (user.role === "admin") {
        return res.redirect("/admin/products");
      } else {
        return res.redirect("/products");
      }
    });
  })(req, res, next);
});

// GET request to the homepage
router.get("/", function (req, res) {
  res.render("homeView", { user: req.user });
});

router.get("/logout", ensureAuthenticated, (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.session.destroy(() => {
      res.redirect("/logged-out");
    });
  });
});

router.get("/logged-out", (req, res) => {
  res.render("logOutView");
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

router.get(
  "/cart",
  ensureAuthenticated,
  ensureAuthorized("customer"),
  async (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
      return res.render("cartView", { cart: [], total: 0 });
    }

    let updatedCart = [];
    let total = 0;

    for (const item of cart) {
      const product = await cartDB.findProduct(item.productId);

      // Skip deleted products
      if (!product) continue;

      // If stock changed, adjust quantity
      const quantity = Math.min(item.quantity, product.quantityInStock);

      var itemTotal = product.price * quantity;
      itemTotal = parseFloat(itemTotal.toFixed(2)); // Round to 2 decimals
      total += itemTotal;

      updatedCart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        quantityInStock: product.quantityInStock,
        itemTotal,
      });
    }

    // Update session cart to reflect any adjustments
    req.session.cart = updatedCart;

    total = parseFloat(total.toFixed(2)); // Round total to 2 decimals

    res.render("cartView", {
      cart: updatedCart,
      total,
    });
  },
);

router.post(
  "/cart/add/:id",
  ensureAuthenticated,
  ensureAuthorized("customer"),
  async (req, res) => {
    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity);

    const product = await cartDB.findProduct(productId);

    if (!product) {
      return res.redirect("/products");
    }

    // 🚫 Prevent adding more than available stock
    if (quantity > product.quantityInStock) {
      return res.send("Not enough stock available");
    }

    // Initialize cart in session if not exists

    const sessionCart = req.session.cart || [];

    // Check if item already in cart
    const existingItem = sessionCart.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      // Make sure combined quantity doesn’t exceed stock
      if (existingItem.quantity + quantity > product.quantityInStock) {
        return res.send("Cannot exceed available stock");
      }
      existingItem.quantity += quantity;
    } else {
      sessionCart.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    req.session.cart = sessionCart;

    res.redirect("/products");
  },
);

router.post(
  "/cart/update/:id",
  ensureAuthenticated,
  ensureAuthorized("customer"),
  async (req, res) => {
    const productId = req.params.id;
    const newQuantity = parseInt(req.body.quantity);

    const product = await cartDB.findProduct(productId);
    if (!product) return res.redirect("/cart");

    if (newQuantity > product.quantityInStock) {
      return res.send("Cannot exceed available stock");
    }

    let sessionCart = req.session.cart || [];

    const item = sessionCart.find((i) => i.productId.toString() === productId);

    if (item) {
      if (newQuantity <= 0) {
        // remove if quantity is 0
        sessionCart = sessionCart.filter(
          (i) => i.productId.toString() !== productId,
        );
      } else {
        item.quantity = newQuantity;
      }
    }

    req.session.cart = sessionCart;
    res.redirect("/cart");
  },
);

router.post(
  "/cart/delete/:id",
  ensureAuthenticated,
  ensureAuthorized("customer"),
  (req, res) => {
    const productId = req.params.id;

    let sessionCart = req.session.cart || [];

    sessionCart = sessionCart.filter(
      (item) => item.productId.toString() !== productId,
    );

    req.session.cart = sessionCart;

    res.redirect("/cart");
  },
);

router.post(
  "/checkout",
  ensureAuthenticated,
  ensureAuthorized("customer"),
  async (req, res) => {
    const cart = req.session.cart;

    if (!cart || cart.length === 0) {
      return res.redirect("/cart");
    }

    for (const item of cart) {
      const product = await cartDB.findProduct(item.productId);

      if (!product || product.quantityInStock < item.quantity) {
        return res.send(`Insufficient stock for ${item.name}`);
      }
    }

    for (const item of cart) {
      await cartDB.updateProductQuantity(item.productId, item.quantity);
    }

    //Map cart items to order items format
    const orderItems = cart.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }));

    await cartDB.createOrder({
      customer: req.user.id,
      items: orderItems,
      orderDate: new Date(),
      status: "PLACED",
    });

    // Clear cart
    req.session.cart = [];

    res.redirect("/orders");
  },
);
router.get("/orders", ensureAuthenticated, async (req, res) => {
  const orders = await cartDB.findOrdersByCustId(req.user.id);
  res.render("ordersView", { orders });
});

// Show register page
router.get("/register", (req, res) => {
  res.render("registerView");
});

// Handle registration
router.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Check if user already exists
    const existingUser = await userModule.findUser(username);
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const nextId = await userModule.getNextID();

    // Create new customer user
    const newUser = new User({
      _id: nextId.toString(),
      name,
      username,
      password,
      role: "customer",
    });

    await userModule.createUser(newUser);

    res.redirect("/login"); // or auto-login
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

export default router;

export { router };
