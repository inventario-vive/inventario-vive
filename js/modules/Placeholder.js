/* ============================================================
   VIVE TELECOM — Placeholder para módulos pendientes
   ============================================================ */

function Placeholder({ label }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{label}</h1>
          <p className="page-subtitle">Este módulo todavía no fue desarrollado.</p>
        </div>
      </div>
      <div className="placeholder-box">
        <Icon name="construction" size={30} />
        <h3>{label} — próximamente</h3>
        <p>Este módulo se construirá en una siguiente etapa, siguiendo el mismo patrón de Empresas y Recursos.</p>
      </div>
    </div>
  );
}
