/* ============================================================
   VIVE TELECOM — Departamentos (maestro)
   ============================================================ */

function DepartamentoForm({ initial, empresas, sucursales, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial || { nombre: "", empresaId: "", sucursalId: "", observaciones: "" }
  );
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => {
    const value = e.target.value;
    if (field === "empresaId") {
      // Al cambiar de empresa, se limpia la sucursal si ya no corresponde
      const sucursalValida = sucursales.find((s) => s.id === form.sucursalId && s.empresaId === value);
      setForm({ ...form, empresaId: value, sucursalId: sucursalValida ? form.sucursalId : "" });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const sucursalesFiltradas = useMemo(
    () => sucursales.filter((s) => !form.empresaId || s.empresaId === form.empresaId),
    [sucursales, form.empresaId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await db.collection("departamentos").doc(initial.id).update({
          ...form,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await db.collection("departamentos").add({
          ...form,
          creadoEn: serverTimestamp(),
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar el departamento.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Información general</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Nombre del departamento</label>
            <input required value={form.nombre} onChange={setField("nombre")} placeholder="Ej: Sistemas, Recursos Humanos" />
          </div>
          <div className="form-field">
            <label>Empresa</label>
            <select required value={form.empresaId} onChange={setField("empresaId")}>
              <option value="">Seleccionar empresa…</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Sucursal</label>
            <select value={form.sucursalId} onChange={setField("sucursalId")}>
              <option value="">Sin definir</option>
              {sucursalesFiltradas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {!form.empresaId && <span className="form-hint">Elegí primero una empresa para filtrar sus sucursales.</span>}
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

function Departamentos() {
  const { data: departamentos, loading } = useCollection("departamentos", { orderByField: "nombre" });
  const { data: empresas } = useCollection("empresas");
  const { data: sucursales } = useCollection("sucursales");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";
  const sucursalNombre = (id) => sucursales.find((s) => s.id === id)?.nombre || "—";

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (row) => { setEditing(row); setShowForm(true); };

  const handleDelete = async () => {
    await db.collection("departamentos").doc(toDelete.id).delete();
    setToDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departamentos</h1>
          <p className="page-subtitle">Departamentos dentro de cada empresa y sucursal.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nuevo departamento</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando departamentos…" : "Todavía no hay departamentos registrados."}
        searchPlaceholder="Buscar departamento…"
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "empresaId", label: "Empresa", render: (r) => empresaNombre(r.empresaId), searchValue: (r) => empresaNombre(r.empresaId) },
          { key: "sucursalId", label: "Sucursal", render: (r) => sucursalNombre(r.sucursalId), searchValue: (r) => sucursalNombre(r.sucursalId) },
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
        rows={departamentos}
      />

      {showForm && (
        <Modal title={editing ? "Editar departamento" : "Nuevo departamento"} onClose={() => setShowForm(false)}>
          <DepartamentoForm
            initial={editing}
            empresas={empresas}
            sucursales={sucursales}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar departamento"
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
