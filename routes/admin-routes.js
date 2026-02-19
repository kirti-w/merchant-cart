import express from "express";
import * as cartDB from "../cartModule.js";

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

// Edit order
router.get("/orders/:id/edit", async (req, res) => {
  const order = await cartDB.findOrderById(req.params.id);

  res.render("admin/editOrderView", { order });
});

/*
router.post("/orders/:id/update-items", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.redirect("back");

    // 🚫 Prevent modification if fulfilled
    const nonEditableStatuses = [
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ];

    if (nonEditableStatuses.includes(order.status)) {
      return res.status(400).send("Order cannot be modified.");
    }

    // Example: updating quantities
    const updatedItems = req.body.items;
    // Expected structure:
    // items[0][quantity] = 3

    let newTotal = 0;

    for (let i = 0; i < order.items.length; i++) {
      const newQty = Number(updatedItems[i].quantity);

      // restore old stock first
      await Product.findByIdAndUpdate(order.items[i].product, {
        $inc: { quantityInStock: order.items[i].quantity },
      });

      // deduct new stock
      await Product.findByIdAndUpdate(order.items[i].product, {
        $inc: { quantityInStock: -newQty },
      });

      order.items[i].quantity = newQty;

      newTotal += newQty * order.items[i].priceAtPurchase;
    }

    order.totalAmount = newTotal;

    await order.save();

    res.redirect("back");
  } catch (error) {
    console.error(error);
    res.redirect("back");
  }
});*/

// Update order (example: status update)
router.post("/orders/:id", async (req, res) => {
  try {
    const order = await cartDB.findOrderById(req.params.id);

    if (order.status !== "PLACED") {
      return res.redirect(
        `/admin/customers/${order.customer}/orders?error=notAllowed`,
      );
    }

    const updatedItems = req.body.items;

    // Recalculate total
    let total = 0;

    updatedItems.forEach((item) => {
      total += item.priceAtPurchase * item.quantity;
    });

    await cartDB.updateOrder(req.params.id, {
      items: updatedItems,
      totalAmount: total,
      status: req.body.status,
    });

    res.redirect(`/admin/customers/${order.customer}/orders`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Update failed.");
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
