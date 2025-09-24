const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve your index.html, script.js, styles.css from same folder

// MongoDB Config
const MONGODB_URI =
  "mongodb://mongo:XroGFzyPhUHYCaEIdsBOPudZPeLKwRIy@turntable.proxy.rlwy.net:33848";
const DB_NAME = "test";

let client;
let database;

// MongoDB Connection
async function connectToMongoDB() {
  if (!client) {
    console.log("🔗 Connecting to Railway MongoDB...");
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to Railway MongoDB successfully");
    database = client.db(DB_NAME);
  }
  return database;
}

// API: Test connection
app.get("/api/test-connection", async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const collections = await db.listCollections().toArray();
    res.json({
      success: true,
      message: `Connected to Railway MongoDB. Found ${collections.length} collections.`,
      collections: collections.map((c) => c.name),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Fetch data
app.post("/api/mongodb-data", async (req, res) => {
  try {
    const { action, collection, filter, options } = req.body;

    if (action !== "find") {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const db = await connectToMongoDB();
    const collectionObj = db.collection(collection || "asd");

    console.log(`📥 Loading documents from collection: ${collection || "asd"}`);

    let cursor = collectionObj.find(filter || {});
    if (options) {
      if (options.sort) cursor = cursor.sort(options.sort);
      if (options.limit) cursor = cursor.limit(options.limit);
      if (options.skip) cursor = cursor.skip(options.skip);
    }

    const data = await cursor.toArray();
    const count = await collectionObj.estimatedDocumentCount();

    res.json({
      success: true,
      data,
      count: data.length,
      stats: {
        count,
        size: count * 200, // fake size estimate so your UI doesn't break
        avgObjSize: count > 0 ? Math.round((count * 200) / count) : 0,
      },
    });
  } catch (error) {
    console.error("❌ Error loading data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Insert sample data
app.get("/api/insert-sample", async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const result = await db.collection("asd").insertMany([
      { name: "Gold Price", value: 36.599 },
      { name: "Silver Price", value: 0.295 },
      { name: "Test Data", value: "Sample entry" },
    ]);

    res.json({ success: true, inserted: result.insertedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
