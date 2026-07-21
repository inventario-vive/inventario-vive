# Registro de cambios — Vive Telecom, Inventario de Recursos

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Versionado semántico: `MAYOR.MENOR.PARCHE` (ej. `0.3.0`).

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
