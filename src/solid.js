import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch as browserFetch,
} from '@inrupt/solid-client-authn-browser';
import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createContainerAt,
  createThing,
  buildThing,
  getThingAll,
  getStringNoLocale,
  getDatetime,
  getPodUrlAll,
  removeThing,
  setThing,
} from '@inrupt/solid-client';

const SCHEMA_NAME = 'https://schema.org/name';
const SCHEMA_DATE_CREATED = 'https://schema.org/dateCreated';
const SCHEMA_START_TIME = 'https://schema.org/startTime';
const SCHEMA_END_TIME = 'https://schema.org/endTime';
const POR_HACER = 'https://por-hacer.app/ns#';
const POR_HACER_STATE = POR_HACER + 'state';
const POR_HACER_PROJECT_SLUG = POR_HACER + 'slug';
const POR_HACER_PROJECT_ID = POR_HACER + 'projectId';
const POR_HACER_ARCHIVED_AT = POR_HACER + 'archivedAt';

/**
 * Por Hacer funciona de dos maneras, y esta es la frontera entre ambas.
 *
 * - **Suelta**, en por-hacer.aebn.cl: gestiona su propia sesión Solid con
 *   solid-client-authn-browser, como hasta ahora.
 * - **Dentro de espacio**: el escritorio ya tiene la sesión del socio y presta
 *   un `fetch` autenticado, acotado a la carpeta de esta app en su pod. No hay
 *   login propio ni hay nada que preguntarle al usuario.
 *
 * El resto del archivo no sabe en cuál de los dos está: pide `provider()` y usa
 * lo que le den. `App.jsx` tampoco cambia.
 */
function provider() {
  const espacio = window.__espacio;
  if (espacio) {
    return {
      embedded: true,
      fetch: espacio.fetch,
      // espacio puede estar abierto sin que el socio haya iniciado sesión
      // todavía: estar embebida no implica tener sesión.
      session: () => ({
        isLoggedIn: Boolean(espacio.session),
        webId: espacio.session?.webId ?? null,
      }),
      // La ruta la decide espacio a partir del pim:storage real del socio.
      container: () => espacio.paths.app('data/'),
      confirm: (message) => espacio.ui.confirm({ message }),
    };
  }
  return {
    embedded: false,
    fetch: browserFetch,
    session: () => {
      const session = getDefaultSession();
      return { isLoggedIn: session.info.isLoggedIn, webId: session.info.webId ?? null };
    },
    container: null, // se resuelve con podDataContainerUrl(webId), que es asíncrono
    confirm: (message) => Promise.resolve(window.confirm(message)),
  };
}

export function isEmbedded() {
  return Boolean(window.__espacio);
}

export function confirmAction(message) {
  return provider().confirm(message);
}

/**
 * Contenedor de datos de esta app dentro del pod del socio.
 *
 * Antes esto concatenaba '/por-hacer-app/data/' al origen del WebID. Funcionaba
 * por coincidencia, mientras el pod se llamaba igual que la app: con un WebID
 * como .../usuario-aebn/profile/card#me escribía en el pod de OTRO, no en el del
 * socio. Ahora se resuelve por pim:storage, que es lo que dice dónde vive el pod.
 */
export async function podDataContainerUrl(webId) {
  const p = provider();
  if (p.embedded) return p.container();

  const pods = await getPodUrlAll(webId, { fetch: p.fetch });
  if (pods.length === 0) {
    throw new Error(
      `El perfil ${webId} no declara pim:storage, así que no se puede saber dónde ` +
        'vive tu pod. Hay que añadirlo al perfil.',
    );
  }
  const storage = pods[0].endsWith('/') ? pods[0] : pods[0] + '/';
  return storage + 'apps/por-hacer/data/';
}

export async function loginToSolid(oidcIssuer) {
  await login({
    oidcIssuer,
    redirectUrl: window.location.href,
    clientName: 'Por Hacer',
  });
}

export async function handleRedirectAfterLogin() {
  await handleIncomingRedirect({ restorePreviousSession: true });
  return getSolidSession();
}

export function getSolidSession() {
  return provider().session();
}

export async function logoutFromSolid() {
  if (provider().embedded) return; // la sesión es de espacio, no nuestra
  await logout();
}

async function ensureContainer(containerUrl) {
  const solidFetch = provider().fetch;
  try {
    await getSolidDataset(containerUrl, { fetch: solidFetch });
  } catch (err) {
    if (err.statusCode !== 404) throw err;
    await createContainerAt(containerUrl, { fetch: solidFetch });
  }
}

/**
 * Error de conflicto: alguien cambió el recurso desde la última lectura.
 * Se distingue para que la UI pueda ofrecer resolverlo en vez de perder datos.
 */
export class PodConflictError extends Error {
  constructor(resource) {
    super('El Pod cambió desde la última vez que lo leíste.');
    this.name = 'PodConflictError';
    this.resource = resource;
  }
}

/**
 * Trae el dataset remoto para poder escribir de forma condicional.
 *
 * El detalle que importa: `createSolidDataset()` devuelve un dataset NUEVO, sin
 * información del recurso remoto, así que `saveSolidDatasetAt` no tiene ETag que
 * mandar y sobrescribe a ciegas. Editar en otro dispositivo y sincronizar aquí
 * borraba lo del otro sin avisar.
 *
 * Partiendo del dataset traído, solid-client conserva el ETag y envía `If-Match`:
 * si el recurso cambió, el servidor responde 412 en vez de pisarlo.
 */
async function loadForWrite(url) {
  try {
    const remote = await getSolidDataset(url, { fetch: provider().fetch });
    // Se vacía el contenido pero se conserva la identidad del recurso.
    return getThingAll(remote).reduce((acc, thing) => removeThing(acc, thing), remote);
  } catch (err) {
    if (err.statusCode === 404) return createSolidDataset();
    throw err;
  }
}

async function saveConditionally(url, dataset) {
  try {
    await saveSolidDatasetAt(url, dataset, { fetch: provider().fetch });
  } catch (err) {
    if (err.statusCode === 412) throw new PodConflictError(url);
    throw err;
  }
}

function requireLoggedIn() {
  if (!getSolidSession().isLoggedIn) {
    throw new Error('No hay sesión activa con el Pod. Conectate primero.');
  }
}

export async function fetchTasksFromPod(containerUrl) {
  requireLoggedIn();
  const url = containerUrl + 'tasks.ttl';
  let dataset;
  try {
    dataset = await getSolidDataset(url, { fetch: provider().fetch });
  } catch (err) {
    if (err.statusCode === 404) return [];
    throw err;
  }
  return getThingAll(dataset).map(thing => {
    const state = getStringNoLocale(thing, POR_HACER_STATE) ?? 'active';
    const task = {
      date: getDatetime(thing, SCHEMA_DATE_CREATED)?.toISOString() ?? new Date().toISOString(),
      state,
      task: getStringNoLocale(thing, SCHEMA_NAME) ?? '',
      projectId: getStringNoLocale(thing, POR_HACER_PROJECT_ID),
      projectLabel: null,
      scheduledFor: getStringNoLocale(thing, SCHEMA_START_TIME),
    };
    if (state === 'done') {
      const endTime = getDatetime(thing, SCHEMA_END_TIME);
      if (endTime) task.completedAt = endTime.toISOString();
    }
    if (state === 'archived') {
      const archivedAt = getDatetime(thing, POR_HACER_ARCHIVED_AT);
      if (archivedAt) task.archivedAt = archivedAt.toISOString();
    }
    return task;
  });
}

export async function saveTasksToPod(containerUrl, tasks) {
  requireLoggedIn();
  await ensureContainer(containerUrl);
  const url = containerUrl + 'tasks.ttl';
  let dataset = await loadForWrite(url);
  tasks.forEach((t, i) => {
    let builder = buildThing(createThing({ name: 'task-' + (t.id ?? i) }))
      .setDatetime(SCHEMA_DATE_CREATED, new Date(t.date))
      .setStringNoLocale(POR_HACER_STATE, t.state)
      .setStringNoLocale(SCHEMA_NAME, t.task);
    if (t.projectId) builder = builder.setStringNoLocale(POR_HACER_PROJECT_ID, t.projectId);
    if (t.scheduledFor) builder = builder.setStringNoLocale(SCHEMA_START_TIME, t.scheduledFor);
    if (t.state === 'done' && t.completedAt) builder = builder.setDatetime(SCHEMA_END_TIME, new Date(t.completedAt));
    if (t.state === 'archived' && t.archivedAt) builder = builder.setDatetime(POR_HACER_ARCHIVED_AT, new Date(t.archivedAt));
    dataset = setThing(dataset, builder.build());
  });
  await saveConditionally(url, dataset);
}

export async function fetchProjectsFromPod(containerUrl) {
  requireLoggedIn();
  const url = containerUrl + 'projects.ttl';
  let dataset;
  try {
    dataset = await getSolidDataset(url, { fetch: provider().fetch });
  } catch (err) {
    if (err.statusCode === 404) return [];
    throw err;
  }
  return getThingAll(dataset).map(thing => ({
    id: getStringNoLocale(thing, POR_HACER_PROJECT_SLUG) ?? '',
    label: getStringNoLocale(thing, SCHEMA_NAME) ?? '',
  }));
}

export async function saveProjectsToPod(containerUrl, projects) {
  requireLoggedIn();
  await ensureContainer(containerUrl);
  const url = containerUrl + 'projects.ttl';
  let dataset = await loadForWrite(url);
  projects.forEach((p, i) => {
    const thing = buildThing(createThing({ name: 'project-' + (p.uuid ?? i) }))
      .setStringNoLocale(POR_HACER_PROJECT_SLUG, p.id)
      .setStringNoLocale(SCHEMA_NAME, p.label)
      .build();
    dataset = setThing(dataset, thing);
  });
  await saveConditionally(url, dataset);
}
