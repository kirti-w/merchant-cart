import mongoose from "mongoose";
import { dbURL } from "./credentials.js";
import { Product, Order, User, ORDER_STATUS } from "./models/index.js";

export const connection = await mongoose.connect(dbURL);

export const searchProducts = async ({
  searchTerm = "",
  minPrice = null,
  maxPrice = null,
}) => {
  console.log("\nSearch Products:", { searchTerm, minPrice, maxPrice });

  let query = {};

  // Search by name or description (if searchTerm exists)
  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Price filtering (if at least one price filter exists)
  if (minPrice !== null || maxPrice !== null) {
    query.price = {};

    if (minPrice !== null) {
      query.price.$gte = Number(minPrice);
    }

    if (maxPrice !== null) {
      query.price.$lte = Number(maxPrice);
    }
  }

  const result = await Product.find(query);

  return JSON.parse(JSON.stringify(result));
};

export const createProduct = async (data) => {
  return Product.create(data);
};

export const deleteProduct = async (id) => {
  return Product.findByIdAndDelete(id);
};

export const findProduct = async (id) => {
  return Product.findById(id).lean();
};

export const updateProduct = async (id, data) => {
  return Product.findByIdAndUpdate(id, data);
};

export const getUsers = async () => {
  return User.find({ role: "CUSTOMER" }).lean();
};

export const findUser = async (id) => {
  return User.findById(id).lean();
};

export const findOrdersByCustId = async (customerId) => {
  return Order.find({ customer: customerId })
    .populate("customer", "name _id")
    .populate({ path: "items.product", select: "name price" })
    .populate({ path: "items", select: "quantity priceAtPurchase" })
    .lean();
};

export const deleteOrder = async (id) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === ORDER_STATUS.COMPLETED) {
    throw new Error("Cannot delete an order that has been completed");
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantityInStock: item.quantity },
    });
  }

  await Order.findByIdAndDelete(id);
};

export const findOrderById = async (id) => {
  return Order.findById(id)
    .populate("customer", "name _id")
    .populate({ path: "items.product", select: "name price" })
    .populate({ path: "items", select: "quantity priceAtPurchase" })
    .lean();
};
