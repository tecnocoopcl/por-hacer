# Por hacer

## Sistema de diseño

- [ ] Publicar `@newale/ui` (npm, o GitHub Packages si debe ser privado) y
      mover `src/ui` ahí. Mientras no se publique, `hecho` y `escala-notas`
      tendrían que copiar los componentes en vez de compartirlos.
- [ ] Migrar `dashboard`: quitar `baseui` del `package.json` (no lo usa, coste
      nulo) y confirmar que compila sin él.
- [ ] Migrar `hecho` a Radix: solo usa `Button` e `Input`, ya resueltos en
      `por-hacer`.
- [ ] Migrar `escala-notas` a Radix: `Input`, `Select` y `Table`.
      - `Select`: reutilizar `CategorySelect` si necesita crear opciones, o el
        `Select` de Radix si es de solo listado.
      - `Table`: es de lectura, alcanza con HTML y estilos propios.
- [ ] Medir el bundle de `hecho`, `escala-notas` y `dashboard` tras la
      migración y registrar el resultado en `CHANGELOG.md`.

## Repositorios pendientes de migrar a Vite

- [ ] `hecho`: mismo proceso que `por-hacer` (CRA → Vite).
- [ ] `escala-notas`: ídem.
- [ ] `dashboard`: ídem; no usa baseui, así que es más simple.

## Despliegue

- [ ] Verificar en GitHub que Pages esté activado para `por-hacer`
      (Settings → Pages, fuente `gh-pages` tras correr `npm run deploy`).
- [ ] Agregar el registro DNS `CNAME` de `por-hacer.aebn.cl` apuntando a
      `tecnocoopcl.github.io`.
- [ ] Repetir para `hecho.aebn.cl`, `dashboard.aebn.cl` y
      `escala-notas.aebn.cl` una vez migrados.
- [ ] Hacer push de la rama `feat/vite-migration` y abrir el PR.
