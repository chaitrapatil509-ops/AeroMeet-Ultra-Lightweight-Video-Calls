import { MongoClient } from "mongodb";

const uri = "mongodb://admin:admin123@ac-028gr3p-shard-00-00.qgn9nek.mongodb.net:27017,ac-028gr3p-shard-00-01.qgn9nek.mongodb.net:27017,ac-028gr3p-shard-00-02.qgn9nek.mongodb.net:27017/?ssl=true&replicaSet=atlas-dsv02p-shard-0&authSource=admin&appName=Cluster0";

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