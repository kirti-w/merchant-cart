import fs from "node:fs";

import { MongoClient, ServerApiVersion } from "mongodb";

import { dbURL } from "./credentials.js";

const client = new MongoClient(dbURL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let result;

const json1Data = fs.readFileSync("data/users.json");
const userData = JSON.parse(json1Data);
console.log("Read", userData.length, "users");

const usersCollection = client.db("cart_kw").collection("users");
await usersCollection.deleteMany({});
result = await usersCollection.insertMany(userData);
console.log("Inserted Ids:", result.insertedIds);

const json2Data = fs.readFileSync("data/products.json");
const productData = JSON.parse(json2Data);
console.log("Read", productData.length, "products");

const productsCollection = client.db("cart_kw").collection("products");
await productsCollection.deleteMany({});
result = await productsCollection.insertMany(productData);
console.log("Inserted Ids:", result.insertedIds);

await client.close();
