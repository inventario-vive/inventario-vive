/* ============================================================
   VIVE TELECOM — Mantenimiento
   ============================================================ */

const TIPOS_MANTENIMIENTO = [
  { value: "mantenimiento", label: "Mantenimiento preventivo", estadoRecurso: "en_mantenimiento" },
  { value: "reparacion", label: "Reparación", estadoRecurso: "en_reparacion" },
];

const RESULTADOS_MANTENIMIENTO = [
  { value: "reparado_operativo", label: "Reparado / finalizado — vuelve a operar" },
  { value: "no_reparable", label: "No reparable — dar de baja" },
  { value: "continua", label: "Continúa en mantenimiento (actualizar observaciones)" },
];

function MantenimientoForm({ recursos, onCancel, onSaved }) {
  const [recursoId, setRecursoId] = useState("");
  const [tipo, setTipo] = useState("mantenimiento");
  const [motivo, setMotivo] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFinEstimada, setFechaFinEstimada] = useState("");
  const [saving, setSaving] = useState(false);

  const recursosElegibles = useMemo(
    () => recursos.filter((r) => r.estado !== "dado_de_baja" && r.estado !== "en_mantenimiento" && r.estado !== "en_reparacion"),
    [recursos]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recursoId) return alert("Seleccioná el recurso.");
    setSaving(true);
    try {
      const recurso = recursos.find((r) => r.id === recursoId);
      const tipoInfo = TIPOS_MANTENIMIENTO.find((t) => t.value === tipo);

      const ref = await db.collection("mantenimientos").add({
        recursoId,
        recursoSnapshot: { codigo: recurso.codigo, tipo: recurso.tipo, marca: recurso.marca || "", modelo: recurso.modelo || "" },
        tipo,
        motivo,
        proveedor,
        fechaInicio,
        fechaFinEstimada,
        estado: "en_curso",
        // se guarda el estado y responsable previos para poder restaurarlos al finalizar
        estadoPrevio: recurso.estado,
        responsablePrevioId: recurso.responsableId || "",
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });

      await db.collection("recursos").doc(recursoId).update({
        estado: tipoInfo.estadoRecurso,
        actualizadoEn: serverTimestamp(),
      });
      await registrarHistorial(recursoId, {
        tipo: "mantenimiento",
        detalle: `Enviado a ${tipoInfo.label.toLowerCase()}${motivo ? `: ${motivo}` : ""}`,
        usuario: auth.currentUser?.email || "—",
      });

      onSaved(ref.id);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al registrar el mantenimiento.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Recurso</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Recurso</label>
            <select required value={recursoId} onChange={(e) => setRecursoId(e.target.value)}>
              <option value="">Seleccionar recurso…</option>
              {recursosElegibles.map((r) => (
                <option key={r.id} value={r.id}>{r.codigo} — {r.tipo} {r.marca} {r.modelo}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_MANTENIMIENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Proveedor / técnico responsable</label>
            <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Fecha de inicio</label>
            <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Fecha estimada de finalización</label>
            <input type="date" value={fechaFinEstimada} onChange={(e) => setFechaFinEstimada(e.target.value)} />
          </div>
          <div className="form-field full">
            <label>Motivo / falla reportada</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Registrando…" : "Enviar a mantenimiento"}</Button>
      </div>
    </form>
  );
}

function FinalizarMantenimientoForm({ registro, onCancel, onSaved }) {
  const [resultado, setResultado] = useState("reparado_operativo");
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateMantenimiento = { observaciones };

      if (resultado === "continua") {
        updateMantenimiento.observaciones = observaciones;
        await db.collection("mantenimientos").doc(registro.id).update(updateMantenimiento);
        await registrarHistorial(registro.recursoId, {
          tipo: "mantenimiento",
          detalle: `Actualización de mantenimiento en curso: ${observaciones || "sin novedades"}`,
          usuario: auth.currentUser?.email || "—",
        });
      } else {
        updateMantenimiento.estado = "finalizado";
        updateMantenimiento.resultado = resultado;
        updateMantenimiento.fechaFin = fechaFin;
        await db.collection("mantenimientos").doc(registro.id).update(updateMantenimiento);

        let nuevoEstado;
        let limpiarResponsable = false;
        if (resultado === "reparado_operativo") {
          nuevoEstado = registro.responsablePrevioId ? "asignado" : "disponible";
        } else {
          nuevoEstado = "dado_de_baja";
          limpiarResponsable = true;
        }

        const updateRecurso = { estado: nuevoEstado, actualizadoEn: serverTimestamp() };
        if (limpiarResponsable) updateRecurso.responsableId = "";

        await db.collection("recursos").doc(registro.recursoId).update(updateRecurso);
        await registrarHistorial(registro.recursoId, {
          tipo: "mantenimiento",
          detalle: resultado === "reparado_operativo"
            ? `Mantenimiento finalizado — recurso vuelve a estado "${estadoLabel(nuevoEstado)}"`
            : `Mantenimiento finalizado — recurso no reparable, dado de baja`,
          usuario: auth.currentUser?.email || "—",
        });
      }

      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al finalizar el mantenimiento.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-grid">
          <div className="form-field full">
            <label>Resultado</label>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)}>
              {RESULTADOS_MANTENIMIENTO.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {resultado !== "continua" && (
            <div className="form-field full">
              <label>Fecha de finalización</label>
              <input type="date" required value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          )}
          <div className="form-field full">
            <label>Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
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

function Mantenimiento() {
  const { data: registros, loading } = useCollection("mantenimientos", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: recursos } = useCollection("recursos");
  const [showForm, setShowForm] = useState(false);
  const [finalizing, setFinalizing] = useState(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mantenimiento</h1>
          <p className="page-subtitle">Recursos enviados a mantenimiento preventivo o reparación.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>Enviar a mantenimiento</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando registros…" : "Todavía no hay registros de mantenimiento."}
        searchPlaceholder="Buscar por recurso…"
        columns={[
          { key: "fechaInicio", label: "Inicio", render: (r) => formatDate(new Date(r.fechaInicio)) },
          { key: "recursoSnapshot", label: "Recurso", render: (r) => r.recursoSnapshot?.codigo, searchValue: (r) => r.recursoSnapshot?.codigo },
          { key: "tipo", label: "Tipo", render: (r) => TIPOS_MANTENIMIENTO.find((t) => t.value === r.tipo)?.label || r.tipo },
          { key: "proveedor", label: "Proveedor / técnico" },
          {
            key: "estado", label: "Estado",
            render: (r) => r.estado === "en_curso"
              ? <span className="badge badge-en_mantenimiento">En curso</span>
              : <span className={`badge ${r.resultado === "no_reparable" ? "badge-dado_de_baja" : "badge-disponible"}`}>
                  {r.resultado === "no_reparable" ? "No reparable" : "Finalizado"}
                </span>,
          },
          {
            key: "acciones", label: "", sortable: false,
            render: (row) => (
              <div className="row-actions">
                {row.estado === "en_curso" && (
                  <span className="icon-btn" title="Finalizar" onClick={() => setFinalizing(row)}><Icon name="check" size={15} /></span>
                )}
              </div>
            ),
          },
        ]}
        rows={registros}
      />

      {showForm && (
        <Modal title="Enviar recurso a mantenimiento" onClose={() => setShowForm(false)} width={680}>
          <MantenimientoForm recursos={recursos} onCancel={() => setShowForm(false)} onSaved={() => setShowForm(false)} />
        </Modal>
      )}

      {finalizing && (
        <Modal title={`Finalizar mantenimiento — ${finalizing.recursoSnapshot?.codigo}`} onClose={() => setFinalizing(null)}>
          <FinalizarMantenimientoForm registro={finalizing} onCancel={() => setFinalizing(null)} onSaved={() => setFinalizing(null)} />
        </Modal>
      )}
    </div>
  );
}
