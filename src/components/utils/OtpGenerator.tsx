import { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import CopyWithToast from "../CopyWithToast";

const ALGOS = [
    { key: 'sha1', label: 'SHA-1', badge: 'Standard', note: 'Default algorithm per RFC 6238. Compatible with most authenticator apps (Google Authenticator, Authy, etc.).' },
    { key: 'sha256', label: 'SHA-256', badge: 'Extended', note: 'Stronger hashing algorithm. Requires authenticator app support (e.g. FreeOTP).' },
    { key: 'sha512', label: 'SHA-512', badge: 'Strongest', note: 'Maximum strength hashing. Requires authenticator app support.' },
] as const;
type AlgoKey = typeof ALGOS[number]['key'];

const OTP_DIGITS = [
    { key: '6', label: '6', note: 'Standard 6-digit OTP. Compatible with most authenticator apps.' },
    { key: '7', label: '7', note: '7-digit OTP. Requires app support.' },
    { key: '8', label: '8', note: '8-digit OTP for higher security. Requires app support.' },
] as const;
type OtpDigitsKey = typeof OTP_DIGITS[number]['key'];

type SecretEntry = { name: string; key: string; timestamp: string; digits?: OtpDigitsKey; algorithm?: AlgoKey };

export const OtpGenerator = () => {
  const [otp, setOtp] = useState("");
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const [isSecretValid, setIsSecretValid] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showTableSecrets, setShowTableSecrets] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [digits, setDigits] = useState<OtpDigitsKey>('6');
  const [algorithm, setAlgorithm] = useState<AlgoKey>("sha1");
  const [secretKeys, setSecretKeys] = useState<SecretEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("secretKeys") ?? "[]"); } catch { return []; }
  });

  const validateSecretKey = (key: string) => {
    const clean = key.replace(/\s/g, "");
    return clean.length === 16 || clean.length === 32;
  };

  const generateOtp = (keyOverride?: string, digitsOverride?: OtpDigitsKey, algoOverride?: AlgoKey) => {
    const keyToUse = (keyOverride || secret).replace(/\s/g, "");
    if (!keyToUse) return;
    const d = parseInt(digitsOverride ?? digits, 10);
    const a = algoOverride ?? algorithm;
    const newOtp = (window as Window & { otplib: { totp: { generate: (secret: string, options: { digits: number; algorithm: string }) => string } } }).otplib.totp.generate(keyToUse, { digits: d, algorithm: a });
    setOtp(newOtp);
    setIsSecretValid(true);
    const exists = secretKeys.some(k => k.key === keyToUse);
    if (!exists) {
      const updated = [...secretKeys, {
        name: name.trim() || "Unnamed",
        key: keyToUse,
        timestamp: new Date().toLocaleString(),
        digits: digitsOverride ?? digits,
        algorithm: algoOverride ?? algorithm,
      }];
      setSecretKeys(updated);
      localStorage.setItem("secretKeys", JSON.stringify(updated));
    }
  };

  const handleSecretChange = (val: string) => {
    const clean = val.replace(/\s/g, "");
    setSecret(clean);
    setIsSecretValid(validateSecretKey(clean));
    if (!validateSecretKey(clean)) setOtp("");
  };

  useEffect(() => {
    const id = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (isSecretValid && secret) generateOtp();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secret, isSecretValid, digits, algorithm]);

  const handleSetCurrentSecret = (entry: SecretEntry) => {
    const effectiveDigits = entry.digits ?? digits;
    const effectiveAlgorithm = entry.algorithm ?? algorithm;
    setSecret(entry.key);
    setName(entry.name);
    setDigits(effectiveDigits);
    setAlgorithm(effectiveAlgorithm);
    setOtp("");
    setTimeRemaining(30);
    if (validateSecretKey(entry.key)) {
      setIsSecretValid(true);
      generateOtp(entry.key, effectiveDigits, effectiveAlgorithm);
    }
  };

  const handleClearAll = () => {
    setSecretKeys([]); localStorage.removeItem("secretKeys");
  };

  const timerPct = (timeRemaining / 30) * 100;
  const timerColor = timeRemaining > 15 ? "#34d399" : timeRemaining > 8 ? "#f59e0b" : "#f87171";
  const algoMeta = ALGOS.find(a => a.key === algorithm)!;
  const digitMeta = OTP_DIGITS.find(a => a.key === digits)!;
  const otpHalf = Math.floor(otp.length / 2);

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🔐</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">OTP Generator</h1>
          <p className="tool-header-desc">Generate Time-based One-Time Passwords (TOTP) for 2FA authentication.</p>
        </div>
        {isSecretValid && otp && (
          <span className="tool-badge tool-badge-success" style={{ flexShrink: 0 }}>Active</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>

        {/* Input card */}
        <div className="tool-card">
          <div className="tool-card-header">⚙️ Setup</div>
          <div className="tool-card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Name */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "0.4rem" }}>
                Account Name
              </label>
              <input
                className="tool-textarea"
                style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", height: "auto", minHeight: "unset" }}
                type="text"
                placeholder="e.g. GitHub, Google, AWS…"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

              {/* Algorithms */}
              <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                      Algorithm
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {ALGOS.map(a => {
                          const active = algorithm === a.key;
                          return (
                              <button
                                  key={a.key}
                                  onClick={() => setAlgorithm(a.key)}
                                  style={{
                                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                                      background: active ? 'var(--primary-light)' : 'transparent',
                                      color: active ? 'var(--primary)' : 'var(--text)',
                                      fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
                                      transition: 'all var(--duration) var(--ease)',
                                  }}
                              >
                                  {a.label}
                              </button>
                          );
                      })}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                      {algoMeta.note}
                  </div>
              </div>

              {/* Digits */}
              <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                      Digits
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {OTP_DIGITS.map(a => {
                          const active = digits === a.key;
                          return (
                              <button
                                  key={a.key}
                                  onClick={() => setDigits(a.key)}
                                  style={{
                                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                                      background: active ? 'var(--primary-light)' : 'transparent',
                                      color: active ? 'var(--primary)' : 'var(--text)',
                                      fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
                                      transition: 'all var(--duration) var(--ease)',
                                  }}
                              >
                                  {a.label}
                              </button>
                          );
                      })}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                      {digitMeta.note}
                  </div>
              </div>

            {/* Secret key */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "0.4rem" }}>
                Secret Key
              </label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  className="tool-textarea"
                  style={{
                    flex: 1, padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", height: "auto", minHeight: "unset",
                    borderColor: secret && !isSecretValid ? "#f87171" : undefined,
                    fontFamily: showSecret ? "var(--font-mono)" : undefined,
                    letterSpacing: showSecret ? "1px" : undefined,
                  }}
                  type={showSecret ? "text" : "password"}
                  placeholder="16 or 32 character key"
                  value={secret}
                  onChange={e => handleSecretChange(e.target.value)}
                />
                <button
                  onClick={() => setShowSecret(s => !s)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--muted)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >{showSecret ? "Hide" : "Show"}</button>
              </div>
              {secret && !isSecretValid && (
                <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "0.3rem" }}>Must be 16 or 32 characters</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="primary" onClick={() => generateOtp()} disabled={!isSecretValid} style={{ flex: 1 }}>
                ⟳ Generate OTP
              </Button>
              <button
                onClick={() => { setSecret(""); setName(""); setOtp(""); setIsSecretValid(false); }}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid #f8717133",
                  background: "color-mix(in srgb, #f87171 10%, transparent)",
                  color: "#f87171",
                  fontWeight: 600,
                  fontSize: "0.83rem",
                  cursor: "pointer",
                }}
              >Clear</button>
            </div>
          </div>
        </div>

        {/* OTP display */}
        <div className="tool-card">
          <div className="tool-card-header">
            🔑 Your OTP
            {otp && <div className="tool-action-row ms-auto"><CopyWithToast text={otp} /></div>}
          </div>
          <div className="tool-card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "1.5rem" }}>
            {otp ? (
              <>
                {/* Large OTP display */}
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.3em",
                  color: "var(--primary)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-hover)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.75rem 1.5rem",
                  userSelect: "all",
                }}>
                  {otp.slice(0, otpHalf)} {otp.slice(otpHalf)}
                </div>

                {/* Timer */}
                <div style={{ width: "80px", height: "80px" }}>
                  <CircularProgressbar
                    value={timerPct}
                    text={`${timeRemaining}s`}
                    styles={buildStyles({
                      pathColor: timerColor,
                      textColor: timerColor,
                      trailColor: "var(--border-color)",
                      textSize: "28px",
                    })}
                  />
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
                  Code refreshes every 30 seconds
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
                <div style={{ fontSize: "0.9rem" }}>Enter a valid secret key to generate your OTP</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved accounts */}
      <div className="tool-card" style={{ marginTop: "1rem" }}>
        <div className="tool-card-header">
          📚 Saved Accounts
          <div className="tool-action-row ms-auto" style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setShowTableSecrets(s => !s)}
              style={{
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--muted)",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >{showTableSecrets ? "Hide Keys" : "Reveal Keys"}</button>
            {secretKeys.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid #f8717133",
                  background: "color-mix(in srgb, #f87171 10%, transparent)",
                  color: "#f87171",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >Clear All</button>
            )}
          </div>
        </div>
        <div className="tool-card-body" style={{ padding: "0.5rem" }}>
          {secretKeys.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
              No saved accounts. Generate an OTP to auto-save.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {secretKeys.map((entry, i) => {
                const isCurrent = entry.key === secret;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "var(--radius-md)",
                      background: isCurrent ? "var(--primary-light)" : "var(--bg-secondary)",
                      border: `1px solid ${isCurrent ? "var(--border-hover)" : "transparent"}`,
                    }}
                  >
                    <span style={{
                      width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
                      background: isCurrent ? "var(--primary-light)" : "var(--bg)",
                      border: "1px solid var(--border-color)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", flexShrink: 0,
                    }}>🔑</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.84rem", color: isCurrent ? "var(--primary)" : "var(--text)" }}>
                        {entry.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--muted)" }}>
                        {showTableSecrets ? entry.key : "••••••••••••••••"}
                      </div>
                      {(entry.algorithm || entry.digits) && (
                        <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.2rem" }}>
                          {entry.algorithm && (
                            <span style={{ fontSize: "0.65rem", background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.05rem 0.35rem", color: "var(--muted)" }}>
                              {entry.algorithm.toUpperCase()}
                            </span>
                          )}
                          {entry.digits && (
                            <span style={{ fontSize: "0.65rem", background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.05rem 0.35rem", color: "var(--muted)" }}>
                              {entry.digits} digits
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", flexShrink: 0, textAlign: "right" }}>
                      {entry.timestamp}
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => handleSetCurrentSecret(entry)}
                        style={{
                          padding: "0.3rem 0.7rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--primary)",
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >Use</button>
                    )}
                    {isCurrent && (
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "var(--primary)", flexShrink: 0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="tool-card" style={{ marginTop: "1rem" }}>
        <div className="tool-card-header">📖 How It Works</div>
        <div className="tool-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {[
              { icon: "🔑", title: "Get Secret Key", desc: "Enable 2FA on your service (GitHub, Google…) to receive your 16 or 32 character secret." },
              { icon: "⏱️", title: "Auto-Refresh", desc: "Codes change every 30 seconds. The timer shows how long the current code is valid." },
              { icon: "💾", title: "Auto-Save", desc: "Keys are saved locally in your browser. No data is ever sent to any server." },
              { icon: "⚡", title: "Quick Switch", desc: "Saved accounts let you switch 2FA contexts instantly with one click." },
            ].map(tip => (
              <div key={tip.title} style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}>
                <div style={{ fontSize: "1.3rem", marginBottom: "0.35rem" }}>{tip.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)", marginBottom: "0.2rem" }}>{tip.title}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};
