/* ============================================================
   VIVE TELECOM — Sucursales (maestro)
   ============================================================ */

function SucursalForm({ initial, empresas, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial || { nombre: "", empresaId: "", direccion: "", telefono: "", observaciones: "" }
  );
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await db.collection("sucursales").doc(initial.id).update({
          ...form,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await db.collection("sucursales").add({
          ...form,
          creadoEn: serverTimestamp(),
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar la sucursal.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Información general</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Nombre de la sucursal</label>
            <input required value={form.nombre} onChange={setField("nombre")} placeholder="Ej: Casa Matriz, Sucursal Norte" />
          </div>
          <div className="form-field full">
            <label>Empresa</label>
            <select required value={form.empresaId} onChange={setField("empresaId")}>
              <option value="">Seleccionar empresa…</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="form-field full">
            <label>Dirección</label>
            <input value={form.direccion} onChange={setField("direccion")} />
          </div>
          <div className="form-field">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={setField("telefono")} />
          </div>
          <div className="form-field full">
            <label>Observaciones</label>
            <textarea value={form.observaciones} onChange={setField("observaciones")} />
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

function Sucursales() {
  const { data: sucursales, loading } = useCollection("sucursales", { orderByField: "nombre" });
  const { data: empresas } = useCollection("empresas");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (row) => { setEditing(row); setShowForm(true); };

  const handleDelete = async () => {
    await db.collection("sucursales").doc(toDelete.id).delete();
    setToDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sucursales</h1>
          <p className="page-subtitle">Sucursales de cada empresa a las que pueden asignarse recursos.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nueva sucursal</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando sucursales…" : "Todavía no hay sucursales registradas."}
        searchPlaceholder="Buscar sucursal…"
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "empresaId", label: "Empresa", render: (r) => empresaNombre(r.empresaId), searchValue: (r) => empresaNombre(r.empresaId) },
          { key: "direccion", label: "Dirección" },
          { key: "telefono", label: "Teléfono" },
          {
            key: "acciones",
            label: "",
            sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Editar" onClick={() => openEdit(row)}><Icon name="pencil" size={15} /></span>
                <span className="icon-btn" title="Eliminar" onClick={() => setToDelete(row)}><Icon name="trash-2" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={sucursales}
      />

      {showForm && (
        <Modal title={editing ? "Editar sucursal" : "Nueva sucursal"} onClose={() => setShowForm(false)}>
          <SucursalForm
            initial={editing}
            empresas={empresas}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar sucursal"
          message={`¿Confirma que desea eliminar "${toDelete.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
