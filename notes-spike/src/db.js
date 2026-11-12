import { openDB } from "idb";

const dbPromise = openDB("notes-spike", 1, {
    upgrade(db) {
        db.createObjectStore("meta");
        db.createObjectStore("notes", { keyPath: "id" });
    }
});

export async function getMeta(name) {
    const db = await dbPromise;
    return db.get("meta", name)
}

export async function setMeta(name, value) {
    const db = await dbPromise;
    return db.put("meta", value, name);
}

export async function saveNote(note) {
    const db = await dbPromise;
    return db.put("notes", note);
}

export async function getAllNotes() {
    const db = await dbPromise;
    return db.getAll("notes");
}