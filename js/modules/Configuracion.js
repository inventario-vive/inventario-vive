/* ============================================================
   VIVE TELECOM — Configuración
   ============================================================ */

const TIPOS_LOGO_PERMITIDOS = ["image/png", "image/jpeg"];
const TAMANO_MAXIMO_ORIGINAL = 8 * 1024 * 1024; // 8 MB de archivo original, antes de comprimir
const ANCHO_MAXIMO_LOGO = 320; // px — suficiente para el sidebar y los documentos
const ALTO_MAXIMO_LOGO = 110; // px

// Redimensiona y comprime una imagen en el navegador, devolviendo un data URL liviano.
// Esto evita necesitar Firebase Storage (y por lo tanto el plan Blaze): el logo
// queda guardado como texto (base64) directo en el documento de Firestore.
function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida."));
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(ANCHO_MAXIMO_LOGO / width, ALTO_MAXIMO_LOGO / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG comprimido: liviano y suficiente para un logo institucional
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function LogoUploader() {
  const { data: config, loading } = useDoc("configuracion/general");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = React.useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    if (!TIPOS_LOGO_PERMITIDOS.includes(file.type)) {
      setError("Formato no admitido. Subí una imagen PNG o JPG.");
      return;
    }
    if (file.size > TAMANO_MAXIMO_ORIGINAL) {
      setError("La imagen es muy pesada (máximo 8 MB antes de comprimir).");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await comprimirImagen(file);
      if (dataUrl.length > 900 * 1024) {
        setError("La imagen comprimida sigue siendo muy grande. Probá con una imagen más simple.");
        setUploading(false);
        return;
      }
      await db.collection("configuracion").doc("general").set(
        { logoDataUrl: dataUrl, actualizadoEn: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al procesar la imagen.");
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!window.confirm("¿Quitar el logo actual? Se volverá a usar el texto \"VIVE TELECOM\".")) return;
    setUploading(true);
    try {
      await db.collection("configuracion").doc("general").set(
        { logoDataUrl: "", actualizadoEn: serverTimestamp() },
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
        transferencia. Formatos admitidos: PNG o JPG. Se ajusta y comprime automáticamente al
        subirlo, no requiere ningún servicio adicional de pago.
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
          ) : config?.logoDataUrl ? (
            <img src={config.logoDataUrl} alt="Logo actual" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
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
            {uploading ? "Procesando…" : config?.logoDataUrl ? "Reemplazar logo" : "Subir logo"}
          </Button>
          {config?.logoDataUrl && (
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
