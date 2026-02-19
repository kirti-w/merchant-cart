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
