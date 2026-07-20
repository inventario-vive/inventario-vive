/* ============================================================
   VIVE TELECOM — Dashboard (Inicio)
   ============================================================ */

function Dashboard({ onNavigate }) {
  const { data: recursos, loading } = useCollection("recursos");

  const kpis = useMemo(() => {
    const total = recursos.length;
    const count = (estado) => recursos.filter((r) => r.estado === estado).length;
    return {
      total,
      asignados: count("asignado"),
      disponibles: count("disponible"),
      enReparacion: count("en_reparacion"),
      enMantenimiento: count("en_mantenimiento"),
      dadosDeBaja: count("dado_de_baja"),
    };
  }, [recursos]);

  const recientes = useMemo(() => {
    return [...recursos]
      .sort((a, b) => {
        const av = a.fechaAdquisicion?.toMillis ? a.fechaAdquisicion.toMillis() : 0;
        const bv = b.fechaAdquisicion?.toMillis ? b.fechaAdquisicion.toMillis() : 0;
        return bv - av;
      })
      .slice(0, 6);
  }, [recursos]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="page-subtitle">Resumen general del inventario de Vive Telecom S.A.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => onNavigate("recursos")}>Nuevo recurso</Button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total de recursos</div>
          <div className="kpi-value accent">{loading ? "…" : kpis.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Asignados</div>
          <div className="kpi-value">{loading ? "…" : kpis.asignados}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disponibles</div>
          <div className="kpi-value">{loading ? "…" : kpis.disponibles}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En reparación</div>
          <div className="kpi-value">{loading ? "…" : kpis.enReparacion}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En mantenimiento</div>
          <div className="kpi-value">{loading ? "…" : kpis.enMantenimiento}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dados de baja</div>
          <div className="kpi-value">{loading ? "…" : kpis.dadosDeBaja}</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title">Recursos recientemente adquiridos</div>
        {recursos.length === 0 && !loading ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13.5 }}>
            Todavía no hay recursos cargados. Comenzá creando el primero desde el módulo Recursos.
          </p>
        ) : (
          <DataTable
            columns={[
              { key: "codigo", label: "Código" },
              { key: "tipo", label: "Tipo" },
              { key: "marca", label: "Marca / Modelo", render: (r) => `${r.marca || "—"} ${r.modelo || ""}` },
              { key: "estado", label: "Estado", render: (r) => <EstadoBadge estado={r.estado || "disponible"} /> },
              { key: "fechaAdquisicion", label: "Adquisición", render: (r) => formatDate(r.fechaAdquisicion) },
            ]}
            rows={recientes}
            searchPlaceholder="Buscar en recursos recientes…"
          />
        )}
      </div>
    </div>
  );
}
