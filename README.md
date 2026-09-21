# Por hacer

Aplicativo para gestionar una lista de tareas por hacer, con vista de lista y
vista semanal. Construido con React, Vite y Radix.

Publicado en https://por-hacer.aebn.cl

## Requisitos

- Node.js 20 o superior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

El servidor de desarrollo queda en http://localhost:5173

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente lo compilado en `dist/` |
| `npm run lint` | Analiza el código con oxlint |

## Despliegue

El despliegue es automático: `.github/workflows/deploy.yml` compila y publica
`dist/` en GitHub Pages en cada push a `main`, usando el origen "GitHub
Actions" de Pages (Settings → Pages → Build and deployment → Source). El
archivo `public/CNAME` fija el dominio `por-hacer.aebn.cl`, por lo que el
subdominio debe apuntar por CNAME a `tecnocoopcl.github.io`.

`.github/workflows/ci.yml` corre lint y build en cada Pull Request.

## Sistema de diseño

Los componentes compartidos (Button, Input, Checkbox, Dialog, CategorySelect)
viven en `src/ui`, construidos sobre [Radix](https://www.radix-ui.com/). Ver
[POR-HACER.md](POR-HACER.md) para el plan de compartirlos entre aplicaciones
publicándolos como `@newale/ui`.
