# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Changed

- **Reemplazado baseui por primitivas de Radix.** El bundle baja de 168,9 a
  101,5 kB gzip. `src/ui` reúne ahora Button, Input, Textarea, Checkbox,
  Dialog y CategorySelect con estilos propios en CSS plano. Radix no trae
  combobox, así que `CategorySelect` (creatable) se reconstruyó sobre
  `Popover`. Ver [por-hacer.md](por-hacer.md) para lo que falta migrar en las
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
