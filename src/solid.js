import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch as solidFetch,
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

// Asunción documentada: el storage del pod vive en el mismo origen que el
// WebID (típico de un Community Solid Server de un solo usuario). No se
// hace storage discovery genérico (getPodUrlAll) en esta primera versión.
export function podDataContainerUrl(webId) {
  return new URL(webId).origin + '/por-hacer-app/data/';
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
  const session = getDefaultSession();
  return { isLoggedIn: session.info.isLoggedIn, webId: session.info.webId ?? null };
}

export async function logoutFromSolid() {
  await logout();
}

async function ensureContainer(containerUrl) {
  try {
    await getSolidDataset(containerUrl, { fetch: solidFetch });
  } catch (err) {
    if (err.statusCode !== 404) throw err;
    await createContainerAt(containerUrl, { fetch: solidFetch });
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
    dataset = await getSolidDataset(url, { fetch: solidFetch });
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
  let dataset = createSolidDataset();
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
  await saveSolidDatasetAt(url, dataset, { fetch: solidFetch });
}

export async function fetchProjectsFromPod(containerUrl) {
  requireLoggedIn();
  const url = containerUrl + 'projects.ttl';
  let dataset;
  try {
    dataset = await getSolidDataset(url, { fetch: solidFetch });
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
  let dataset = createSolidDataset();
  projects.forEach((p, i) => {
    const thing = buildThing(createThing({ name: 'project-' + (p.uuid ?? i) }))
      .setStringNoLocale(POR_HACER_PROJECT_SLUG, p.id)
      .setStringNoLocale(SCHEMA_NAME, p.label)
      .build();
    dataset = setThing(dataset, thing);
  });
  await saveSolidDatasetAt(url, dataset, { fetch: solidFetch });
}
