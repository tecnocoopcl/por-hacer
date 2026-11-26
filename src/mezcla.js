/**
 * Mezcla de tres vías por id, para sincronizar sola dentro de espacio.
 *
 * `base` es lo que este equipo vio en el Pod la última vez que sincronizó;
 * `local`, lo que hay ahora en la app; `remoto`, lo que hay ahora en el Pod
 * (que pudo cambiar desde otro equipo o desde un asistente). Lo que cambió
 * aquí desde `base` —agregado, editado o borrado— se aplica sobre `remoto`; lo
 * demás de `remoto` queda como está. Así nadie pisa al otro salvo en la misma
 * tarea, y ahí gana lo de este equipo.
 *
 * Sin `base` (la primera vez) no hay borrados: se juntan ambos lados.
 */

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * @template {{ [k: string]: unknown }} T
 * @param {T[] | null} base
 * @param {T[]} local
 * @param {T[]} remoto
 * @param {(x: T) => string} clave
 * @returns {T[]}
 */
export function mezclar(base, local, remoto, clave = (x) => x.id) {
  const antes = new Map((base ?? []).map((x) => [clave(x), x]));
  const ahora = new Map(local.map((x) => [clave(x), x]));
  const resultado = new Map(remoto.map((x) => [clave(x), x]));

  for (const [id, x] of ahora) {
    const previo = antes.get(id);
    if (!previo || !igual(previo, x)) resultado.set(id, x); // nuevo o editado aquí
  }
  if (base) {
    for (const id of antes.keys()) if (!ahora.has(id)) resultado.delete(id); // borrado aquí
  }
  return [...resultado.values()];
}

/** ¿Hay algo de este equipo que todavía no está en el Pod? */
export function hayCambios(base, local, clave = (x) => x.id) {
  if (!base) return local.length > 0;
  if (base.length !== local.length) return true;
  const antes = new Map(base.map((x) => [clave(x), x]));
  return local.some((x) => !igual(antes.get(clave(x)), x));
}

/** Lo que se guarda de una tarea: sin `projectLabel`, que es solo de la vista. */
export function normalizarTarea(t) {
  const n = { id: t.id, date: t.date, state: t.state ?? 'active', task: t.task ?? '' };
  if (t.projectId) n.projectId = t.projectId;
  if (t.scheduledFor) n.scheduledFor = t.scheduledFor;
  if (n.state === 'done' && t.completedAt) n.completedAt = t.completedAt;
  if (n.state === 'archived' && t.archivedAt) n.archivedAt = t.archivedAt;
  return n;
}

export function normalizarProyecto(p) {
  return { id: p.id, label: p.label, uuid: p.uuid };
}
