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

const ROLES = [
  { value: "admin", label: "Administrador", desc: "Acceso completo, incluida la gestión de usuarios." },
  { value: "editor", label: "Editor", desc: "Puede crear y editar, sin eliminar ni gestionar usuarios." },
  { value: "lector", label: "Solo lectura", desc: "Puede consultar, sin crear ni modificar nada." },
];

function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function NuevoUsuarioForm({ onCancel, onCreated }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("editor");
  const [password, setPassword] = useState(generarPassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setSaving(true);
    try {
      // Se crea la cuenta en una instancia secundaria de Firebase para no
      // cerrar la sesión del administrador que la está creando.
      await secondaryAuth.createUserWithEmailAndPassword(email, password);
      await secondaryAuth.signOut();

      await db.collection("usuarios").doc(email).set({
        email,
        nombre,
        rol,
        activo: true,
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });

      onCreated({ email, password });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Ya existe una cuenta con ese correo. Si querés asignarle un rol, buscala en la lista de abajo.");
      } else if (err.code === "auth/invalid-email") {
        setError("El correo ingresado no es válido.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es muy débil (mínimo 6 caracteres).");
      } else {
        setError("Ocurrió un error al crear el usuario.");
      }
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-grid">
          <div className="form-field full">
            <label>Correo electrónico</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@vivetelecom.com.py" />
          </div>
          <div className="form-field full">
            <label>Nombre completo</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Contraseña inicial</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button variant="secondary" size="sm" type="button" onClick={() => setPassword(generarPassword())}>Generar</Button>
            </div>
            <span className="form-hint">Compartísela a la persona para que inicie sesión. No se envía por correo automáticamente.</span>
          </div>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Creando…" : "Crear usuario"}</Button>
      </div>
    </form>
  );
}

function EditarUsuarioForm({ usuario, onCancel, onSaved }) {
  const [nombre, setNombre] = useState(usuario.nombre || "");
  const [rol, setRol] = useState(usuario.rol || "lector");
  const [activo, setActivo] = useState(usuario.activo !== false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.collection("usuarios").doc(usuario.email).update({
        nombre, rol, activo, actualizadoEn: serverTimestamp(),
      });
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar los cambios.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-grid">
          <div className="form-field full">
            <label>Correo</label>
            <input value={usuario.email} disabled />
          </div>
          <div className="form-field full">
            <label>Nombre completo</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Acceso</label>
            <select value={activo ? "1" : "0"} onChange={(e) => setActivo(e.target.value === "1")}>
              <option value="1">Activo</option>
              <option value="0">Desactivado (no puede ingresar)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </div>
    </form>
  );
}

function GestionUsuarios() {
  const { data: usuarios, loading } = useCollection("usuarios", { orderByField: "email" });
  const [showNuevo, setShowNuevo] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [credencialesNuevas, setCredencialesNuevas] = useState(null);

  const handleRemove = async () => {
    await db.collection("usuarios").doc(toRemove.email).delete();
    setToRemove(null);
  };

  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Usuarios y roles</div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Crear una cuenta acá la da de alta directamente en Firebase Authentication.
            Eliminar un usuario de esta lista revoca su rol (queda como "solo lectura"), pero
            no borra la cuenta de Firebase — para eso hay que hacerlo manualmente en la consola.
          </p>
        </div>
        <Button variant="primary" icon="user-plus" onClick={() => setShowNuevo(true)}>Nuevo usuario</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando usuarios…" : "Todavía no hay usuarios registrados con rol asignado."}
        searchPlaceholder="Buscar por correo o nombre…"
        columns={[
          { key: "email", label: "Correo" },
          { key: "nombre", label: "Nombre" },
          { key: "rol", label: "Rol", render: (u) => ROLES.find((r) => r.value === u.rol)?.label || u.rol },
          {
            key: "activo", label: "Acceso",
            render: (u) => u.activo === false
              ? <span className="badge badge-dado_de_baja">Desactivado</span>
              : <span className="badge badge-disponible">Activo</span>,
          },
          {
            key: "acciones", label: "", sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Editar" onClick={() => setEditing(row)}><Icon name="pencil" size={15} /></span>
                <span className="icon-btn" title="Quitar rol" onClick={() => setToRemove(row)}><Icon name="trash-2" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={usuarios}
      />

      {showNuevo && (
        <Modal title="Nuevo usuario" onClose={() => setShowNuevo(false)}>
          <NuevoUsuarioForm
            onCancel={() => setShowNuevo(false)}
            onCreated={(cred) => { setShowNuevo(false); setCredencialesNuevas(cred); }}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Editar usuario — ${editing.email}`} onClose={() => setEditing(null)}>
          <EditarUsuarioForm usuario={editing} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} />
        </Modal>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Quitar rol de usuario"
          message={`¿Confirma que desea quitar el rol de "${toRemove.email}"? Su cuenta de Firebase no se elimina, pero perderá acceso ampliado (quedará como solo lectura si vuelve a ingresar).`}
          confirmLabel="Quitar"
          danger
          onClose={() => setToRemove(null)}
          onConfirm={handleRemove}
        />
      )}

      {credencialesNuevas && (
        <Modal
          title="Usuario creado"
          onClose={() => setCredencialesNuevas(null)}
          footer={<Button variant="primary" onClick={() => setCredencialesNuevas(null)}>Listo</Button>}
        >
          <p style={{ fontSize: 13.5, marginBottom: 12 }}>
            Compartile estos datos a la persona para que inicie sesión (no se envían por correo automáticamente):
          </p>
          <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 13.5 }}>
            <div><strong>Correo:</strong> {credencialesNuevas.email}</div>
            <div><strong>Contraseña:</strong> {credencialesNuevas.password}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Configuracion({ rol }) {
  if (rol !== "admin") {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Configuración</h1>
          </div>
        </div>
        <div className="placeholder-box">
          <Icon name="lock" size={30} />
          <h3>Sin permisos</h3>
          <p>Este módulo es exclusivo para usuarios con rol Administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes generales del sistema.</p>
        </div>
      </div>

      <LogoUploader />
      <GestionUsuarios />

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
      </div>
    </div>
  );
}
