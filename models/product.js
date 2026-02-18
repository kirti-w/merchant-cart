import mongoose from "mongoose";
const Schema = mongoose.Schema;

const productSchema = new Schema({
  _id: String,
  name: String,
  description: String,
  price: Number,
  quantityInStock: Number,
  isActive: {
    type: Boolean,
    default: true,
  },
});

export const Product = mongoose.model("Product", productSchema);
