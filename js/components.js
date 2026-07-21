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
      { key: "inventario", label: "Inventario", icon: "package" },
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

function Sidebar({ current, onNavigate, open }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">VIVE <span>TELECOM</span></div>
      {MENU_GROUPS.map((group) => (
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

// ---------- Topbar ----------
function Topbar({ moduleLabel, user, onToggleSidebar, onLogout }) {
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
        <div className="topbar-icon-btn"><Icon name="bell" size={18} /></div>
        <div className="topbar-user" onClick={onLogout} title="Cerrar sesión">
          <div className="topbar-avatar">{initials(user?.email)}</div>
        </div>
      </div>
    </header>
  );
}
