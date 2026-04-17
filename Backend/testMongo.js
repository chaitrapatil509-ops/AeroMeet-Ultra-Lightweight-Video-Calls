import { MongoClient } from "mongodb";

import "dotenv/config";
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.log("❌ Connection Error:", err);
  } finally {
    await client.close();
  }
}

run();