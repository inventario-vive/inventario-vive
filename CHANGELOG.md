# Registro de cambios — Vive Telecom, Inventario de Recursos

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Versionado semántico: `MAYOR.MENOR.PARCHE` (ej. `0.3.0`).

## [0.7.1] — Limpieza de menú

### Quitado
- Se eliminó el ítem "Inventario" del menú (quedaba duplicado en función
  con "Recursos"). Todo el ciclo de vida y consulta de recursos se maneja
  desde el módulo **Recursos**.

## [0.7.0] — Historial global y Reportes

### Agregado
- Módulo **Historial**: vista consolidada de todos los eventos de todos
  los recursos (altas, ediciones, asignaciones, devoluciones,
  transferencias, mantenimiento, bajas) en un solo lugar, con filtro por
  tipo de evento y búsqueda. Usa una consulta `collectionGroup` de
  Firestore sobre todas las subcolecciones "historial" a la vez.
- Módulo **Reportes**: distribución de recursos por estado, por tipo y por
  empresa (con barras de proporción), y exportación a CSV (compatible con
  Excel) de Recursos, Asignaciones, Devoluciones, Transferencias y Bajas.
- `firestore.indexes.json`: definición del índice necesario para la
  consulta de historial global.

### Notas
- La primera vez que se abra el módulo Historial, es posible que Firestore
  pida crear un índice para la consulta `collectionGroup`. Firebase
  muestra un enlace directo en la consola del navegador para crearlo con
  un clic (una sola vez).

## [0.6.0] — Mantenimiento y Bajas

### Agregado
- Módulo **Mantenimiento**: envío de un recurso a mantenimiento preventivo
  o reparación (con proveedor/técnico, fechas y motivo), seguimiento de
  registros "en curso", y finalización con tres resultados posibles:
  reparado (vuelve a Disponible o al responsable anterior si tenía uno),
  no reparable (pasa a Bajas automáticamente), o continúa en curso.
- Módulo **Bajas**: retiro definitivo de uno o varios recursos con motivo
  formal (obsolescencia, daño irreparable, robo/pérdida, fin de vida útil,
  venta/donación, otro), fecha y responsable. El recurso nunca se elimina
  de la base — solo cambia a estado "Dado de baja", preservando todo su
  historial, tal como exige la especificación funcional.

## [0.5.0] — Devoluciones y Transferencias

### Agregado
- Módulo **Devoluciones**: selección de funcionario + recursos actualmente
  asignados a él, definición del estado resultante (disponible, en
  reparación, en mantenimiento, dado de baja), documento de devolución
  imprimible con espacio de firma.
- Módulo **Transferencias**: selección de uno o varios recursos y de un
  destino (empresa → sucursal → departamento → nuevo responsable opcional
  en cascada), documento de transferencia imprimible con el detalle de
  origen y destino de cada recurso.
- Ambos módulos actualizan el estado y la ubicación del recurso
  automáticamente y registran el movimiento en su historial.
- Se extrajo el componente de selección múltiple de recursos
  (`RecursoChecklist`) a `components.js` para reutilizarlo entre
  Asignaciones, Devoluciones y Transferencias.

## [0.4.0] — Asignaciones y documento de entrega

### Agregado
- Módulo **Asignaciones**: selección de funcionario + selección múltiple de
  recursos disponibles, generación automática del documento de entrega
  (datos de Vive Telecom, funcionario, empresa/sucursal/departamento,
  listado de recursos, espacio de observaciones, firmas) listo para imprimir.
- Al registrar una asignación, cada recurso entregado cambia automáticamente
  a estado "Asignado", queda vinculado al funcionario responsable y
  registra el evento en su historial.
- Estilos de impresión (`@media print`) para que el documento de entrega se
  imprima limpio, sin el resto de la interfaz.

## [0.3.0] — Maestros organizacionales

### Agregado
- Módulo **Sucursales** (CRUD, relacionado a Empresa).
- Módulo **Departamentos** (CRUD, relacionado a Empresa → Sucursal en cascada).
- Módulo **Funcionarios** (CRUD, relacionado a Empresa → Sucursal → Departamento en cascada, estado activo/inactivo).

### Cambiado
- El formulario de **Recursos** ahora usa selects relacionados para Sucursal,
  Departamento y Responsable (antes eran campos de texto libre).

## [0.2.1] — Corrección de Babel

### Corregido
- `@babel/standalone` se fijó a la versión `7.29.0` (antes apuntaba a "latest",
  que saltó a Babel 8 y rompía la transpilación de JSX en todos los módulos).
- Espacio faltante entre "VIVE" y "TELECOM" en los logos.

## [0.2.0] — Primera versión publicada

### Agregado
- Estructura completa del proyecto (React sin build, Firebase, GitHub Pages).
- Autenticación por correo/contraseña.
- Layout general: sidebar agrupado, topbar, tarjetas KPI.
- Módulo **Dashboard** con indicadores en tiempo real.
- Módulo **Empresas** (CRUD, patrón de referencia para el resto de maestros).
- Módulo **Recursos**: ficha completa, historial cronológico, cambio de estado.
- Reglas de seguridad de Firestore (`firestore.rules`).

## [0.1.0] — Especificación

### Agregado
- Especificación funcional y guía de diseño acordadas con el cliente.
