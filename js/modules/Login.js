/* ============================================================
   VIVE TELECOM — Login
   ============================================================ */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          VIVE <span>TELECOM</span>
          <span className="version-badge" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)", background: "var(--color-bg)" }}>v{APP_VERSION}</span>
        </div>
        <div className="login-subtitle">Sistema de Inventario de Recursos</div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@vivetelecom.com.py"
            />
          </div>
          <div className="form-field" style={{ marginBottom: 20 }}>
            <label>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
