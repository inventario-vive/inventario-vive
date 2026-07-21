/* ============================================================
   VIVE TELECOM — Reportes
   ============================================================ */

function DistribucionCard({ title, data, total }) {
  return (
    <div className="card card-pad">
      <div className="card-title">{title}</div>
      {data.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Sin datos todavía.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map(({ label, count }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>{label}</span>
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
            <div style={{ background: "var(--color-bg)", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  width: `${total ? (count / total) * 100 : 0}%`,
                  background: "var(--color-primary)",
                  height: "100%",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function contarPor(items, keyFn, labelFn) {
  const counts = {};
  items.forEach((item) => {
    const key = keyFn(item) || "Sin definir";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({ label: labelFn ? labelFn(key) : key, count }))
    .sort((a, b) => b.count - a.count);
}

function Reportes() {
  const { data: recursos, loading } = useCollection("recursos");
  const { data: empresas } = useCollection("empresas");
  const { data: asignaciones } = useCollection("asignaciones");
  const { data: devoluciones } = useCollection("devoluciones");
  const { data: transferencias } = useCollection("transferencias");
  const { data: bajas } = useCollection("bajas");

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "Sin definir";

  const porEstado = useMemo(() => contarPor(recursos, (r) => r.estado, estadoLabel), [recursos]);
  const porTipo = useMemo(() => contarPor(recursos, (r) => r.tipo), [recursos]);
  const porEmpresa = useMemo(() => contarPor(recursos, (r) => r.empresaId, empresaNombre), [recursos, empresas]);

  const handleExport = (tipo) => {
    switch (tipo) {
      case "recursos":
        exportCSV("recursos", recursos, [
          { label: "Código", value: (r) => r.codigo },
          { label: "Tipo", value: (r) => r.tipo },
          { label: "Categoría", value: (r) => r.categoria },
          { label: "Marca", value: (r) => r.marca },
          { label: "Modelo", value: (r) => r.modelo },
          { label: "N° de serie", value: (r) => r.numeroSerie },
          { label: "Estado", value: (r) => estadoLabel(r.estado) },
          { label: "Empresa", value: (r) => empresaNombre(r.empresaId) },
          { label: "Fecha de adquisición", value: (r) => r.fechaAdquisicion },
          { label: "Observaciones", value: (r) => r.observaciones },
        ]);
        break;
      case "asignaciones":
        exportCSV("asignaciones", asignaciones, [
          { label: "Fecha de entrega", value: (a) => a.fechaEntrega },
          { label: "Funcionario", value: (a) => a.funcionarioSnapshot?.nombre },
          { label: "Empresa", value: (a) => a.empresaSnapshot },
          { label: "Cantidad de recursos", value: (a) => (a.recursosSnapshot || []).length },
          { label: "Entregado por", value: (a) => a.responsableEntrega },
        ]);
        break;
      case "devoluciones":
        exportCSV("devoluciones", devoluciones, [
          { label: "Fecha", value: (d) => d.fechaDevolucion },
          { label: "Funcionario", value: (d) => d.funcionarioSnapshot?.nombre },
          { label: "Cantidad de recursos", value: (d) => (d.recursosSnapshot || []).length },
          { label: "Estado resultante", value: (d) => estadoLabel(d.estadoRecurso) },
          { label: "Recibido por", value: (d) => d.responsableRecibe },
        ]);
        break;
      case "transferencias":
        exportCSV("transferencias", transferencias, [
          { label: "Fecha", value: (t) => t.fecha },
          { label: "Cantidad de recursos", value: (t) => (t.recursosSnapshot || []).length },
          { label: "Empresa destino", value: (t) => t.destino?.empresaNombre },
          { label: "Nuevo responsable", value: (t) => t.destino?.funcionarioNombre },
          { label: "Registrado por", value: (t) => t.responsable },
        ]);
        break;
      case "bajas":
        exportCSV("bajas", bajas, [
          { label: "Fecha", value: (b) => b.fecha },
          { label: "Cantidad de recursos", value: (b) => (b.recursosSnapshot || []).length },
          { label: "Motivo", value: (b) => b.motivo },
          { label: "Responsable", value: (b) => b.responsable },
        ]);
        break;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Distribución del inventario y exportación de datos a Excel/CSV.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <DistribucionCard title="Recursos por estado" data={porEstado} total={recursos.length} />
        <DistribucionCard title="Recursos por tipo" data={porTipo} total={recursos.length} />
        <DistribucionCard title="Recursos por empresa" data={porEmpresa} total={recursos.length} />
      </div>

      <div className="card card-pad">
        <div className="card-title">Exportar datos</div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
          Descarga un archivo CSV (compatible con Excel) de cada colección, listo para análisis o respaldo.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button variant="secondary" icon="download" onClick={() => handleExport("recursos")}>Recursos ({recursos.length})</Button>
          <Button variant="secondary" icon="download" onClick={() => handleExport("asignaciones")}>Asignaciones ({asignaciones.length})</Button>
          <Button variant="secondary" icon="download" onClick={() => handleExport("devoluciones")}>Devoluciones ({devoluciones.length})</Button>
          <Button variant="secondary" icon="download" onClick={() => handleExport("transferencias")}>Transferencias ({transferencias.length})</Button>
          <Button variant="secondary" icon="download" onClick={() => handleExport("bajas")}>Bajas ({bajas.length})</Button>
        </div>
      </div>
    </div>
  );
}
