/* ============================================================
   VIVE TELECOM — Historial global
   ============================================================ */

const TIPOS_EVENTO_HISTORIAL = {
  alta: { label: "Alta", badge: "badge-disponible" },
  edicion: { label: "Edición", badge: "badge-reservado" },
  cambio_estado: { label: "Cambio de estado", badge: "badge-en_mantenimiento" },
  asignacion: { label: "Asignación", badge: "badge-asignado" },
  devolucion: { label: "Devolución", badge: "badge-en_prestamo" },
  transferencia: { label: "Transferencia", badge: "badge-reservado" },
  mantenimiento: { label: "Mantenimiento", badge: "badge-en_mantenimiento" },
  baja: { label: "Baja", badge: "badge-dado_de_baja" },
};

function EventoBadge({ tipo }) {
  const info = TIPOS_EVENTO_HISTORIAL[tipo] || { label: tipo || "Evento", badge: "badge-reservado" };
  return <span className={`badge ${info.badge}`}>{info.label}</span>;
}

function Historial() {
  const { data: eventos, loading } = useCollectionGroup("historial", { orderByField: "fecha", orderDirection: "desc" });
  const { data: recursos } = useCollection("recursos");
  const [filtroTipo, setFiltroTipo] = useState("");

  const recursoInfo = (id) => recursos.find((r) => r.id === id);

  const filtrados = useMemo(() => {
    if (!filtroTipo) return eventos;
    return eventos.filter((e) => e.tipo === filtroTipo);
  }, [eventos, filtroTipo]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial</h1>
          <p className="page-subtitle">Todos los movimientos registrados sobre los recursos, en un solo lugar.</p>
        </div>
      </div>

      <div className="card card-pad">
        <div className="table-toolbar" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {loading ? "Cargando historial…" : `${filtrados.length} evento(s)`}
          </div>
          <div className="table-actions">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13, fontFamily: "inherit" }}
            >
              <option value="">Todos los tipos de evento</option>
              {Object.entries(TIPOS_EVENTO_HISTORIAL).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <DataTable
          emptyLabel={loading ? "Cargando historial…" : "Todavía no hay eventos registrados."}
          searchPlaceholder="Buscar por código de recurso o detalle…"
          columns={[
            { key: "fecha", label: "Fecha", render: (e) => formatDateTime(e.fecha) },
            {
              key: "recursoId", label: "Recurso",
              render: (e) => recursoInfo(e.recursoId)?.codigo || "(recurso eliminado)",
              searchValue: (e) => recursoInfo(e.recursoId)?.codigo || "",
            },
            { key: "tipo", label: "Evento", render: (e) => <EventoBadge tipo={e.tipo} /> },
            { key: "detalle", label: "Detalle", searchValue: (e) => e.detalle },
            { key: "usuario", label: "Usuario" },
          ]}
          rows={filtrados}
        />
      </div>

      <p className="form-hint" style={{ marginTop: 10 }}>
        Nota técnica: esta vista consulta todas las subcolecciones "historial" de Firestore a la vez
        (collection group). Si Firestore pide crear un índice la primera vez, aceptalo desde el enlace
        que aparece en la consola del navegador — es automático y se hace una sola vez.
      </p>
    </div>
  );
}
