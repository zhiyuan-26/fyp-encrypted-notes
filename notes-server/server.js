// npm run dev

// await fetch("/api/notes/test-1", {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ iv: "abc", ciphertext: "xyz", updatedAt: 1 })
// }).then(r => r.json())

// await fetch("/api/meta", {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ salt: "FIRST", verifier: { iv: "a", ciphertext: "b" } })
// }).then(r => r.json())

import express from "express";
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017");
await client.connect();
const db = client.db("notes_spike");
const meta = db.collection("meta");
const notes = db.collection("notes");
console.log("Connected to MongoDB");

const app = express();
app.use(express.json());

app.get("/api/notes", async (req, res) => {
    const all = await notes.find({}, { projection: { _id: 0 } }).toArray();
    res.json(all);
});

app.put("/api/notes/:id", async (req, res) => {
    const { iv, ciphertext, updatedAt } = req.body;
    if (typeof iv !== "string" || typeof ciphertext !== "string" || typeof updatedAt !== "number") {
        return res.status(400).json({ error: "Invalid note" });
    }

    await notes.updateOne(
        { id: req.params.id },
        { $set: { id: req.params.id, iv, ciphertext, updatedAt } },
        { upsert: true }
    );
    res.json({ ok: true });
});

app.get("/api/meta", async (req, res) => {
    const account = await meta.findOne({ _id: "account" }, { projection: { _id: 0 } });
    res.json(account);
});

app.put("/api/meta", async (req, res) => {
    const { salt, verifier } = req.body;
    if (typeof salt !== "string" || !verifier) {
        return res.status(400).json({ error: "Invalid meta" });
    }

    await meta.updateOne(
        { _id: "account" },
        { $setOnInsert: { salt, verifier } },
        { upsert: true }
    );
    res.json({ ok: true });
});

app.listen(3001, () => console.log("API running on http://localhost:3001"))