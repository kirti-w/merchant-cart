import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ORDER_STATUS = {
  PLACED: "PLACED",
  SHIPPED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const orderSchema = new Schema(
  {
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
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
);

// Auto-calculate before save
orderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (total, item) => total + item.quantity * item.priceAtPurchase,
    0,
  );
  next();
});

export const Order = mongoose.model("Order", orderSchema);
export { ORDER_STATUS };
