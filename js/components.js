/* ============================================================
   VIVE TELECOM — Componentes de interfaz reutilizables
   ============================================================ */

// ---------- Icono Lucide ----------
function Icon({ name, size = 17 }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({ el: ref.current });
    }
  }, [name]);
  return <span ref={ref} style={{ width: size, height: size, display: "inline-flex" }} />;
}

// ---------- Botón ----------
function Button({ variant = "secondary", size, icon, children, onClick, disabled, type = "button" }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : ""].join(" ").trim();
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

// ---------- Badge de estado ----------
function EstadoBadge({ estado }) {
  return <span className={`badge badge-${estado}`}>{estadoLabel(estado)}</span>;
}

// ---------- Modal genérico ----------
function Modal({ title, onClose, children, footer, width }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <span className="modal-close" onClick={onClose}><Icon name="x" size={19} /></span>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Confirmación para acciones críticas (spec de diseño, sección 5 y 15) ----------
function ConfirmDialog({ title, message, confirmLabel = "Confirmar", danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
          >
            {danger ? <span className="btn btn-danger solid" style={{ display: "contents" }}>{confirmLabel}</span> : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="confirm-box"><p>{message}</p></div>
    </Modal>
  );
}

// ---------- Tabla de datos con búsqueda y orden ----------
function DataTable({ columns, rows, searchPlaceholder = "Buscar…", actions, emptyLabel = "No hay registros para mostrar." }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((row) =>
        columns.some((col) => {
          const val = col.searchValue ? col.searchValue(row) : row[col.key];
          return String(val ?? "").toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const col = columns.find((c) => c.key === sortKey);
        const av = col.sortValue ? col.sortValue(a) : a[sortKey];
        const bv = col.sortValue ? col.sortValue(b) : b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        return String(av).localeCompare(String(bv), "es", { numeric: true }) * (sortDir === "asc" ? 1 : -1);
      });
    }
    return list;
  }, [rows, search, sortKey, sortDir, columns]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div>
      <div className="table-toolbar">
        <div className="table-search">
          <Icon name="search" size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} />
        </div>
        <div className="table-actions">{actions}</div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} onClick={() => col.sortable !== false && toggleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="table-empty">{emptyLabel}</div>}
      </div>
    </div>
  );
}

// ---------- Membrete (logo real si fue cargado en Configuración, o texto de respaldo) ----------
function DocumentoLetterhead({ subtitle }) {
  const { data: config } = useDoc("configuracion/general");
  return (
    <div>
      {config?.logoDataUrl ? (
        <img src={config.logoDataUrl} alt="Vive Telecom" style={{ maxHeight: 42, maxWidth: 220, objectFit: "contain" }} />
      ) : (
        <div style={{ fontWeight: 800, fontSize: 18 }}>VIVE <span style={{ color: "#F54900" }}>TELECOM</span></div>
      )}
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}

// ---------- Checklist de selección múltiple de recursos ----------
function RecursoChecklist({ recursos, selected, onToggle, emptyLabel = "No hay recursos que coincidan." }) {
  const [search, setSearch] = useState("");

  const filtrados = useMemo(() => {
    if (!search.trim()) return recursos;
    const q = search.trim().toLowerCase();
    return recursos.filter((r) =>
      [r.codigo, r.tipo, r.marca, r.modelo].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [recursos, search]);

  return (
    <div>
      <div className="table-search" style={{ marginBottom: 10 }}>
        <Icon name="search" size={15} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar recurso…" />
      </div>
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", maxHeight: 220, overflowY: "auto" }}>
        {filtrados.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>{emptyLabel}</div>
        )}
        {filtrados.map((r) => (
          <label
            key={r.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderBottom: "1px solid var(--color-border)",
              fontSize: 13.5, cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={selected.includes(r.id)} onChange={() => onToggle(r.id)} />
            <span style={{ fontWeight: 600 }}>{r.codigo}</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{r.tipo} · {r.marca} {r.modelo}</span>
          </label>
        ))}
      </div>
      <div className="form-hint" style={{ marginTop: 6 }}>{selected.length} recurso(s) seleccionado(s)</div>
    </div>
  );
}

// ---------- Sidebar (menú agrupado) ----------
const MENU_GROUPS = [
  {
    title: "General",
    items: [
      { key: "inicio", label: "Inicio", icon: "home" },
      { key: "reportes", label: "Reportes", icon: "bar-chart-3" },
    ],
  },
  {
    title: "Maestros",
    items: [
      { key: "empresas", label: "Empresas", icon: "building-2" },
      { key: "sucursales", label: "Sucursales", icon: "map-pin" },
      { key: "departamentos", label: "Departamentos", icon: "network" },
      { key: "funcionarios", label: "Funcionarios", icon: "users" },
    ],
  },
  {
    title: "Recursos",
    items: [
      { key: "recursos", label: "Recursos", icon: "laptop" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { key: "asignaciones", label: "Asignaciones", icon: "file-text" },
      { key: "transferencias", label: "Transferencias", icon: "repeat" },
      { key: "devoluciones", label: "Devoluciones", icon: "corner-up-left" },
      { key: "mantenimiento", label: "Mantenimiento", icon: "wrench" },
      { key: "bajas", label: "Bajas", icon: "trash-2" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { key: "historial", label: "Historial", icon: "history" },
      { key: "configuracion", label: "Configuración", icon: "settings" },
    ],
  },
];

function Sidebar({ current, onNavigate, open, rol }) {
  const { data: config } = useDoc("configuracion/general");
  const grupos = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.key !== "configuracion" || rol === "admin"),
  }));
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">
        {config?.logoDataUrl ? (
          <img src={config.logoDataUrl} alt="Vive Telecom" style={{ maxHeight: 30, maxWidth: 160, objectFit: "contain" }} />
        ) : (
          <>VIVE <span>TELECOM</span></>
        )}
        <span className="version-badge">v{APP_VERSION}</span>
      </div>
      {grupos.map((group) => (
        <div className="sidebar-section" key={group.title}>
          <div className="sidebar-section-title">{group.title}</div>
          {group.items.map((item) => (
            <div
              key={item.key}
              className={`sidebar-link ${current === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}

// Días de anticipación para avisar sobre mantenimientos próximos o vencidos,
// y días máximos que un mantenimiento puede quedar "en curso" sin generar alerta.
const DIAS_ALERTA_MANTENIMIENTO = 15;

function calcularNotificaciones(recursos, mantenimientos) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const lista = [];

  recursos.forEach((r) => {
    if (!r.proximoMantenimiento) return;
    if (["dado_de_baja", "en_mantenimiento", "en_reparacion"].includes(r.estado)) return;
    const fecha = new Date(r.proximoMantenimiento + "T00:00:00");
    if (isNaN(fecha.getTime())) return;
    const diffDias = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
    if (diffDias <= DIAS_ALERTA_MANTENIMIENTO) {
      lista.push({
        id: `prox-${r.id}`,
        ruta: "recursos",
        vencido: diffDias < 0,
        texto: diffDias < 0
          ? `${r.codigo} — mantenimiento vencido hace ${Math.abs(diffDias)} día(s)`
          : diffDias === 0
            ? `${r.codigo} — mantenimiento programado para hoy`
            : `${r.codigo} — mantenimiento programado en ${diffDias} día(s)`,
      });
    }
  });

  mantenimientos.forEach((m) => {
    if (m.estado !== "en_curso") return;
    const inicio = new Date(m.fechaInicio + "T00:00:00");
    if (isNaN(inicio.getTime())) return;
    const diffDias = Math.round((hoy - inicio) / (1000 * 60 * 60 * 24));
    if (diffDias >= DIAS_ALERTA_MANTENIMIENTO) {
      lista.push({
        id: `curso-${m.id}`,
        ruta: "mantenimiento",
        vencido: true,
        texto: `${m.recursoSnapshot?.codigo || "Recurso"} — en mantenimiento hace ${diffDias} día(s) sin finalizar`,
      });
    }
  });

  return lista;
}

// ---------- Topbar ----------
function Topbar({ moduleLabel, user, onToggleSidebar, onLogout, notificaciones, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="icon-btn" style={{ display: "none" }} id="menu-toggle-placeholder" />
        <div className="topbar-module">{moduleLabel}</div>
        <div className="topbar-company">Vive Telecom S.A.</div>
      </div>
      <div className="topbar-search">
        <Icon name="search" size={15} />
        <input placeholder="Buscar recursos, funcionarios, empresas…" />
      </div>
      <div className="topbar-right">
        <div ref={ref} style={{ position: "relative" }}>
          <div className="topbar-icon-btn" onClick={() => setOpen((v) => !v)} style={{ position: "relative" }}>
            <Icon name="bell" size={18} />
            {notificaciones.length > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                background: "var(--color-danger)", color: "#fff",
                fontSize: 10, fontWeight: 700, borderRadius: 999,
                minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>
                {notificaciones.length > 9 ? "9+" : notificaciones.length}
              </span>
            )}
          </div>
          {open && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 320, maxHeight: 360, overflowY: "auto",
              background: "#fff", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", zIndex: 50,
            }}>
              <div style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13, borderBottom: "1px solid var(--color-border)" }}>
                Notificaciones
              </div>
              {notificaciones.length === 0 ? (
                <div style={{ padding: 20, fontSize: 13, color: "var(--color-text-secondary)", textAlign: "center" }}>
                  Sin novedades por ahora.
                </div>
              ) : (
                notificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { setOpen(false); onNavigate(n.ruta); }}
                    style={{
                      padding: "10px 14px", fontSize: 13, cursor: "pointer",
                      borderBottom: "1px solid var(--color-border)", display: "flex", gap: 8, alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: n.vencido ? "var(--color-danger)" : "var(--state-mantenimiento)", marginTop: 2 }}>
                      <Icon name={n.vencido ? "alert-circle" : "clock"} size={14} />
                    </span>
                    <span>{n.texto}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="topbar-user" onClick={onLogout} title="Cerrar sesión">
          <div className="topbar-avatar">{initials(user?.email)}</div>
        </div>
      </div>
    </header>
  );
}
