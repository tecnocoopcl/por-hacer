# TODO — Evaluar el reemplazo de Base Web (baseui)

Estado: propuesta, sin decidir. No hay urgencia técnica: tras actualizar a
`baseui@18.2.0` el proyecto instala, compila y funciona sin parches.

## Por qué revisarlo

No es que baseui esté roto, sino que cuesta caro para lo poco que se usa.

**Peso.** Medido sobre este proyecto con `vite build`:

| Build | Sin comprimir | gzip |
| --- | --- | --- |
| React 19 + react-dom, sin UI | 220 kB | 68,8 kB |
| La aplicación completa | 654 kB | 168,9 kB |
| **Diferencia (baseui + styletron)** | **~434 kB** | **~100 kB** |

Unos 100 kB gzip por siete componentes, más del doble del peso de React.

**Dependencia de styletron.** baseui obliga a montar un motor de CSS-in-JS
(`styletron-engine-monolithic` + `styletron-react`, ~1,4 MB instalados) y a
envolver la aplicación en dos proveedores antes de renderizar nada.

**Ritmo del proyecto.** Uber declara que limita su participación en el
repositorio público y que solo refleja el desarrollo interno. No está
abandonado —18.2.0 salió en julio de 2026— pero no conviene apostar el
sistema de diseño de cuatro aplicaciones a un proyecto en ese régimen.

**Señal previa.** Los cuatro proyectos venían fijados al canal `next`
(`0.0.0-next-*`), cuyo peer de react quedó en `<19` y obligaba a instalar con
`--legacy-peer-deps`. Ya está resuelto, pero muestra lo frágil que era el
acoplamiento.

## Qué se usa realmente

La superficie es pequeña, y ese es el argumento más fuerte a favor de migrar:

| Componente | por-hacer | hecho | escala-notas | dashboard |
| --- | :-: | :-: | :-: | :-: |
| `Button` | sí | sí | — | — |
| `Input` | sí | sí | sí | — |
| `Checkbox` | sí | — | — | — |
| `Textarea` | sí | — | — | — |
| `Modal` | sí | — | — | — |
| `Select` | vía `@newale/ui` | — | sí | — |
| `Table` | — | — | sí | — |
| `BaseProvider` + `DarkTheme` | sí | sí | sí | — |

`dashboard` no usa baseui: se puede quitar la dependencia hoy mismo.
Solo `Modal`, `Select` y `Table` tienen lógica no trivial (foco, teclado,
accesibilidad); el resto son elementos nativos con estilos.

## Opciones evaluadas

| Opción | Versión | React 19 | Modelo | Contra |
| --- | --- | :-: | --- | --- |
| **Quedarse en baseui** | 18.2.0 | sí | Componentes + tema | ~100 kB gzip; arrastra styletron |
| **Radix + CSS propio** | 1.6.7 | sí | Primitivas sin estilo | Hay que escribir los estilos |
| **Base UI (`@base-ui/react`)** | 1.8.0 | sí | Primitivas sin estilo | Más joven; arrastra `date-fns` |
| **Mantine** | 9.6.1 | sí | Componentes + tema | Se cambia una librería grande por otra |
| **HTML nativo + CSS** | — | sí | Sin dependencias | Rehacer foco y accesibilidad del modal y el select |

Descartadas: Material UI y Ant Design (aún más pesadas y con estética
impuesta); shadcn/ui, porque su flujo asume Tailwind y aquí no se usa.

## Recomendación

**Radix como primitivas, con los estilos en `@newale/ui`.**

El encaje es con la arquitectura que ya existe: `@newale/ui` es el paquete
compartido entre las cuatro aplicaciones, hoy con apenas un `CategorySelect` y
una paleta. Si los componentes se estilan ahí una sola vez, ese paquete pasa a
ser el sistema de diseño real y las aplicaciones dejan de depender de la
estética de un tercero.

A favor:

- Radix trae accesibilidad y manejo de foco resueltos, que es la parte difícil
  de `Modal` y `Select`, sin imponer estilos.
- Se importa por componente y hace tree-shaking: solo entra lo que se usa.
- Elimina styletron: los estilos pasan a CSS plano, que Vite ya procesa.
- Las cuatro aplicaciones comparten apariencia por construcción.

En contra: hay que escribir los estilos de siete componentes. Es trabajo
acotado y de una sola vez, y el tema oscuro actual sirve de referencia.

Si se prefiere no escribir estilos, la alternativa razonable es **Mantine**:
resuelve todo de entrada, pero cambia una dependencia grande por otra y deja el
sistema de diseño otra vez en manos de terceros.

## Plan de migración

Por hacer en este orden; cada punto es un commit.

1. **Publicar `@newale/ui`.** Hoy va vendorizado en `vendor/newale-ui` y
   duplicado por repositorio. Publicarlo (npm, o GitHub Packages si debe ser
   privado) es requisito para que los estilos compartidos valgan la pena.
2. **Quitar baseui de `dashboard`.** No lo usa. Coste nulo, valida el camino.
3. **Portar los componentes simples** en `@newale/ui`: `Button`, `Input`,
   `Checkbox`, `Textarea`. Son elementos nativos con estilos, sin Radix.
4. **Portar `Modal`** con `@radix-ui/react-dialog`, empezando por `por-hacer`,
   que es el único que lo usa.
5. **Portar `Select`** con `@radix-ui/react-select`, incluido el
   `CategorySelect` de `@newale/ui`.
6. **Portar `Table`** en `escala-notas`: es una tabla de lectura, basta HTML.
7. **Retirar baseui y styletron** de los cuatro `package.json` y quitar
   `BaseProvider` y `StyletronProvider` de cada punto de entrada.
8. **Medir de nuevo** el bundle y comparar contra los 168,9 kB gzip actuales.

## Criterios de aceptación

- Los cuatro proyectos instalan con `npm ci`, sin `overrides` ni
  `--legacy-peer-deps`.
- El bundle de `por-hacer` baja de 168,9 kB gzip.
- El tema oscuro se mantiene igual.
- Modal y Select conservan el manejo de foco y la navegación por teclado.
- `npm audit` sigue sin vulnerabilidades.

## Referencias

- [uber/baseweb](https://github.com/uber/baseweb) — estado del repositorio
- [baseui en npm](https://www.npmjs.com/package/baseui) — versiones publicadas
- [Radix UI](https://www.radix-ui.com/primitives) — primitivas
- [Base UI](https://base-ui.com/) — alternativa a Radix
- [Mantine](https://mantine.dev/) — alternativa con estilos incluidos
