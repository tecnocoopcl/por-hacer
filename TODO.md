# TODO — Salida de Base Web (baseui)

Estado: **hecho en `por-hacer`**, pendiente en `hecho`, `escala-notas` y
`dashboard`.

`por-hacer` ya no depende de baseui ni de styletron: los componentes viven en
`src/ui`, construidos sobre primitivas de Radix. Este documento queda como
registro de por qué se decidió y como guía para las tres aplicaciones que
faltan.

## Por qué se hizo

baseui no estaba roto, pero costaba caro para lo poco que se usaba.

**Peso.** Medido con `vite build` sobre este proyecto:

| Build | Sin comprimir | gzip |
| --- | --- | --- |
| React 19 + react-dom, sin UI | 220 kB | 68,8 kB |
| Con baseui + styletron | 654 kB | 168,9 kB |
| **Con Radix (actual)** | **318 kB** | **101,5 kB** |

La migración liberó **67 kB gzip**, cerca de un 40 % del bundle.

**Dependencia de styletron.** baseui obligaba a montar un motor de CSS-in-JS
(~1,4 MB instalados) y a envolver la aplicación en dos proveedores antes de
renderizar nada. Los estilos ahora son CSS plano que Vite ya procesaba.

**Ritmo del proyecto.** Uber declara que limita su participación en el
repositorio público y que solo refleja el desarrollo interno. No está
abandonado —18.2.0 salió en julio de 2026— pero no conviene apostar el sistema
de diseño de cuatro aplicaciones a un proyecto en ese régimen.

## Qué se usa en cada aplicación

| Componente | por-hacer | hecho | escala-notas | dashboard |
| --- | :-: | :-: | :-: | :-: |
| `Button` | migrado | sí | — | — |
| `Input` | migrado | sí | sí | — |
| `Checkbox` | migrado | — | — | — |
| `Textarea` | migrado | — | — | — |
| `Modal` | migrado | — | — | — |
| `Select` | migrado | — | sí | — |
| `Table` | — | — | sí | — |
| `BaseProvider` + `DarkTheme` | migrado | sí | sí | — |

`dashboard` no usa baseui: basta con quitar la dependencia.

## Cómo quedó resuelto

Radix aporta foco y accesibilidad; los estilos son propios. `src/ui` contiene:

| Archivo | Qué es |
| --- | --- |
| `Button`, `Input`, `Textarea` | Elementos nativos con estilos, sin Radix |
| `Checkbox` | `Checkbox` de Radix con indicador propio |
| `Dialog` | `Dialog` de Radix |
| `CategorySelect` | Combobox creatable sobre `Popover` de Radix |
| `colors.js` | Paleta y `colorForCategoria`, venían de `@newale/ui` |
| `tokens.css`, `ui.css` | Variables del tema oscuro y estilos |

Dos decisiones que conviene recordar al migrar las demás:

- **Radix no trae combobox.** Su `Select` es un listbox y no permite crear
  opciones escribiendo, que es lo que hacía `CategorySelect`. Hubo que armarlo
  sobre `Popover`, con el filtrado, el resaltado y el teclado a mano. Como el
  control es el ancla y no el contenido, Radix cierra el menú apenas se abre si
  no se descartan las interacciones que caen dentro del control
  (`onInteractOutside`); el objetivo real del evento viene en
  `detail.originalEvent`, no en `event.target`.
- **El diálogo no recupera el foco solo.** Se abre desde un control externo y
  desde `⌘.`, así que no hay `Dialog.Trigger` al cual volver: hay que devolver
  el foco a mano con `onCloseAutoFocus`, o quien navegue con teclado queda en
  el `body`.

## Lo que falta

1. **Quitar baseui de `dashboard`.** No lo usa. Coste nulo.
2. **Publicar `@newale/ui`** y mover `src/ui` ahí. Hoy los componentes viven
   dentro de `por-hacer`; mientras no se publiquen, las otras aplicaciones
   tendrían que copiarlos, que es justo lo que se quería evitar. Este es el
   paso que decide si el sistema de diseño se comparte de verdad.
3. **Migrar `hecho`**: solo `Button` e `Input`, los dos ya resueltos.
4. **Migrar `escala-notas`**: `Input`, `Select` y `Table`. El `Select` puede
   reutilizar `CategorySelect`, o usar el `Select` de Radix si no necesita
   crear opciones. La `Table` es de lectura: basta HTML con estilos.
5. **Medir** el bundle de cada una y dejarlo registrado aquí.

## Criterios de aceptación

- [x] `por-hacer` instala con `npm ci`, sin `overrides` ni `--legacy-peer-deps`
- [x] El bundle de `por-hacer` baja de 168,9 kB gzip → 101,5 kB
- [x] El tema oscuro se mantiene igual
- [x] El diálogo conserva foco atrapado, cierre con Escape y retorno del foco
- [x] `npm audit` sin vulnerabilidades
- [ ] Las cuatro aplicaciones sin baseui ni styletron
- [ ] `@newale/ui` publicado y consumido por versión

## Referencias

- [uber/baseweb](https://github.com/uber/baseweb) — estado del repositorio
- [baseui en npm](https://www.npmjs.com/package/baseui) — versiones publicadas
- [Radix UI](https://www.radix-ui.com/primitives) — primitivas
- [Base UI](https://base-ui.com/) — alternativa a Radix, sí trae combobox
- [Mantine](https://mantine.dev/) — alternativa con estilos incluidos
