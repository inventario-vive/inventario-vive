# Vive Telecom S.A. — Sistema de Inventario de Recursos

Primera versión funcional del sistema, construida siguiendo la especificación
funcional y la guía de diseño acordadas.

## Arquitectura

- **Frontend:** React 18 puro vía CDN (sin build step). Los archivos `.js` se
  transpilan en el navegador con Babel Standalone (`type="text/babel"`).
- **Base de datos:** Firebase Firestore (tiempo real).
- **Autenticación:** Firebase Auth con correo/contraseña (se optó por esto en
  vez de Anonymous Auth para poder trazar "quién hizo qué" en asignaciones,
  transferencias y bajas, tal como pide la spec funcional).
- **Hosting:** pensado para GitHub Pages (archivos estáticos, sin servidor).

## Estructura de archivos

```
vive-inventario/
├── index.html                # Carga librerías y scripts, monta la app
├── css/
│   └── styles.css            # Tokens de diseño (colores, tipografía, componentes)
├── firestore.rules           # Reglas de seguridad de Firestore
└── js/
    ├── firebase-config.js    # Configuración e inicialización de Firebase
    ├── utils.js               # Constantes, formateo, hook useCollection, historial
    ├── components.js          # Sidebar, Topbar, Botón, Badge, Modal, DataTable
    ├── app.js                  # Layout raíz, autenticación y router por hash
    └── modules/
        ├── Login.js
        ├── Dashboard.js        # Inicio con KPIs y recursos recientes
        ├── Empresas.js         # Maestro completo (patrón de referencia)
        ├── Recursos.js         # Ficha completa + historial + cambio de estado
        └── Placeholder.js      # Pantalla para módulos aún no construidos
```

## Puesta en marcha

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Habilitar **Firestore Database** (modo producción, la región más cercana
   a Paraguay disponible, ej. `southamerica-east1`).
3. Habilitar **Authentication → Sign-in method → Correo electrónico/contraseña**.
4. Crear al menos un usuario administrador manualmente desde
   **Authentication → Users → Add user**.
5. Copiar las credenciales del proyecto (⚙ **Configuración del proyecto** →
   **Tus apps** → **Web**) y pegarlas en `js/firebase-config.js`.
6. Publicar las reglas de `firestore.rules` desde la consola de Firebase o
   con `firebase deploy --only firestore:rules` (requiere Firebase CLI).
7. Servir la carpeta como sitio estático (para probar localmente:
   `npx serve .` o la extensión "Live Server" de VS Code) — **no** abrir
   `index.html` con doble clic (`file://`), porque los módulos de Firebase
   necesitan `http(s)://`.
8. Para producción: subir el contenido de esta carpeta a un repositorio de
   GitHub y activar **GitHub Pages** apuntando a la rama/carpeta correspondiente.

## Qué está construido en esta primera versión

- Login con correo/contraseña.
- Layout general: sidebar agrupado, barra superior, tarjetas KPI.
- **Dashboard**: indicadores rápidos y últimos recursos adquiridos (datos reales de Firestore).
- **Empresas**: alta, edición, baja — colección `empresas`.
- **Recursos**: ficha completa (identificación + información administrativa +
  estado), historial cronológico por recurso (subcolección
  `recursos/{id}/historial`), registro automático de eventos al crear,
  editar, cambiar estado o dar de baja.
- Paleta de colores, tipografía (Inter), estados con badges de color,
  botones primario/secundario/peligro y confirmaciones para acciones
  críticas, tal como especifica la guía de diseño.

## Qué falta (próximas etapas, mismo patrón que Empresas/Recursos)

- Sucursales, Departamentos, Funcionarios (maestros).
- Asignaciones (con generación de documento de entrega para firma).
- Transferencias y Devoluciones (con su propio documento).
- Mantenimiento y Bajas como flujos dedicados (hoy la baja es rápida desde Recursos).
- Historial global (vista consolidada de todos los recursos).
- Reportes y exportación (CSV/PDF/impresión) en las tablas.
- Roles y permisos (ej. quién puede eliminar vs. solo consultar).
- Selects de Sucursal/Departamento/Responsable en el formulario de Recursos
  hoy son campos de texto libre; una vez existan esos maestros, deberían
  convertirse en selects relacionados (mismo patrón que "Empresa asignada").

## Notas de diseño

- El color de estado **"Asignado"** se definió en violeta (`#7C3AED`) en vez
  del naranja corporativo, para no confundir un badge de estado con un botón
  o link de acción — esto se había señalado como punto de debate.
- El menú se agrupó en secciones (General / Maestros / Recursos /
  Operaciones / Sistema) en vez de una lista plana de 15 ítems.
- Los iconos son SVG uniformes (Lucide), no emojis, para mantener
  consistencia de color y trazo con la paleta corporativa.
