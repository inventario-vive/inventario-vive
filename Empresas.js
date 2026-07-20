/* ============================================================
   VIVE TELECOM — Empresas (maestro)
   ============================================================ */

function EmpresaForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial || { nombre: "", razonSocial: "", ruc: "", observaciones: "" }
  );
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await db.collection("empresas").doc(initial.id).update({
          ...form,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await db.collection("empresas").add({
          ...form,
          creadoEn: serverTimestamp(),
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar la empresa.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Información general</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Nombre comercial</label>
            <input required value={form.nombre} onChange={setField("nombre")} placeholder="Ej: Vive Telecom" />
          </div>
          <div className="form-field">
            <label>Razón social</label>
            <input value={form.razonSocial} onChange={setField("razonSocial")} placeholder="Ej: Vive Telecom S.A." />
          </div>
          <div className="form-field">
            <label>RUC</label>
            <input value={form.ruc} onChange={setField("ruc")} placeholder="80000000-0" />
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

function Empresas() {
  const { data: empresas, loading } = useCollection("empresas", { orderByField: "nombre" });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (empresa) => { setEditing(empresa); setShowForm(true); };

  const handleDelete = async () => {
    // No se elimina físicamente para no perder trazabilidad; se podría marcar como inactiva.
    await db.collection("empresas").doc(toDelete.id).delete();
    setToDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="page-subtitle">Empresas del grupo a las que pueden asignarse recursos.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nueva empresa</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando empresas…" : "Todavía no hay empresas registradas."}
        searchPlaceholder="Buscar empresa…"
        columns={[
          { key: "nombre", label: "Nombre comercial" },
          { key: "razonSocial", label: "Razón social" },
          { key: "ruc", label: "RUC" },
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
        rows={empresas}
      />

      {showForm && (
        <Modal title={editing ? "Editar empresa" : "Nueva empresa"} onClose={() => setShowForm(false)}>
          <EmpresaForm
            initial={editing}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar empresa"
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
