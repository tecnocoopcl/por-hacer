# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

## [1.0.0] — 2026-09-22

### Added

- Por Hacer puede alojarse dentro de **espacio**, el escritorio de la
  cooperativa. Embebida, no hace login propio: espacio le presta la sesión del
  socio y un `fetch` acotado a `apps/por-hacer/` en su pod. Desplegada suelta en
  `por-hacer.aebn.cl` funciona exactamente como hasta ahora — el mismo build
  sirve para los dos casos.

### Fixed

- **Escribía en el pod equivocado.** `podDataContainerUrl` concatenaba
  `/por-hacer-app/data/` al origen del WebID. Funcionaba por coincidencia,
  mientras el pod se llamaba igual que la app; con un WebID como
  `.../usuario-aebn/profile/card#me` escribía en un pod ajeno. Ahora se resuelve
  por `pim:storage` con `getPodUrlAll`, que es lo que dice dónde vive el pod.
- **"Subir al Pod" podía perder datos sin avisar.** Construía el dataset con
  `createSolidDataset()`, que crea un recurso nuevo sin ETag, así que
  `saveSolidDatasetAt` sobrescribía a ciegas: lo editado en otro dispositivo
  desaparecía. Ahora se parte del dataset remoto, con lo que la escritura es
  condicional (`If-Match`) y un cambio ajeno produce un aviso de conflicto en
  vez de una pérdida silenciosa.
- **`TypeError: Can only call Window.fetch on instances of Window`** (o
  `Illegal invocation` en Chromium) al sincronizar. `getPodUrlAll` de
  `@inrupt/solid-client@1.23.1` ignora el `fetch` que se le pasa para el
  primer fetch del documento WebID y usa el `fetch` crudo de `cross-fetch`,
  cuyo ponyfill exporta `window.fetch` sin enlazar (`exports.fetch =
  ctx.fetch`, sin `.bind`). Se enlaza `window.fetch` a sí mismo en un script
  inline en `index.html`, antes de que se evalúe cualquier módulo, para que
  `cross-fetch` capture ya la versión enlazada.
- **`Failed to construct 'URL': Invalid base URL`** al "Bajar del Pod" estando
  embebida en espacio. El `Response` que reconstruye `espacio.fetch` nunca
  traía `.url` fijado (un `Response` armado a mano trae `''` por defecto), y
  `@inrupt/solid-client` necesita esa URL para resolver referencias relativas
  dentro del propio documento Turtle (`<>` = "este documento"). Se corrigió en
  `espacio/packages/sdk` (con test de regresión ahí) y se revendorizó acá.

### Note

`@tecnocoop/espacio-sdk` se vendoriza en `src/vendor/espacio-sdk/` en vez de
depender de npm: es información interna de la cooperativa, no algo para el
registro público, y todavía no hay un registro privado montado. Es código sin
dependencias y sin build, así que copiarlo no tiene coste real; cuando exista
un registro privado (npm de pago, GitHub Packages privado, o un Verdaccio
propio), vuelve a ser una dependencia normal y este directorio desaparece. Ver
`src/vendor/espacio-sdk/README.md` para cómo actualizarla.

## [0.3.0] — 2026-09-21

### Added

- Sincronización manual con un Pod Solid propio: login Solid-OIDC
  (`@inrupt/solid-client-authn-browser`) y lectura/escritura de tareas y
  proyectos como RDF/Turtle (`@inrupt/solid-client`) en
  `<pod>/por-hacer-app/data/{tasks,projects}.ttl`. Botones "Conectar con
  Solid Pod", "Subir al Pod" y "Bajar del Pod" en Ajustes → Información.
  Cada tarea y proyecto ahora tiene un `id`/`uuid` estable (se asigna al
  vuelo a los datos existentes en `localStorage`).
- Configurado GitHub Actions: `deploy.yml` compila y publica `dist/` en
  GitHub Pages en cada push a `main` (origen "GitHub Actions" de Pages, sin
  rama `gh-pages`); `ci.yml` corre lint y build en cada Pull Request.

### Removed

- Eliminado `gh-pages` y los scripts `predeploy`/`deploy`: el despliegue
  ahora lo hace el workflow, no una máquina local.

### Changed

- **Reemplazado baseui por primitivas de Radix.** El bundle baja de 168,9 a
  101,5 kB gzip. `src/ui` reúne ahora Button, Input, Textarea, Checkbox,
  Dialog y CategorySelect con estilos propios en CSS plano. Radix no trae
  combobox, así que `CategorySelect` (creatable) se reconstruyó sobre
  `Popover`. Ver [POR-HACER.md](POR-HACER.md) para lo que falta migrar en las
  otras aplicaciones.
- Actualizado `baseui` de la pre-release `0.0.0-next-*` al canal estable
  `18.2.0`, cuyo peer de React ya admite `>=18`. Elimina el `overrides` y
  `--legacy-peer-deps` que exigía el canal `next`, y deja `npm audit` en
  cero vulnerabilidades (antes 3 altas).

### Removed

- Eliminada la dependencia de `styletron` y del paquete vendorizado
  `@newale/ui` (ahora parte de `src/ui`, pendiente de publicarse).

## [0.2.0] — Migración a Vite

### Changed

- Migrado el proyecto de Create React App (`react-scripts`) a Vite. El build
  pasa de segundos a ~300 ms. `react-scripts` arrastraba versiones
  incompatibles de `ajv` que rompían la instalación con npm 11.
- Los componentes con JSX pasan a `.jsx`; `src/index.js` se convierte en
  `src/main.jsx`.

### Removed

- Eliminado el andamiaje de Create React App (`react-scripts`,
  `reportWebVitals`, `public/index.html` con `%PUBLIC_URL%`).

## [0.1.0] — Configuración inicial de despliegue

### Added

- Configurado el despliegue en GitHub Pages: `public/CNAME` con
  `por-hacer.aebn.cl`, y los scripts `predeploy`/`deploy` con `gh-pages`.
- Commit inicial del proyecto, descomprimido desde el SIP original.
