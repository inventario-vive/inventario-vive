/* ============================================================
   VIVE TELECOM — App raíz
   ============================================================ */

const MODULE_LABELS = {
  inicio: "Inicio",
  empresas: "Empresas",
  sucursales: "Sucursales",
  departamentos: "Departamentos",
  funcionarios: "Funcionarios",
  recursos: "Recursos",
  asignaciones: "Asignaciones",
  transferencias: "Transferencias",
  devoluciones: "Devoluciones",
  mantenimiento: "Mantenimiento",
  bajas: "Bajas",
  historial: "Historial",
  reportes: "Reportes",
  configuracion: "Configuración",
};

function getRouteFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  return hash && MODULE_LABELS[hash] ? hash : "inicio";
}

function AppShell({ user }) {
  const [route, setRoute] = useState(getRouteFromHash());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (key) => {
    window.location.hash = key;
    setRoute(key);
    setSidebarOpen(false);
  };

  const renderModule = () => {
    switch (route) {
      case "inicio": return <Dashboard onNavigate={navigate} />;
      case "empresas": return <Empresas />;
      case "sucursales": return <Sucursales />;
      case "departamentos": return <Departamentos />;
      case "funcionarios": return <Funcionarios />;
      case "recursos": return <Recursos />;
      case "asignaciones": return <Asignaciones />;
      case "devoluciones": return <Devoluciones />;
      case "transferencias": return <Transferencias />;
      case "mantenimiento": return <Mantenimiento />;
      case "bajas": return <Bajas />;
      case "historial": return <Historial />;
      case "reportes": return <Reportes />;
      case "configuracion": return <Configuracion />;
      default: return <Placeholder label={MODULE_LABELS[route] || "Módulo"} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar current={route} onNavigate={navigate} open={sidebarOpen} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar
          moduleLabel={MODULE_LABELS[route] || "Módulo"}
          user={user}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onLogout={() => { if (window.confirm("¿Cerrar sesión?")) auth.signOut(); }}
        />
        <div className="content">{renderModule()}</div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined); // undefined = verificando, null = sin sesión

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">VIVE <span>TELECOM</span></div>
        <div className="boot-label">Verificando sesión…</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return <AppShell user={user} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
