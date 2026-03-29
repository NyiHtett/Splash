import { useState, useEffect, useRef } from "react";
import { getApiKey, setApiKey, askGemini, getElKey, setElKey, speakEL } from "../shared/gemini";

export default function BobaAgent({ visible, noteContent, onClose }) {
  const [apiKey, setKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [elKey, setElState] = useState("");
  const [elInput, setElInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const chatRef = useRef(null);
  const recogRef = useRef(null);

  // Load saved API keys
  useEffect(() => {
    if (!visible) return;
    Promise.all([getApiKey(), getElKey()]).then(([gk, ek]) => {
      if (gk) { setKey(gk); setKeyInput(gk); }
      if (ek) { setElState(ek); setElInput(ek); }
      // Show setup if Gemini key missing
      if (gk) setKeyReady(true);
    });
  }, [visible]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function saveKeys() {
    const k = keyInput.trim();
    if (!k) return;
    const el = elInput.trim();
    Promise.all([
      setApiKey(k),
      el ? setElKey(el) : Promise.resolve(),
    ]).then(() => {
      setKey(k);
      if (el) setElState(el);
      setKeyReady(true);
    });
  }

  async function send(text) {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await askGemini(apiKey, noteContent, q);
      setMessages((m) => [...m, { role: "agent", text: answer }]);
      if (voiceOn) speak(answer);
    } catch (err) {
      setMessages((m) => [...m, { role: "agent", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function speak(text) {
    if (elKey) {
      speakEL(elKey, text).catch(() => {
        // fallback to browser voice
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05; u.pitch = 1.1;
        speechSynthesis.speak(u);
      });
    } else {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05; u.pitch = 1.1;
      speechSynthesis.speak(u);
    }
  }

  function toggleMic() {
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      send(transcript);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  }

  if (!visible) return null;

  const s = {
    panel: {
      border: "3px solid var(--line)",
      borderRadius: 16,
      boxShadow: "var(--shadow)",
      background: "var(--sheet)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: 420,
      marginBottom: 16,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 14px",
      background: "var(--accent)",
      color: "#fff",
      fontFamily: '"Fredoka", sans-serif',
      fontWeight: 600,
      fontSize: 14,
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "#fff",
      fontSize: 18,
      cursor: "pointer",
      fontWeight: 700,
    },
    chat: {
      flex: 1,
      overflowY: "auto",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    userMsg: {
      alignSelf: "flex-end",
      background: "var(--accent)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "14px 14px 4px 14px",
      maxWidth: "80%",
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    agentMsg: {
      alignSelf: "flex-start",
      background: "var(--split-btn-bg)",
      color: "var(--ink)",
      padding: "8px 12px",
      borderRadius: "14px 14px 14px 4px",
      maxWidth: "85%",
      fontSize: 13,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
    },
    inputArea: {
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "10px 12px",
      borderTop: "3px solid var(--line)",
      background: "var(--sheet)",
    },
    inputRow: {
      display: "flex",
      alignItems: "center",
      flex: 1,
      border: "3px solid var(--line)",
      borderRadius: 14,
      background: "var(--sheet)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    },
    textInput: {
      flex: 1,
      border: "none",
      padding: "10px 12px",
      fontSize: 13,
      fontFamily: '"Nunito", sans-serif',
      fontWeight: 700,
      background: "transparent",
      color: "var(--ink)",
      outline: "none",
      minWidth: 0,
    },
    chipBtn: {
      padding: "6px 10px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontFamily: '"Fredoka", sans-serif',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      color: "var(--muted)",
      borderLeft: "2px solid var(--line)",
      display: "flex",
      alignItems: "center",
      gap: 4,
      whiteSpace: "nowrap",
      transition: "background 0.15s, color 0.15s",
    },
    sendBtn: {
      padding: "6px 14px",
      border: "none",
      background: "var(--accent)",
      cursor: "pointer",
      fontFamily: '"Fredoka", sans-serif',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      color: "#fff",
      borderLeft: "3px solid var(--line)",
      display: "flex",
      alignItems: "center",
      gap: 4,
      whiteSpace: "nowrap",
    },
    iconBtn: {
      width: "auto",
      height: "auto",
      border: "none",
      borderRadius: 0,
      cursor: "pointer",
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
    },
    setup: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 20,
    },
  };

  // Setup screen
  if (!keyReady) {
    return (
      <div style={s.panel}>
        <div style={s.header}>
          <span>Boba Agent</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.setup}>
          <p style={{ margin: 0, fontFamily: '"Fredoka", sans-serif', fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
            Gemini API key
          </p>
          <input
            type="password"
            placeholder="AIza..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            style={{ ...s.textInput, width: "100%", maxWidth: 260, border: "2px solid var(--line)", borderRadius: 10, padding: "8px 10px" }}
          />
          <p style={{ margin: 0, fontFamily: '"Fredoka", sans-serif', fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>
            ElevenLabs key <span style={{ fontSize: 10, opacity: 0.7 }}>(optional, for voice)</span>
          </p>
          <input
            type="password"
            placeholder="sk_..."
            value={elInput}
            onChange={(e) => setElInput(e.target.value)}
            style={{ ...s.textInput, width: "100%", maxWidth: 260, border: "2px solid var(--line)", borderRadius: 10, padding: "8px 10px" }}
          />
          <button
            onClick={saveKeys}
            style={{ ...s.iconBtn, width: "auto", padding: "8px 20px", background: "var(--accent)", color: "#fff", border: "2px solid var(--line)" }}
          >
            Save
          </button>
          <p style={{ margin: 0, fontSize: 10, color: "var(--muted)", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
            <span style={{ color: "var(--accent)" }}>ai.google.dev</span> &middot; <span style={{ color: "var(--accent)" }}>elevenlabs.io</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span>Boba Agent</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{ ...s.closeBtn, fontSize: 12, opacity: 0.7 }} onClick={() => setKeyReady(false)}>keys</button>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </span>
      </div>
      <div ref={chatRef} style={s.chat}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, fontStyle: "italic", textAlign: "center", margin: "auto 0" }}>
            Ask me anything about your notes!
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? s.userMsg : s.agentMsg}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ ...s.agentMsg, opacity: 0.6 }}>thinking...</div>
        )}
      </div>
      <div style={s.inputArea}>
        <div style={s.inputRow}>
          <input
            style={s.textInput}
            placeholder="Ask about your notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={toggleMic}
            style={{
              ...s.chipBtn,
              background: listening ? "#E85D75" : "transparent",
              color: listening ? "#fff" : "var(--muted)",
              animation: listening ? "mic-pulse 1s ease-in-out infinite" : "none",
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>&#9679;</span>
            {listening ? "listening" : "voice"}
          </button>
          <button
            onClick={() => setVoiceOn((v) => !v)}
            style={{
              ...s.chipBtn,
              color: voiceOn ? "var(--accent)" : "var(--muted)",
            }}
          >
            {voiceOn ? "sound on" : "muted"}
          </button>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              ...s.sendBtn,
              opacity: (loading || !input.trim()) ? 0.4 : 1,
            }}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}
