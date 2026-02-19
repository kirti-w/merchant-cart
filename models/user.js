import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Fill in the code
const userSchema = new Schema({
  _id: String,
  name: String,
  username: String,
  password: String,
  role: String, // "ADMIN" or "CUSTOMER"
  orders: [
    {
      type: Schema.Types.String,
      ref: "Order",
    },
  ],
});

export const User = mongoose.model("User", userSchema);
