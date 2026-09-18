# Por hacer

Aplicativo para gestionar una lista de tareas por hacer, con vista de lista y
vista semanal. Construido con React, Vite y Base Web.

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
| `npm run deploy` | Compila y publica `dist/` en GitHub Pages |

## Despliegue

`npm run deploy` compila el proyecto y empuja `dist/` a la rama `gh-pages`.
El archivo `public/CNAME` fija el dominio `por-hacer.aebn.cl`, por lo que el
subdominio debe apuntar por CNAME a `tecnocoopcl.github.io`.

## Dependencias locales

`@newale/ui` no está publicado en npm, por lo que se incluye en `vendor/newale-ui`
y se resuelve como dependencia `file:`. Si más adelante se publica en un registro,
basta con reemplazar esa ruta por el rango de versión correspondiente.
