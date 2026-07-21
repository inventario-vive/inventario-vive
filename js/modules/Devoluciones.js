/* ============================================================
   VIVE TELECOM — Devoluciones
   ============================================================ */

const ESTADOS_POST_DEVOLUCION = [
  { value: "disponible", label: "Disponible" },
  { value: "en_reparacion", label: "En reparación" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "dado_de_baja", label: "Dado de baja" },
];

function DevolucionForm({ funcionarios, recursos, empresas, onCancel, onSaved }) {
  const [funcionarioId, setFuncionarioId] = useState("");
  const [recursosSel, setRecursosSel] = useState([]);
  const [estadoRecurso, setEstadoRecurso] = useState("disponible");
  const [fechaDevolucion, setFechaDevolucion] = useState(new Date().toISOString().slice(0, 10));
  const [responsableRecibe, setResponsableRecibe] = useState(auth.currentUser?.email || "");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  const funcionario = funcionarios.find((f) => f.id === funcionarioId);
  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";

  const recursosDelFuncionario = useMemo(
    () => recursos.filter((r) => r.responsableId === funcionarioId && r.estado === "asignado"),
    [recursos, funcionarioId]
  );

  const toggleRecurso = (id) => {
    setRecursosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioId) return alert("Seleccioná el funcionario que devuelve los recursos.");
    if (recursosSel.length === 0) return alert("Seleccioná al menos un recurso a devolver.");
    setSaving(true);
    try {
      const recursosSnapshot = recursosSel.map((id) => {
        const r = recursos.find((x) => x.id === id);
        return { id: r.id, codigo: r.codigo, tipo: r.tipo, marca: r.marca || "", modelo: r.modelo || "", numeroSerie: r.numeroSerie || "" };
      });

      const nuevaDevolucion = {
        id: null,
        funcionarioId,
        funcionarioSnapshot: { nombre: funcionario.nombre, documento: funcionario.documento || "", cargo: funcionario.cargo || "" },
        empresaSnapshot: empresaNombre(funcionario.empresaId),
        fechaDevolucion,
        estadoRecurso,
        responsableRecibe,
        observaciones,
        recursosIds: recursosSel,
        recursosSnapshot,
      };

      const ref = await db.collection("devoluciones").add({
        ...nuevaDevolucion,
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });
      nuevaDevolucion.id = ref.id;

      await Promise.all(recursosSel.map(async (id) => {
        await db.collection("recursos").doc(id).update({
          estado: estadoRecurso,
          responsableId: "",
          actualizadoEn: serverTimestamp(),
        });
        await registrarHistorial(id, {
          tipo: "devolucion",
          detalle: `Devuelto por ${funcionario.nombre} · Nuevo estado: ${estadoLabel(estadoRecurso)}`,
          usuario: auth.currentUser?.email || "—",
        });
      }));

      onSaved(nuevaDevolucion);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al registrar la devolución.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Funcionario que devuelve</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Funcionario</label>
            <select required value={funcionarioId} onChange={(e) => { setFuncionarioId(e.target.value); setRecursosSel([]); }}>
              <option value="">Seleccionar funcionario…</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}{f.cargo ? ` — ${f.cargo}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Fecha de devolución</label>
            <input type="date" required value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Responsable que recibe</label>
            <input required value={responsableRecibe} onChange={(e) => setResponsableRecibe(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-block">
        <div className="form-block-title">Recursos a devolver</div>
        {!funcionarioId && (
          <p className="form-hint" style={{ marginBottom: 8 }}>Elegí primero un funcionario para ver los recursos que tiene asignados.</p>
        )}
        <RecursoChecklist
          recursos={recursosDelFuncionario}
          selected={recursosSel}
          onToggle={toggleRecurso}
          emptyLabel="Este funcionario no tiene recursos asignados actualmente."
        />
      </div>

      <div className="form-block">
        <div className="form-block-title">Estado al momento de la devolución</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Estado del recurso</label>
            <select value={estadoRecurso} onChange={(e) => setEstadoRecurso(e.target.value)}>
              {ESTADOS_POST_DEVOLUCION.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <span className="form-hint">Se aplicará a todos los recursos seleccionados. Si necesitás estados distintos por recurso, hacé devoluciones separadas.</span>
          </div>
          <div className="form-field full">
            <label>Observaciones (conformidad de ambas partes)</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Condición física, accesorios devueltos, daños observados, etc." />
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar devolución"}</Button>
      </div>
    </form>
  );
}

function DocumentoDevolucion({ devolucion, onClose }) {
  return (
    <Modal
      title="Documento de devolución"
      onClose={onClose}
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" icon="printer" onClick={() => window.print()}>Imprimir</Button>
        </>
      }
    >
      <div className="printable-doc">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <DocumentoLetterhead subtitle="Documento de devolución de recursos" />
          <div style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>
            Fecha: {formatDate(new Date(devolucion.fechaDevolucion))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280", width: 140 }}>Funcionario</td>
              <td style={{ padding: "4px 0", fontWeight: 600 }}>{devolucion.funcionarioSnapshot?.nombre}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Cargo</td>
              <td style={{ padding: "4px 0" }}>{devolucion.funcionarioSnapshot?.cargo || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Empresa</td>
              <td style={{ padding: "4px 0" }}>{devolucion.empresaSnapshot || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Estado asignado tras devolución</td>
              <td style={{ padding: "4px 0" }}>{estadoLabel(devolucion.estadoRecurso)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Recursos devueltos
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
            {(devolucion.recursosSnapshot || []).map((r) => (
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
          {devolucion.observaciones || "—"}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50 }}>
          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12.5 }}>
              Firma del funcionario
            </div>
          </div>
          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12.5 }}>
              Firma del responsable que recibe ({devolucion.responsableRecibe})
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Devoluciones() {
  const { data: devoluciones, loading } = useCollection("devoluciones", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: funcionarios } = useCollection("funcionarios");
  const { data: recursos } = useCollection("recursos");
  const { data: empresas } = useCollection("empresas");
  const [showForm, setShowForm] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Devoluciones</h1>
          <p className="page-subtitle">Registro de recursos que un funcionario deja de utilizar.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>Nueva devolución</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando devoluciones…" : "Todavía no hay devoluciones registradas."}
        searchPlaceholder="Buscar por funcionario…"
        columns={[
          { key: "fechaDevolucion", label: "Fecha", render: (r) => formatDate(new Date(r.fechaDevolucion)) },
          { key: "funcionarioSnapshot", label: "Funcionario", render: (r) => r.funcionarioSnapshot?.nombre || "—", searchValue: (r) => r.funcionarioSnapshot?.nombre },
          { key: "empresaSnapshot", label: "Empresa" },
          { key: "recursosSnapshot", label: "Recursos", render: (r) => `${(r.recursosSnapshot || []).length} recurso(s)` },
          { key: "estadoRecurso", label: "Estado resultante", render: (r) => <EstadoBadge estado={r.estadoRecurso} /> },
          {
            key: "acciones", label: "", sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Ver / imprimir documento" onClick={() => setViewingDoc(row)}><Icon name="file-text" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={devoluciones}
      />

      {showForm && (
        <Modal title="Nueva devolución" onClose={() => setShowForm(false)} width={720}>
          <DevolucionForm
            funcionarios={funcionarios}
            recursos={recursos}
            empresas={empresas}
            onCancel={() => setShowForm(false)}
            onSaved={(d) => { setShowForm(false); setViewingDoc(d); }}
          />
        </Modal>
      )}

      {viewingDoc && <DocumentoDevolucion devolucion={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
