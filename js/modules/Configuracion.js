/* ============================================================
   VIVE TELECOM — Configuración
   ============================================================ */

const TIPOS_LOGO_PERMITIDOS = ["image/png", "image/jpeg"];
const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024; // 2 MB

function LogoUploader() {
  const { data: config, loading } = useDoc("configuracion/general");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = React.useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo si hace falta
    if (!file) return;

    setError("");
    if (!TIPOS_LOGO_PERMITIDOS.includes(file.type)) {
      setError("Formato no admitido. Subí una imagen PNG o JPG.");
      return;
    }
    if (file.size > TAMANO_MAXIMO_LOGO) {
      setError("La imagen es muy pesada. El tamaño máximo es 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const ref = storage.ref("configuracion/logo");
      await ref.put(file, { contentType: file.type });
      const url = await ref.getDownloadURL();
      await db.collection("configuracion").doc("general").set(
        { logoUrl: url, actualizadoEn: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al subir el logo. Verificá las reglas de Firebase Storage.");
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!window.confirm("¿Quitar el logo actual? Se volverá a usar el texto \"VIVE TELECOM\".")) return;
    setUploading(true);
    try {
      await storage.ref("configuracion/logo").delete().catch(() => {});
      await db.collection("configuracion").doc("general").set(
        { logoUrl: "", actualizadoEn: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al quitar el logo.");
    }
    setUploading(false);
  };

  return (
    <div className="card card-pad">
      <div className="card-title">Logo de la empresa</div>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Se usa en el menú lateral y en el encabezado de los documentos de entrega, devolución y
        transferencia. Formatos admitidos: PNG o JPG, hasta 2 MB.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div
          style={{
            width: 160, height: 90,
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--color-bg)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Cargando…</span>
          ) : config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo actual" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "0 10px", textAlign: "center" }}>
              Sin logo cargado — se usa el texto "VIVE TELECOM"
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <Button variant="primary" icon="upload" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Subiendo…" : config?.logoUrl ? "Reemplazar logo" : "Subir logo"}
          </Button>
          {config?.logoUrl && (
            <Button variant="danger" size="sm" disabled={uploading} onClick={handleRemove}>Quitar logo</Button>
          )}
        </div>
      </div>

      {error && <div className="login-error" style={{ marginTop: 14, maxWidth: 420 }}>{error}</div>}
    </div>
  );
}

function Configuracion() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes generales del sistema.</p>
        </div>
      </div>

      <LogoUploader />

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-title">Sistema</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", color: "var(--color-text-secondary)", width: 180 }}>Versión actual</td>
              <td style={{ padding: "6px 0", fontWeight: 600 }}>v{APP_VERSION}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Usuario conectado</td>
              <td style={{ padding: "6px 0" }}>{auth.currentUser?.email || "—"}</td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint" style={{ marginTop: 12 }}>
          La gestión de usuarios y permisos se administra por ahora desde Firebase Authentication
          (consola de Firebase → Authentication → Users). Todo usuario autenticado tiene acceso
          completo al sistema.
        </p>
      </div>
    </div>
  );
}
