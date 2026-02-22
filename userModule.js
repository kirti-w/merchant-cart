import mongoose from "mongoose";
import { dbURL } from "./credentials.js";
import { User } from "./models/index.js";

export const connection = await mongoose.connect(dbURL);

export async function findUser(name) {
  return User.findOne({ username: name }).lean();
}

export async function validateUser(name, password) {
  return User.findOne({ username: name, password: password }).lean();
}

export async function createUser(data) {
  return User.create(data);
}

export async function getNextID() {
  const lastUser = await User.findOne().sort({ _id: -1 }).lean();
  if (lastUser) {
    return parseInt(lastUser._id) + 1;
  }
  return 1;
}
