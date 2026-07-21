/* ============================================================
   VIVE TELECOM — Funcionarios (maestro)
   ============================================================ */

function FuncionarioForm({ initial, empresas, sucursales, departamentos, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial || {
      nombre: "",
      documento: "",
      cargo: "",
      email: "",
      telefono: "",
      empresaId: "",
      sucursalId: "",
      departamentoId: "",
      estado: "activo",
      observaciones: "",
    }
  );
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => {
    const value = e.target.value;
    if (field === "empresaId") {
      const sucursalValida = sucursales.find((s) => s.id === form.sucursalId && s.empresaId === value);
      const depValido = departamentos.find((d) => d.id === form.departamentoId && d.empresaId === value);
      setForm({
        ...form,
        empresaId: value,
        sucursalId: sucursalValida ? form.sucursalId : "",
        departamentoId: depValido ? form.departamentoId : "",
      });
    } else if (field === "sucursalId") {
      const depValido = departamentos.find((d) => d.id === form.departamentoId && d.sucursalId === value);
      setForm({ ...form, sucursalId: value, departamentoId: depValido ? form.departamentoId : "" });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const sucursalesFiltradas = useMemo(
    () => sucursales.filter((s) => !form.empresaId || s.empresaId === form.empresaId),
    [sucursales, form.empresaId]
  );
  const departamentosFiltrados = useMemo(
    () => departamentos.filter((d) => {
      if (form.sucursalId) return d.sucursalId === form.sucursalId;
      if (form.empresaId) return d.empresaId === form.empresaId;
      return true;
    }),
    [departamentos, form.empresaId, form.sucursalId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await db.collection("funcionarios").doc(initial.id).update({
          ...form,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await db.collection("funcionarios").add({
          ...form,
          creadoEn: serverTimestamp(),
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar el funcionario.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Información personal</div>
        <div className="form-grid">
          <div className="form-field full">
            <label>Nombre completo</label>
            <input required value={form.nombre} onChange={setField("nombre")} />
          </div>
          <div className="form-field">
            <label>Documento (CI)</label>
            <input value={form.documento} onChange={setField("documento")} />
          </div>
          <div className="form-field">
            <label>Cargo</label>
            <input value={form.cargo} onChange={setField("cargo")} placeholder="Ej: Analista de Sistemas" />
          </div>
          <div className="form-field">
            <label>Correo electrónico</label>
            <input type="email" value={form.email} onChange={setField("email")} />
          </div>
          <div className="form-field">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={setField("telefono")} />
          </div>
        </div>
      </div>

      <div className="form-block">
        <div className="form-block-title">Ubicación organizacional</div>
        <div className="form-grid">
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
          </div>
          <div className="form-field">
            <label>Departamento</label>
            <select value={form.departamentoId} onChange={setField("departamentoId")}>
              <option value="">Sin definir</option>
              {departamentosFiltrados.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Estado</label>
            <select value={form.estado} onChange={setField("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
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

function Funcionarios() {
  const { data: funcionarios, loading } = useCollection("funcionarios", { orderByField: "nombre" });
  const { data: empresas } = useCollection("empresas");
  const { data: sucursales } = useCollection("sucursales");
  const { data: departamentos } = useCollection("departamentos");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";
  const departamentoNombre = (id) => departamentos.find((d) => d.id === id)?.nombre || "—";

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (row) => { setEditing(row); setShowForm(true); };

  const handleDelete = async () => {
    await db.collection("funcionarios").doc(toDelete.id).delete();
    setToDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Funcionarios</h1>
          <p className="page-subtitle">Personas a quienes pueden asignarse recursos de la empresa.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nuevo funcionario</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando funcionarios…" : "Todavía no hay funcionarios registrados."}
        searchPlaceholder="Buscar por nombre, documento, cargo…"
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "documento", label: "Documento" },
          { key: "cargo", label: "Cargo" },
          { key: "empresaId", label: "Empresa", render: (r) => empresaNombre(r.empresaId), searchValue: (r) => empresaNombre(r.empresaId) },
          { key: "departamentoId", label: "Departamento", render: (r) => departamentoNombre(r.departamentoId), searchValue: (r) => departamentoNombre(r.departamentoId) },
          {
            key: "estado", label: "Estado",
            render: (r) => (
              <span className={`badge ${r.estado === "activo" ? "badge-disponible" : "badge-dado_de_baja"}`}>
                {r.estado === "activo" ? "Activo" : "Inactivo"}
              </span>
            ),
          },
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
        rows={funcionarios}
      />

      {showForm && (
        <Modal title={editing ? "Editar funcionario" : "Nuevo funcionario"} onClose={() => setShowForm(false)} width={680}>
          <FuncionarioForm
            initial={editing}
            empresas={empresas}
            sucursales={sucursales}
            departamentos={departamentos}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar funcionario"
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
