// npm run dev -- --host
import { useState, useEffect } from 'react'
import { newSalt, deriveKey, decryptText, encryptText } from './crypto'
import { getMeta, setMeta, saveNote, getAllNotes } from './db';

function App() {
  const [key, setKey] = useState(null);
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMeta("salt").then((salt) => setIsNewUser(!salt));
  }, []);

  async function handleUnlock() {
    setBusy(true);
    setMessage("");
    try {
      // Get the salt or create one for a new user
      let salt = await getMeta("salt");
      if (!salt) {
        salt = newSalt();
        await setMeta("salt", salt);
      }

      // Derive the key
      const k = await deriveKey(password, salt);

      // Check the password with the verifier
      const verifier = await getMeta("verifier");
      if (!verifier) {
        await setMeta("verifier", await encryptText(k, "ok"));
      } else {
        try {
          await decryptText(k, verifier);
        } catch {
          setMessage("Wrong password.");
          return;
        }
      }

      // Load and decrypt all notes
      const stored = await getAllNotes();
      const decryted = await Promise.all(
        stored.map(async (n) => ({
          id: n.id, 
          updatedAt: n.updatedAt, 
          text: await decryptText(k, n) 
        }))
      );

      // Unlock
      setIsNewUser(false)
      setNotes(decryted);
      setKey(k);
      setPassword("");
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    const enc = await encryptText(key, draft);
    const note = { 
      id: crypto.randomUUID(), 
      updatedAt: Date.now(), 
      ...enc 
    };
    await saveNote(note);
    setNotes([...notes, { 
      id: note.id, 
      updatedAt: note.updatedAt, 
      text: draft 
    }]);
    setDraft("");
  }
  
  function handleLock() {
    setNotes([]);
    setKey(null);
  }

  // Locked screen
  if (!key) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif "}}>
        <h1>{isNewUser ? "Create a password" : "Unlock your notes"}</h1>
        <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />{" "}
        <button onClick={handleUnlock} disabled={busy || !password}>
          {isNewUser ? "Create" : "Unlock"}
        </button>
        <p>{busy ? "Working..." : message}</p>
      </main>
    );
  }
  
  // Unlock screen
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif "}}>
      <h1>My notes</h1>
      <button onClick={handleLock}>Lock</button>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>{n.text}</li>
        ))}
      </ul>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} style={{ width: "100%"}} />
      <button onClick={handleSave} disabled={!draft.trim()}>Save note</button>
    </main>
  );
}

export default App