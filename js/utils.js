/* ============================================================
   VIVE TELECOM — Utilidades compartidas
   ============================================================ */

// Versión actual del sistema (mantener sincronizada con CHANGELOG.md)
const APP_VERSION = "0.8.0";

const { useState, useEffect, useMemo, useCallback } = React;

// Estados posibles de un recurso (spec funcional, sección 4)
const ESTADOS_RECURSO = [
  { value: "disponible", label: "Disponible" },
  { value: "asignado", label: "Asignado" },
  { value: "reservado", label: "Reservado" },
  { value: "en_prestamo", label: "En préstamo" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "en_reparacion", label: "En reparación" },
  { value: "dado_de_baja", label: "Dado de baja" },
];

function estadoLabel(value) {
  const found = ESTADOS_RECURSO.find((e) => e.value === value);
  return found ? found.label : value;
}

// Formatea un Firestore Timestamp o Date a dd/mm/aaaa
function formatDate(value) {
  if (!value) return "—";
  const d = value.toDate ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PY", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = value.toDate ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PY", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Genera un código interno simple para un nuevo recurso: TIPO-AAMMDD-XXXX
function generarCodigoInterno(prefijo = "REC") {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefijo}-${y}${m}${d}-${rand}`;
}

// Hook: suscripción en tiempo real a un documento individual de Firestore
function useDoc(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db.doc(path).onSnapshot(
      (snap) => {
        setData(snap.exists ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error(`Error leyendo ${path}:`, err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [path]);

  return { data, loading };
}

// Hook: suscripción en tiempo real a una colección de Firestore
function useCollection(path, { orderByField, orderDirection = "asc" } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let query = db.collection(path);
    if (orderByField) query = query.orderBy(orderByField, orderDirection);

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Error leyendo ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [path, orderByField, orderDirection]);

  return { data, loading, error };
}

// Registra un evento en el historial de un recurso (spec funcional, sección 5)
async function registrarHistorial(recursoId, evento) {
  await db.collection("recursos").doc(recursoId).collection("historial").add({
    ...evento,
    fecha: serverTimestamp(),
  });
}

// Hook: suscripción en tiempo real a un "collection group" (ej. todos los
// subcolecciones "historial" de todos los recursos a la vez)
function useCollectionGroup(name, { orderByField, orderDirection = "asc" } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let query = db.collectionGroup(name);
    if (orderByField) query = query.orderBy(orderByField, orderDirection);

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({
          id: doc.id,
          recursoId: doc.ref.parent.parent ? doc.ref.parent.parent.id : null,
          ...doc.data(),
        })));
        setLoading(false);
      },
      (err) => {
        console.error(`Error leyendo collectionGroup(${name}):`, err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [name, orderByField, orderDirection]);

  return { data, loading, error };
}

// Descarga un arreglo de objetos como archivo CSV
function exportCSV(filename, rows, columns) {
  const escape = (val) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(";");
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(";")).join("\n");
  const csv = "\uFEFF" + header + "\n" + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}
