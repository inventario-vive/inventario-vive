/* ============================================================
   VIVE TELECOM — Transferencias
   ============================================================ */

function TransferenciaForm({ recursos, empresas, sucursales, departamentos, funcionarios, onCancel, onSaved }) {
  const [recursosSel, setRecursosSel] = useState([]);
  const [destinoEmpresaId, setDestinoEmpresaId] = useState("");
  const [destinoSucursalId, setDestinoSucursalId] = useState("");
  const [destinoDepartamentoId, setDestinoDepartamentoId] = useState("");
  const [destinoFuncionarioId, setDestinoFuncionarioId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [responsable, setResponsable] = useState(auth.currentUser?.email || "");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";
  const sucursalNombre = (id) => sucursales.find((s) => s.id === id)?.nombre || "—";
  const departamentoNombre = (id) => departamentos.find((d) => d.id === id)?.nombre || "—";
  const funcionarioNombre = (id) => funcionarios.find((f) => f.id === id)?.nombre || "—";

  // Recursos disponibles para transferir: los que no están dados de baja
  const recursosTransferibles = useMemo(
    () => recursos.filter((r) => r.estado !== "dado_de_baja"),
    [recursos]
  );

  const sucursalesFiltradas = useMemo(
    () => sucursales.filter((s) => !destinoEmpresaId || s.empresaId === destinoEmpresaId),
    [sucursales, destinoEmpresaId]
  );
  const departamentosFiltrados = useMemo(
    () => departamentos.filter((d) => {
      if (destinoSucursalId) return d.sucursalId === destinoSucursalId;
      if (destinoEmpresaId) return d.empresaId === destinoEmpresaId;
      return true;
    }),
    [departamentos, destinoEmpresaId, destinoSucursalId]
  );
  const funcionariosFiltrados = useMemo(
    () => funcionarios.filter((f) => !destinoEmpresaId || f.empresaId === destinoEmpresaId),
    [funcionarios, destinoEmpresaId]
  );

  const toggleRecurso = (id) => {
    setRecursosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (recursosSel.length === 0) return alert("Seleccioná al menos un recurso a transferir.");
    if (!destinoEmpresaId) return alert("Seleccioná la empresa de destino.");
    setSaving(true);
    try {
      const nuevoEstado = destinoFuncionarioId ? "asignado" : "disponible";

      const movimientos = recursosSel.map((id) => {
        const r = recursos.find((x) => x.id === id);
        return {
          id: r.id,
          codigo: r.codigo,
          tipo: r.tipo,
          marca: r.marca || "",
          modelo: r.modelo || "",
          origen: {
            empresa: empresaNombre(r.empresaId),
            sucursal: sucursalNombre(r.sucursalId),
            departamento: departamentoNombre(r.departamentoId),
            responsable: funcionarioNombre(r.responsableId),
          },
        };
      });

      const nuevaTransferencia = {
        id: null,
        recursosIds: recursosSel,
        recursosSnapshot: movimientos,
        destino: {
          empresaId: destinoEmpresaId,
          empresaNombre: empresaNombre(destinoEmpresaId),
          sucursalId: destinoSucursalId,
          sucursalNombre: destinoSucursalId ? sucursalNombre(destinoSucursalId) : "—",
          departamentoId: destinoDepartamentoId,
          departamentoNombre: destinoDepartamentoId ? departamentoNombre(destinoDepartamentoId) : "—",
          funcionarioId: destinoFuncionarioId,
          funcionarioNombre: destinoFuncionarioId ? funcionarioNombre(destinoFuncionarioId) : "—",
        },
        fecha,
        responsable,
        motivo,
      };

      const ref = await db.collection("transferencias").add({
        ...nuevaTransferencia,
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });
      nuevaTransferencia.id = ref.id;

      await Promise.all(recursosSel.map(async (id) => {
        await db.collection("recursos").doc(id).update({
          empresaId: destinoEmpresaId,
          sucursalId: destinoSucursalId,
          departamentoId: destinoDepartamentoId,
          responsableId: destinoFuncionarioId,
          estado: nuevoEstado,
          actualizadoEn: serverTimestamp(),
        });
        const destinoTexto = [
          empresaNombre(destinoEmpresaId),
          destinoSucursalId ? sucursalNombre(destinoSucursalId) : null,
          destinoDepartamentoId ? departamentoNombre(destinoDepartamentoId) : null,
          destinoFuncionarioId ? funcionarioNombre(destinoFuncionarioId) : null,
        ].filter(Boolean).join(" · ");
        await registrarHistorial(id, {
          tipo: "transferencia",
          detalle: `Transferido a ${destinoTexto}`,
          usuario: auth.currentUser?.email || "—",
        });
      }));

      onSaved(nuevaTransferencia);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al registrar la transferencia.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Recursos a transferir</div>
        <RecursoChecklist recursos={recursosTransferibles} selected={recursosSel} onToggle={toggleRecurso} />
      </div>

      <div className="form-block">
        <div className="form-block-title">Destino</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Empresa</label>
            <select required value={destinoEmpresaId} onChange={(e) => { setDestinoEmpresaId(e.target.value); setDestinoSucursalId(""); setDestinoDepartamentoId(""); setDestinoFuncionarioId(""); }}>
              <option value="">Seleccionar empresa…</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Sucursal</label>
            <select value={destinoSucursalId} onChange={(e) => { setDestinoSucursalId(e.target.value); setDestinoDepartamentoId(""); }}>
              <option value="">Sin definir</option>
              {sucursalesFiltradas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Departamento</label>
            <select value={destinoDepartamentoId} onChange={(e) => setDestinoDepartamentoId(e.target.value)}>
              <option value="">Sin definir</option>
              {departamentosFiltrados.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Nuevo responsable (opcional)</label>
            <select value={destinoFuncionarioId} onChange={(e) => setDestinoFuncionarioId(e.target.value)}>
              <option value="">Sin asignar a una persona</option>
              {funcionariosFiltrados.map((f) => <option key={f.id} value={f.id}>{f.nombre}{f.cargo ? ` — ${f.cargo}` : ""}</option>)}
            </select>
            <span className="form-hint">Si elegís un funcionario, el recurso queda como "Asignado". Si no, queda "Disponible" en el nuevo destino.</span>
          </div>
        </div>
      </div>

      <div className="form-block">
        <div className="form-block-title">Datos de la transferencia</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Fecha</label>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Responsable de la transferencia</label>
            <input required value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </div>
          <div className="form-field full">
            <label>Motivo / Observaciones</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar transferencia"}</Button>
      </div>
    </form>
  );
}

function DocumentoTransferencia({ transferencia, onClose }) {
  return (
    <Modal
      title="Documento de transferencia"
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
          <DocumentoLetterhead subtitle="Documento de transferencia de recursos" />
          <div style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>
            Fecha: {formatDate(new Date(transferencia.fecha))}
          </div>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Destino
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280", width: 140 }}>Empresa</td>
              <td style={{ padding: "4px 0", fontWeight: 600 }}>{transferencia.destino?.empresaNombre}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Sucursal</td>
              <td style={{ padding: "4px 0" }}>{transferencia.destino?.sucursalNombre}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Departamento</td>
              <td style={{ padding: "4px 0" }}>{transferencia.destino?.departamentoNombre}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#6B7280" }}>Nuevo responsable</td>
              <td style={{ padding: "4px 0" }}>{transferencia.destino?.funcionarioNombre}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Recursos transferidos (origen → destino)
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Código</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Tipo</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Origen</th>
            </tr>
          </thead>
          <tbody>
            {(transferencia.recursosSnapshot || []).map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                <td style={{ padding: "6px 4px" }}>{r.codigo}</td>
                <td style={{ padding: "6px 4px" }}>{r.tipo}</td>
                <td style={{ padding: "6px 4px" }}>
                  {[r.origen?.empresa, r.origen?.sucursal !== "—" ? r.origen?.sucursal : null, r.origen?.responsable !== "—" ? r.origen?.responsable : null].filter(Boolean).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 6 }}>
          Motivo / Observaciones
        </div>
        <div style={{ minHeight: 40, border: "1px solid #E5E7EB", borderRadius: 6, padding: 10, fontSize: 13, marginBottom: 30 }}>
          {transferencia.motivo || "—"}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
          <div style={{ textAlign: "center", width: "55%" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12.5 }}>
              Firma del responsable de la transferencia ({transferencia.responsable})
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Transferencias() {
  const { data: transferencias, loading } = useCollection("transferencias", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: recursos } = useCollection("recursos");
  const { data: empresas } = useCollection("empresas");
  const { data: sucursales } = useCollection("sucursales");
  const { data: departamentos } = useCollection("departamentos");
  const { data: funcionarios } = useCollection("funcionarios");
  const [showForm, setShowForm] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transferencias</h1>
          <p className="page-subtitle">Movimiento de recursos entre funcionarios, departamentos, sucursales o empresas.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>Nueva transferencia</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando transferencias…" : "Todavía no hay transferencias registradas."}
        searchPlaceholder="Buscar por destino…"
        columns={[
          { key: "fecha", label: "Fecha", render: (r) => formatDate(new Date(r.fecha)) },
          { key: "recursosSnapshot", label: "Recursos", render: (r) => `${(r.recursosSnapshot || []).length} recurso(s)` },
          { key: "destinoEmpresa", label: "Empresa destino", render: (r) => r.destino?.empresaNombre || "—", searchValue: (r) => r.destino?.empresaNombre },
          { key: "destinoFuncionario", label: "Nuevo responsable", render: (r) => r.destino?.funcionarioNombre || "—" },
          { key: "responsable", label: "Registrado por" },
          {
            key: "acciones", label: "", sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Ver / imprimir documento" onClick={() => setViewingDoc(row)}><Icon name="file-text" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={transferencias}
      />

      {showForm && (
        <Modal title="Nueva transferencia" onClose={() => setShowForm(false)} width={720}>
          <TransferenciaForm
            recursos={recursos}
            empresas={empresas}
            sucursales={sucursales}
            departamentos={departamentos}
            funcionarios={funcionarios}
            onCancel={() => setShowForm(false)}
            onSaved={(t) => { setShowForm(false); setViewingDoc(t); }}
          />
        </Modal>
      )}

      {viewingDoc && <DocumentoTransferencia transferencia={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
