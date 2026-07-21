/* ============================================================
   VIVE TELECOM — Bajas
   ============================================================ */

const MOTIVOS_BAJA = [
  "Obsolescencia tecnológica",
  "Daño irreparable",
  "Robo o pérdida",
  "Fin de vida útil",
  "Venta o donación",
  "Otro",
];

function BajaForm({ recursos, onCancel, onSaved }) {
  const [recursosSel, setRecursosSel] = useState([]);
  const [motivo, setMotivo] = useState(MOTIVOS_BAJA[0]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [responsable, setResponsable] = useState(auth.currentUser?.email || "");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  const recursosElegibles = useMemo(
    () => recursos.filter((r) => r.estado !== "dado_de_baja"),
    [recursos]
  );

  const toggleRecurso = (id) => {
    setRecursosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (recursosSel.length === 0) return alert("Seleccioná al menos un recurso a dar de baja.");
    setSaving(true);
    try {
      const recursosSnapshot = recursosSel.map((id) => {
        const r = recursos.find((x) => x.id === id);
        return { id: r.id, codigo: r.codigo, tipo: r.tipo, marca: r.marca || "", modelo: r.modelo || "" };
      });

      await db.collection("bajas").add({
        recursosIds: recursosSel,
        recursosSnapshot,
        motivo,
        fecha,
        responsable,
        observaciones,
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || "—",
      });

      // El recurso nunca se elimina: cambia a estado "Dado de baja" preservando su historial (spec funcional, sección 10)
      await Promise.all(recursosSel.map(async (id) => {
        await db.collection("recursos").doc(id).update({
          estado: "dado_de_baja",
          responsableId: "",
          actualizadoEn: serverTimestamp(),
        });
        await registrarHistorial(id, {
          tipo: "baja",
          detalle: `Dado de baja — Motivo: ${motivo}${observaciones ? ` (${observaciones})` : ""}`,
          usuario: auth.currentUser?.email || "—",
        });
      }));

      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al registrar la baja.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Recursos a dar de baja</div>
        <RecursoChecklist recursos={recursosElegibles} selected={recursosSel} onToggle={toggleRecurso} />
      </div>

      <div className="form-block">
        <div className="form-block-title">Datos de la baja</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Motivo</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS_BAJA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Fecha</label>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="form-field full">
            <label>Responsable</label>
            <input required value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </div>
          <div className="form-field full">
            <label>Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" type="submit" disabled={saving}>
          {saving ? "Registrando…" : "Confirmar baja definitiva"}
        </Button>
      </div>
    </form>
  );
}

function Bajas() {
  const { data: bajas, loading } = useCollection("bajas", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: recursos } = useCollection("recursos");
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bajas</h1>
          <p className="page-subtitle">Retiro definitivo de recursos del inventario activo. El historial nunca se pierde.</p>
        </div>
        <Button variant="danger" icon="trash-2" onClick={() => setShowForm(true)}>Nueva baja</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando bajas…" : "Todavía no hay bajas registradas."}
        searchPlaceholder="Buscar por motivo…"
        columns={[
          { key: "fecha", label: "Fecha", render: (r) => formatDate(new Date(r.fecha)) },
          { key: "recursosSnapshot", label: "Recursos", render: (r) => `${(r.recursosSnapshot || []).length} recurso(s)` },
          { key: "motivo", label: "Motivo" },
          { key: "responsable", label: "Responsable" },
        ]}
        rows={bajas}
      />

      {showForm && (
        <Modal title="Registrar baja" onClose={() => setShowForm(false)} width={680}>
          <BajaForm recursos={recursos} onCancel={() => setShowForm(false)} onSaved={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
