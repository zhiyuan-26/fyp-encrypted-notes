import { use, useState } from 'react'
import { newSalt, decryptText, deriveKey, encryptText } from './crypto'

// One salt for this test session. (Later it gets saved with the user's account)
const salt = newSalt();

function App() {
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("My secret note");
  const [encrypted, setEncrypted] = useState(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleEncrypt() {
    setBusy(true);
    const start = performance.now();
    const key = await deriveKey(password, salt);
    const time = Math.round(performance.now() - start);
    setEncrypted(await encryptText(key, note));
    setResult(`Encrypted. Deriving the key took ${time} ms.`);
    setBusy(false);
  }

  async function handleDecrypt() {
    setBusy(true);
    try {
      const key = await deriveKey(password, salt);
      setResult("Decrypted: " + (await decryptText(key, encrypted)));
    } catch {
      setResult("Could not decrypt. Wrong password?")
    }
    setBusy(false);
  }
  
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif "}}>
      <h1>Encryption spike</h1>

      <label>Password</label>
      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 12 }}/>

      <label>Note</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} 
        style={{ display: 'block', width: '100%', marginBottom: 12}}/>

      <button onClick={handleEncrypt} disabled={busy || !password}>Encrypt</button>{" "}
      <button onClick={handleDecrypt} disabled={busy || !encrypted}>Decrypt</button>

      {encrypted && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#eee', padding: 12}}>
          {JSON.stringify(encrypted, null, 2)}
        </pre>
      )}
      <p>{busy ? "Working..." : result}</p>
    </main>
  );
}

export default App