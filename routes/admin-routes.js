import express from "express";
import * as cartDB from "../cartModule.js";

import { Order, Product } from "../models/index.js";

const router = express.Router();
const isAdmin = true;

router.get("/products", async (req, res) => {
  try {
    const { search, minPrice, maxPrice } = req.query;

    const products = await cartDB.searchProducts({
      searchTerm: search || "",
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      isadmin: true,
    });

    res.render("admin/manageProductsView", {
      products,
      searchQuery: search,
      minPrice,
      maxPrice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading products");
  }
});

// Show add product form
router.get("/products/new", async function (req, res) {
  res.render("admin/addProductView");
});

// Create product
router.post("/products", async function (req, res) {
  const { _id, name, description, price, quantityInStock } = req.body;

  await cartDB.createProduct({
    _id,
    name,
    description,
    price,
    quantityInStock,
  });

  res.redirect("/admin/products");
});

// Delete product
router.post("/products/delete/:id", async function (req, res) {
  let id = req.params.id;
  await cartDB.deleteProduct(id);
  res.redirect("/admin/products");
});

// Show edit form
router.get("/products/edit/:id", async function (req, res) {
  const product = await cartDB.findProduct(req.params.id);
  res.render("admin/editProductView", { product: product });
});

// Update product
router.post("/products/:id", async function (req, res) {
  const { name, description, price, quantityInStock } = req.body;

  await cartDB.updateProduct(req.params.id, {
    name,
    description,
    price,
    quantityInStock,
  });

  res.redirect("/admin/products");
});

// Show all customers
router.get("/customers", async (req, res) => {
  const customers = await cartDB.getUsers();
  res.render("admin/manageCustomersView", { customers });
});

// Show customer orders
router.get("/customers/:id/orders", async (req, res) => {
  const customer = await cartDB.findUser(req.params.id);

  const orders = await cartDB.findOrdersByCustId(req.params.id);

  res.render("admin/customerOrdersView", {
    customer,
    orders,
    error: req.query.error,
  });
});

// Get request : Edit order
router.get("/orders/:id/edit", async (req, res) => {
  const order = await cartDB.findOrderById(req.params.id);

  res.render("admin/editOrderView", { order });
});

router.put("/orders/:orderId/items/:productId", async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { newQuantity, oldQuantity } = req.body;

    const order = await Order.findById(orderId);
    const product = await Product.findById(productId);

    if (!order || !product) {
      return res.status(404).json({ message: "Order or Product not found" });
    }

    const item = order.items.find((i) => i.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    const difference = newQuantity - oldQuantity;

    // Adjust stock
    if (difference > 0 && product.quantityInStock < difference) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    product.quantityInStock -= difference;
    await product.save();

    item.quantity = newQuantity;
    await order.save();

    res.json({ message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/orders/:orderId/items/:productId", async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { quantity } = req.body;

    const order = await Order.findById(orderId);
    const product = await Product.findById(productId);

    if (!order || !product) {
      return res.status(404).json({ message: "Order or Product not found" });
    }

    // Restore stock
    product.quantityInStock += quantity;
    await product.save();

    order.items = order.items.filter((i) => i.product.toString() !== productId);

    await order.save();

    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        product.quantityInStock += item.quantity;
        await product.save();
      }
    }

    order.status = status;
    await order.save();

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.post("/orders/:id/delete", async (req, res) => {
  //const order = await cartDB.getOrderById(req.params.id);

  try {
    await cartDB.deleteOrder(req.params.id);
    res.redirect(req.get("Referrer") || "/");
  } catch (error) {
    console.error(error);

    res.status(500).send("Something went wrong.");
  }
});

export { router };
