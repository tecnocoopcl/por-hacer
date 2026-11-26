import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hayCambios, mezclar, normalizarTarea } from '../src/mezcla.js';

const t = (id, task, extra = {}) => ({ id, date: '2026-11-25T10:00:00.000Z', state: 'active', task, ...extra });

test('lo que agregó otro (un asistente) en el Pod se conserva junto a lo agregado aquí', () => {
  const base = [t('a', 'Regar')];
  const local = [t('a', 'Regar'), t('b', 'Comprar semillas')];
  const remoto = [t('a', 'Regar'), t('c', 'Llamar a la imprenta')];
  assert.deepEqual(mezclar(base, local, remoto).map((x) => x.id), ['a', 'c', 'b']);
});

test('borrar aquí borra en el Pod; lo que el Pod borró no vuelve', () => {
  const base = [t('a', 'Regar'), t('b', 'Barrer')];
  assert.deepEqual(mezclar(base, [t('b', 'Barrer')], base).map((x) => x.id), ['b']);
  assert.deepEqual(mezclar(base, base, [t('a', 'Regar')]).map((x) => x.id), ['a']);
});

test('editar aquí gana en esa tarea; lo editado allá se trae', () => {
  const base = [t('a', 'Regar'), t('b', 'Barrer')];
  const local = [t('a', 'Regar', { state: 'done', completedAt: '2026-11-25T11:00:00.000Z' }), t('b', 'Barrer')];
  const remoto = [t('a', 'Regar todo'), t('b', 'Barrer el patio')];
  const r = mezclar(base, local, remoto);
  assert.equal(r.find((x) => x.id === 'a').state, 'done');
  assert.equal(r.find((x) => x.id === 'b').task, 'Barrer el patio');
});

test('sin base (la primera vez) junta ambos lados sin borrar nada', () => {
  assert.deepEqual(mezclar(null, [t('a', 'x')], [t('b', 'y')]).map((x) => x.id).sort(), ['a', 'b']);
});

test('hayCambios y la normalización ignoran lo que es solo de la vista', () => {
  const base = [t('a', 'Regar')];
  assert.equal(hayCambios(base, [normalizarTarea({ ...t('a', 'Regar'), projectLabel: 'Huerta', scheduledFor: null })]), false);
  assert.equal(hayCambios(base, []), true);
  assert.equal(hayCambios(null, []), false);
});
