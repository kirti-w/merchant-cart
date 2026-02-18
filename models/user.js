import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Fill in the code
const userSchema = new Schema({
  _id: String,
  name: String,
  email: String,
  passwordHash: String,
  role: String, // "ADMIN" or "CUSTOMER"
  createdAt: Date,
  orders: [
    {
      type: Schema.Types.String,
      ref: "Order",
    },
  ],
});

export const User = mongoose.model("User", userSchema);
