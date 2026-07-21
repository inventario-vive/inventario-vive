/* ============================================================
   VIVE TELECOM — Asignaciones
   ============================================================ */

function AsignacionForm({ funcionarios, recursos, empresas, sucursales, departamentos, onCancel, onSaved }) {
  const [funcionarioId, setFuncionarioId] = useState("");
  const [recursosSel, setRecursosSel] = useState([]);
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 10));
  const [responsableEntrega, setResponsableEntrega] = useState(auth.currentUser?.email || "");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  const funcionario = funcionarios.find((f) => f.id === funcionarioId);
  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";
  const sucursalNombre = (id) => sucursales.find((s) => s.id === id)?.nombre || "—";
  const departamentoNombre = (id) => departamentos.find((d) => d.id === id)?.nombre || "—";

  const recursosDisponibles = useMemo(() => {
    const disponibles = recursos.filter((r) => r.estado === "disponible");
    if (funcionario?.empresaId) {
      return disponibles.filter((r) => !r.empresaId || r.empresaId === funcionario.empresaId);
    }
    return disponibles;
  }, [recursos, funcionario]);

  const toggleRecurso = (id) => {
    setRecursosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioId) return alert("Seleccioná el funcionario que recibe los recursos.");
    if (recursosSel.length === 0) return alert("Seleccioná al menos un recurso para entregar.");
    setSaving(true);
    try {
      const recursosSnapshot = recursosSel.map((id) => {
        const r = recursos.find((x) => x.id === id);
        return { id: r.id, codigo: r.codigo, tipo: r.tipo, marca: r.marca || "", modelo: r.modelo || "", numeroSerie: r.numeroSerie || "" };
      });

      const asignacionRef = await db.collection("asignaciones").add({
        funcionarioId,
        funcionarioSnapshot: { nombre: funcionario.nombre, documento: funcionario.documento || "", cargo: funcionario.cargo || "" },
        empresaId: funcionario.empresaId || "",
        empresaSnapshot: empresaNombre(funcionario.empresaId),
        sucursalId: funcionario.sucursalId || "",
        sucursalSnapshot: sucursalNombre(funcionario.sucursalId),
        departamentoId: funcionario.departamentoId || "",
        departamentoSnapshot: departamentoNombre(funcionario.departamentoId),
        fechaEntrega,
        responsableEntrega,
        observaciones,
        recursosIds: recursosSel,
        recursosSnapshot,
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });

      const nuevaAsignacion = {
        id: asignacionRef.id,
        funcionarioId,
        funcionarioSnapshot: { nombre: funcionario.nombre, documento: funcionario.documento || "", cargo: funcionario.cargo || "" },
        empresaId: funcionario.empresaId || "",
        empresaSnapshot: empresaNombre(funcionario.empresaId),
        sucursalId: funcionario.sucursalId || "",
        sucursalSnapshot: sucursalNombre(funcionario.sucursalId),
        departamentoId: funcionario.departamentoId || "",
        departamentoSnapshot: departamentoNombre(funcionario.departamentoId),
        fechaEntrega,
        responsableEntrega,
        observaciones,
        recursosIds: recursosSel,
        recursosSnapshot,
      };

      // Actualiza cada recurso y registra su historial (spec funcional, secciones 5 y 6)
      await Promise.all(recursosSel.map(async (id) => {
        await db.collection("recursos").doc(id).update({
          estado: "asignado",
          responsableId: funcionarioId,
          empresaId: funcionario.empresaId || "",
          sucursalId: funcionario.sucursalId || "",
          departamentoId: funcionario.departamentoId || "",
          actualizadoEn: serverTimestamp(),
        });
        await registrarHistorial(id, {
          tipo: "asignacion",
          detalle: `Asignado a ${funcionario.nombre}${funcionario.cargo ? ` (${funcionario.cargo})` : ""}`,
          usuario: auth.currentUser?.email || "—",
        });
      }));

      onSaved(nuevaAsignacion);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al registrar la asignación.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Funcionario que recibe</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Funcionario</label>
            <select required value={funcionarioId} onChange={(e) => { setFuncionarioId(e.target.value); setRecursosSel([]); }}>
              <option value="">Seleccionar funcionario…</option>
              {funcionarios.filter((f) => f.estado !== "inactivo").map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}{f.cargo ? ` — ${f.cargo}` : ""}</option>
              ))}
            </select>
          </div>
          {funcionario && (
            <div className="form-field full" style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>
              {empresaNombre(funcionario.empresaId)}
              {funcionario.sucursalId ? ` · ${sucursalNombre(funcionario.sucursalId)}` : ""}
              {funcionario.departamentoId ? ` · ${departamentoNombre(funcionario.departamentoId)}` : ""}
            </div>
          )}
          <div className="form-field">
            <label>Fecha de entrega</label>
            <input type="date" required value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Responsable que entrega</label>
            <input required value={responsableEntrega} onChange={(e) => setResponsableEntrega(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-block">
        <div className="form-block-title">Recursos a entregar</div>
        {!funcionarioId && (
          <p className="form-hint" style={{ marginBottom: 8 }}>Elegí primero un funcionario para ver los recursos disponibles de su empresa.</p>
        )}
        <RecursoChecklist recursos={recursosDisponibles} selected={recursosSel} onToggle={toggleRecurso} />
      </div>

      <div className="form-block">
        <div className="form-block-title">Observaciones</div>
        <div className="form-field full">
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Condición de los equipos, accesorios entregados, etc." />
        </div>
      </div>

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar asignación"}</Button>
      </div>
    </form>
  );
}

// ---------- Documento de entrega imprimible (spec funcional, sección 7) ----------
function DocumentoEntrega({ asignacion, onClose }) {
  const handlePrint = () => window.print();

  return (
    <Modal
      title="Documento de entrega"
      onClose={onClose}
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" icon="printer" onClick={handlePrint}>Imprimir</Button>
        </>
      }
    >
      <div className="printable-doc" id="documento-entrega">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <DocumentoLetterhead subtitle="Documento de entrega de recursos" />
          <div style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>
            Fecha: {formatDate(new Date(asignacion.fechaEntrega))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280", width: 140 }}>Funcionario</td>
              <td style={{ padding: "4px 0", fontWeight: 600 }}>{asignacion.funcionarioSnapshot?.nombre}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Documento (CI)</td>
              <td style={{ padding: "4px 0" }}>{asignacion.funcionarioSnapshot?.documento || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Cargo</td>
              <td style={{ padding: "4px 0" }}>{asignacion.funcionarioSnapshot?.cargo || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Empresa</td>
              <td style={{ padding: "4px 0" }}>{asignacion.empresaSnapshot || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Sucursal / Departamento</td>
              <td style={{ padding: "4px 0" }}>{[asignacion.sucursalSnapshot, asignacion.departamentoSnapshot].filter(Boolean).join(" / ") || "—"}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Recursos entregados
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Código</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Tipo</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Marca / Modelo</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>N° de serie</th>
            </tr>
          </thead>
          <tbody>
            {(asignacion.recursosSnapshot || []).map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                <td style={{ padding: "6px 4px" }}>{r.codigo}</td>
                <td style={{ padding: "6px 4px" }}>{r.tipo}</td>
                <td style={{ padding: "6px 4px" }}>{r.marca} {r.modelo}</td>
                <td style={{ padding: "6px 4px" }}>{r.numeroSerie || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Observaciones
        </div>
        <div style={{ minHeight: 40, border: "1px solid #E5E7EB", borderRadius: 6, padding: 10, fontSize: 13, marginBottom: 30 }}>
          {asignacion.observaciones || "—"}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50 }}>
          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12.5 }}>
              Firma del funcionario
            </div>
          </div>
          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12.5 }}>
              Firma del responsable de TI ({asignacion.responsableEntrega})
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Asignaciones() {
  const { data: asignaciones, loading } = useCollection("asignaciones", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: funcionarios } = useCollection("funcionarios");
  const { data: recursos } = useCollection("recursos");
  const { data: empresas } = useCollection("empresas");
  const { data: sucursales } = useCollection("sucursales");
  const { data: departamentos } = useCollection("departamentos");
  const [showForm, setShowForm] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const handleSaved = (nuevaAsignacion) => {
    setShowForm(false);
    setViewingDoc(nuevaAsignacion);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asignaciones</h1>
          <p className="page-subtitle">Entrega de recursos a funcionarios, con documento para firma.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>Nueva asignación</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando asignaciones…" : "Todavía no hay asignaciones registradas."}
        searchPlaceholder="Buscar por funcionario…"
        columns={[
          { key: "fechaEntrega", label: "Fecha", render: (r) => formatDate(new Date(r.fechaEntrega)) },
          { key: "funcionarioSnapshot", label: "Funcionario", render: (r) => r.funcionarioSnapshot?.nombre || "—", searchValue: (r) => r.funcionarioSnapshot?.nombre },
          { key: "empresaSnapshot", label: "Empresa" },
          { key: "recursosSnapshot", label: "Recursos", render: (r) => `${(r.recursosSnapshot || []).length} recurso(s)` },
          { key: "responsableEntrega", label: "Entregado por" },
          {
            key: "acciones",
            label: "",
            sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Ver / imprimir documento" onClick={() => setViewingDoc(row)}><Icon name="file-text" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={asignaciones}
      />

      {showForm && (
        <Modal title="Nueva asignación" onClose={() => setShowForm(false)} width={720}>
          <AsignacionForm
            funcionarios={funcionarios}
            recursos={recursos}
            empresas={empresas}
            sucursales={sucursales}
            departamentos={departamentos}
            onCancel={() => setShowForm(false)}
            onSaved={handleSaved}
          />
        </Modal>
      )}

      {viewingDoc && (
        <DocumentoEntrega asignacion={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
