import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ORDER_STATUS = {
  PLACED: "PLACED",
  SHIPPED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const orderSchema = new Schema({
  _id: String,
  customer: {
    type: Schema.Types.String,
    ref: "User",
  },
  items: [
    {
      product: {
        type: Schema.Types.String,
        ref: "Product",
        required: true,
      },
      quantity: Number,
      priceAtPurchase: Number,
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PLACED,
  },
});
export const Order = mongoose.model("Order", orderSchema);
export { ORDER_STATUS };
