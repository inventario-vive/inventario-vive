/* ============================================================
   VIVE TELECOM — Recursos
   ============================================================ */

const TIPOS_RECURSO = [
  "Computadora", "Notebook", "Monitor", "Impresora", "Router", "Switch",
  "Access Point", "Cámara CCTV", "DVR/NVR", "Servidor", "Teléfono IP",
  "Celular", "Tablet", "Línea telefónica", "Correo electrónico",
  "Licencia de software", "Equipo especial",
];

// Atributos propios de cada tipo de recurso (además de Marca/Modelo, que ya
// son campos base para todo hardware). Se guardan en el campo "atributos"
// del recurso. Para agregar o modificar atributos de un tipo, alcanza con
// editar este mapa — no hace falta tocar el resto del formulario.
const TIPO_ATRIBUTOS = {
  "Computadora": [
    { key: "procesador", label: "Procesador", type: "text" },
    { key: "ram", label: "Memoria RAM", type: "text" },
    { key: "almacenamiento", label: "Almacenamiento", type: "text" },
    { key: "sistemaOperativo", label: "Sistema operativo", type: "text" },
  ],
  "Notebook": [
    { key: "procesador", label: "Procesador", type: "text" },
    { key: "ram", label: "Memoria RAM", type: "text" },
    { key: "almacenamiento", label: "Almacenamiento", type: "text" },
    { key: "sistemaOperativo", label: "Sistema operativo", type: "text" },
  ],
  "Monitor": [
    { key: "tamano", label: "Tamaño (pulgadas)", type: "text" },
    { key: "resolucion", label: "Resolución", type: "text" },
    { key: "voltaje", label: "Voltaje", type: "select", options: ["110V", "220V", "Bivolt"] },
  ],
  "Impresora": [
    { key: "tipoImpresion", label: "Tipo", type: "select", options: ["Láser", "Inkjet", "Matriz de punto"] },
    { key: "conexion", label: "Conexión", type: "select", options: ["USB", "Red", "WiFi"] },
    { key: "color", label: "Color", type: "select", options: ["Color", "Monocromática"] },
  ],
  "Router": [
    { key: "puertos", label: "Cantidad de puertos", type: "number" },
    { key: "ipGestion", label: "IP de gestión", type: "text" },
  ],
  "Switch": [
    { key: "puertos", label: "Cantidad de puertos", type: "number" },
    { key: "ipGestion", label: "IP de gestión", type: "text" },
  ],
  "Access Point": [
    { key: "puertos", label: "Cantidad de puertos", type: "number" },
    { key: "ipGestion", label: "IP de gestión", type: "text" },
  ],
  "Cámara CCTV": [
    { key: "resolucion", label: "Resolución", type: "text" },
    { key: "canales", label: "Canales", type: "number" },
    { key: "almacenamiento", label: "Almacenamiento", type: "text" },
  ],
  "DVR/NVR": [
    { key: "resolucion", label: "Resolución", type: "text" },
    { key: "canales", label: "Canales", type: "number" },
    { key: "almacenamiento", label: "Almacenamiento", type: "text" },
  ],
  "Servidor": [
    { key: "procesador", label: "Procesador", type: "text" },
    { key: "ram", label: "Memoria RAM", type: "text" },
    { key: "almacenamiento", label: "Almacenamiento", type: "text" },
    { key: "rolServidor", label: "Rol del servidor", type: "text" },
  ],
  "Teléfono IP": [
    { key: "extension", label: "Extensión", type: "text" },
  ],
  "Celular": [
    { key: "imei", label: "IMEI", type: "text" },
    { key: "sistemaOperativo", label: "Sistema operativo", type: "text" },
    { key: "numeroLinea", label: "Número de línea asociado", type: "text" },
  ],
  "Tablet": [
    { key: "imei", label: "IMEI (si tiene datos)", type: "text" },
    { key: "sistemaOperativo", label: "Sistema operativo", type: "text" },
  ],
  "Línea telefónica": [
    { key: "operador", label: "Operador", type: "text" },
    { key: "plan", label: "Plan", type: "text" },
    { key: "tipoSim", label: "Tipo", type: "select", options: ["SIM", "eSIM"] },
    { key: "numero", label: "Número", type: "text" },
  ],
  "Correo electrónico": [
    { key: "dominio", label: "Dominio", type: "text" },
    { key: "tipoLicencia", label: "Tipo de licencia", type: "select", options: ["Buzón", "Alias"] },
  ],
  "Licencia de software": [
    { key: "proveedor", label: "Proveedor", type: "text" },
    { key: "tipoLicencia", label: "Tipo de licencia", type: "text" },
    { key: "cantidadPuestos", label: "Cantidad de puestos", type: "number" },
    { key: "fechaVencimiento", label: "Fecha de vencimiento", type: "date" },
  ],
  "Equipo especial": [
    { key: "descripcionTecnica", label: "Descripción técnica", type: "textarea" },
  ],
};

function RecursoForm({ initial, empresas, sucursales, departamentos, funcionarios, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial || {
      codigo: generarCodigoInterno(),
      tipo: TIPOS_RECURSO[0],
      categoria: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      estado: "disponible",
      empresaId: "",
      sucursalId: "",
      departamentoId: "",
      responsableId: "",
      fechaAdquisicion: "",
      proximoMantenimiento: "",
      observaciones: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [atributos, setAtributos] = useState(initial?.atributos || {});

  const setAtributo = (key) => (e) => setAtributos({ ...atributos, [key]: e.target.value });

  const handleTipoChange = (e) => {
    const nuevoTipo = e.target.value;
    // Si el tipo cambia, los atributos anteriores ya no corresponden (son de otro tipo)
    if (nuevoTipo !== form.tipo) setAtributos({});
    setForm({ ...form, tipo: nuevoTipo });
  };

  const atributosDelTipo = TIPO_ATRIBUTOS[form.tipo] || [];

  const setField = (field) => (e) => {
    const value = e.target.value;
    if (field === "empresaId") {
      const sucursalValida = sucursales.find((s) => s.id === form.sucursalId && s.empresaId === value);
      const depValido = departamentos.find((d) => d.id === form.departamentoId && d.empresaId === value);
      const respValido = funcionarios.find((f) => f.id === form.responsableId && f.empresaId === value);
      setForm({
        ...form,
        empresaId: value,
        sucursalId: sucursalValida ? form.sucursalId : "",
        departamentoId: depValido ? form.departamentoId : "",
        responsableId: respValido ? form.responsableId : "",
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
  const funcionariosFiltrados = useMemo(
    () => funcionarios.filter((f) => !form.empresaId || f.empresaId === form.empresaId),
    [funcionarios, form.empresaId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, atributos };
      if (initial?.id) {
        const prevEstado = initial.estado;
        await db.collection("recursos").doc(initial.id).update({
          ...payload,
          actualizadoEn: serverTimestamp(),
        });
        if (prevEstado !== payload.estado) {
          await registrarHistorial(initial.id, {
            tipo: "cambio_estado",
            detalle: `Estado cambiado de "${estadoLabel(prevEstado)}" a "${estadoLabel(payload.estado)}"`,
            usuario: auth.currentUser?.email || "—",
          });
        } else {
          await registrarHistorial(initial.id, {
            tipo: "edicion",
            detalle: "Datos del recurso actualizados",
            usuario: auth.currentUser?.email || "—",
          });
        }
      } else {
        const ref = await db.collection("recursos").add({
          ...payload,
          creadoEn: serverTimestamp(),
        });
        await registrarHistorial(ref.id, {
          tipo: "alta",
          detalle: "Recurso incorporado al inventario",
          usuario: auth.currentUser?.email || "—",
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar el recurso.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-block">
        <div className="form-block-title">Identificación</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Código interno</label>
            <input required value={form.codigo} onChange={setField("codigo")} />
          </div>
          <div className="form-field">
            <label>Tipo de recurso</label>
            <select value={form.tipo} onChange={handleTipoChange}>
              {TIPOS_RECURSO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Categoría</label>
            <input value={form.categoria} onChange={setField("categoria")} placeholder="Ej: Hardware, Red, Software" />
          </div>
          <div className="form-field">
            <label>Marca</label>
            <input value={form.marca} onChange={setField("marca")} />
          </div>
          <div className="form-field">
            <label>Modelo</label>
            <input value={form.modelo} onChange={setField("modelo")} />
          </div>
          <div className="form-field">
            <label>Número de serie</label>
            <input value={form.numeroSerie} onChange={setField("numeroSerie")} />
          </div>
          <div className="form-field">
            <label>Estado</label>
            <select value={form.estado} onChange={setField("estado")}>
              {ESTADOS_RECURSO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-block">
        <div className="form-block-title">Información administrativa</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Empresa asignada</label>
            <select value={form.empresaId} onChange={setField("empresaId")}>
              <option value="">Sin definir</option>
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
            <label>Responsable actual</label>
            <select value={form.responsableId} onChange={setField("responsableId")}>
              <option value="">Sin asignar</option>
              {funcionariosFiltrados.map((f) => <option key={f.id} value={f.id}>{f.nombre}{f.cargo ? ` — ${f.cargo}` : ""}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Fecha de adquisición</label>
            <input type="date" value={form.fechaAdquisicion} onChange={setField("fechaAdquisicion")} />
          </div>
          <div className="form-field">
            <label>Próximo mantenimiento (opcional)</label>
            <input type="date" value={form.proximoMantenimiento} onChange={setField("proximoMantenimiento")} />
            <span className="form-hint">Si lo cargás, la campana avisa cuando esté vencido o próximo.</span>
          </div>
          <div className="form-field full">
            <label>Observaciones</label>
            <textarea value={form.observaciones} onChange={setField("observaciones")} />
          </div>
        </div>
      </div>

      {atributosDelTipo.length > 0 && (
        <div className="form-block">
          <div className="form-block-title">Atributos de {form.tipo}</div>
          <div className="form-grid">
            {atributosDelTipo.map((attr) => (
              <div className={`form-field ${attr.type === "textarea" ? "full" : ""}`} key={attr.key}>
                <label>{attr.label}</label>
                {attr.type === "select" ? (
                  <select value={atributos[attr.key] || ""} onChange={setAtributo(attr.key)}>
                    <option value="">Seleccionar…</option>
                    {attr.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : attr.type === "textarea" ? (
                  <textarea value={atributos[attr.key] || ""} onChange={setAtributo(attr.key)} />
                ) : (
                  <input
                    type={attr.type === "number" ? "number" : attr.type === "date" ? "date" : "text"}
                    value={atributos[attr.key] || ""}
                    onChange={setAtributo(attr.key)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </div>
    </form>
  );
}

function RecursoHistorial({ recurso, onClose }) {
  const { data: eventos, loading } = useCollection(`recursos/${recurso.id}/historial`, {
    orderByField: "fecha",
    orderDirection: "desc",
  });

  return (
    <Modal title={`Historial — ${recurso.codigo}`} onClose={onClose} width={560}>
      {loading && <p style={{ color: "var(--color-text-secondary)" }}>Cargando historial…</p>}
      {!loading && eventos.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13.5 }}>Sin movimientos registrados todavía.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {eventos.map((ev) => (
          <div key={ev.id} style={{ borderLeft: "3px solid var(--color-primary)", paddingLeft: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-black)" }}>{ev.detalle}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {formatDateTime(ev.fecha)} · {ev.usuario || "—"}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Recursos() {
  const { data: recursos, loading } = useCollection("recursos", { orderByField: "creadoEn", orderDirection: "desc" });
  const { data: empresas } = useCollection("empresas");
  const { data: sucursales } = useCollection("sucursales");
  const { data: departamentos } = useCollection("departamentos");
  const { data: funcionarios } = useCollection("funcionarios");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [viewingHistorial, setViewingHistorial] = useState(null);

  const empresaNombre = (id) => empresas.find((e) => e.id === id)?.nombre || "—";
  const funcionarioNombre = (id) => funcionarios.find((f) => f.id === id)?.nombre || "—";

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (recurso) => { setEditing(recurso); setShowForm(true); };

  const handleDelete = async () => {
    await db.collection("recursos").doc(toDelete.id).update({ estado: "dado_de_baja" });
    await registrarHistorial(toDelete.id, {
      tipo: "baja",
      detalle: "Recurso dado de baja definitiva",
      usuario: auth.currentUser?.email || "—",
    });
    setToDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recursos</h1>
          <p className="page-subtitle">Ficha individual y ciclo de vida de cada recurso tecnológico o administrativo.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>Nuevo recurso</Button>
      </div>

      <DataTable
        emptyLabel={loading ? "Cargando recursos…" : "Todavía no hay recursos registrados."}
        searchPlaceholder="Buscar por código, tipo, marca, responsable…"
        columns={[
          { key: "codigo", label: "Código" },
          { key: "tipo", label: "Tipo" },
          { key: "marca", label: "Marca / Modelo", render: (r) => `${r.marca || "—"} ${r.modelo || ""}` },
          { key: "empresaId", label: "Empresa", render: (r) => empresaNombre(r.empresaId), searchValue: (r) => empresaNombre(r.empresaId) },
          { key: "responsableId", label: "Responsable", render: (r) => funcionarioNombre(r.responsableId), searchValue: (r) => funcionarioNombre(r.responsableId) },
          { key: "estado", label: "Estado", render: (r) => <EstadoBadge estado={r.estado || "disponible"} /> },
          {
            key: "acciones",
            label: "",
            sortable: false,
            render: (row) => (
              <div className="row-actions">
                <span className="icon-btn" title="Historial" onClick={() => setViewingHistorial(row)}><Icon name="history" size={15} /></span>
                <span className="icon-btn" title="Editar" onClick={() => openEdit(row)}><Icon name="pencil" size={15} /></span>
                <span className="icon-btn" title="Dar de baja" onClick={() => setToDelete(row)}><Icon name="trash-2" size={15} /></span>
              </div>
            ),
          },
        ]}
        rows={recursos}
      />

      {showForm && (
        <Modal title={editing ? `Editar recurso — ${editing.codigo}` : "Nuevo recurso"} onClose={() => setShowForm(false)} width={680}>
          <RecursoForm
            initial={editing}
            empresas={empresas}
            sucursales={sucursales}
            departamentos={departamentos}
            funcionarios={funcionarios}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </Modal>
      )}

      {viewingHistorial && (
        <RecursoHistorial recurso={viewingHistorial} onClose={() => setViewingHistorial(null)} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Dar de baja recurso"
          message={`¿Confirma que desea dar de baja "${toDelete.codigo}"? El recurso conservará su historial pero dejará de estar disponible.`}
          confirmLabel="Dar de baja"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
