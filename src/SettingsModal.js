import React, { useRef, useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'baseui/modal';
import { Button } from 'baseui/button';
import { Textarea } from 'baseui/textarea';
import { colorForCategoria } from '@newale/ui';

const TABS = [
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'informacion', label: 'Información' },
];

const TASKS_JSON_SCHEMA = JSON.stringify({
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Tareas de Por Hacer",
  "description": "Arreglo de tareas exportado/importado por la app Por Hacer",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["date", "state", "task"],
    "additionalProperties": false,
    "properties": {
      "date": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha de creación de la tarea (ISO 8601)"
      },
      "state": {
        "type": "string",
        "enum": ["active", "done", "archived"],
        "description": "Estado actual de la tarea"
      },
      "task": {
        "type": "string",
        "description": "Texto de la tarea"
      },
      "projectId": {
        "type": ["string", "null"],
        "description": "Identificador del proyecto asociado (label en minúsculas)"
      },
      "projectLabel": {
        "type": ["string", "null"],
        "description": "Nombre visible del proyecto al momento de guardar la tarea"
      },
      "completedAt": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha de finalización, presente solo si state es \"done\""
      },
      "archivedAt": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha de archivado, presente solo si state es \"archived\""
      },
      "scheduledFor": {
        "type": ["string", "null"],
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
        "description": "Día local (YYYY-MM-DD) para el que se planificó la tarea"
      }
    }
  }
}, null, 2);

function getMissingProjects(projects, activeTasks, doneTasks, archivedTasks) {
  const existingIds = new Set(projects.map(p => p.id));
  const missing = new Map();
  [...activeTasks, ...doneTasks, ...archivedTasks].forEach(t => {
    if (t.projectId && !existingIds.has(t.projectId) && !missing.has(t.projectId)) {
      missing.set(t.projectId, t.projectLabel || t.projectId);
    }
  });
  return Array.from(missing, ([id, label]) => ({ id, label }));
}

export function SettingsModal({
  isOpen,
  onClose,
  projects,
  setProjects,
  deleteProject,
  activeTasks,
  doneTasks,
  archivedTasks,
  handleDownload,
  handleUpload,
}) {
  const [activeTab, setActiveTab] = useState('proyectos');
  const fileInputRef = useRef(null);

  const missingProjects = getMissingProjects(projects, activeTasks, doneTasks, archivedTasks);

  const rescueProjects = () => {
    if (missingProjects.length === 0) return;
    setProjects(prev => [...prev, ...missingProjects]);
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      overrides={{
        Dialog: { style: { width: '700px', maxWidth: '92vw' } },
      }}
    >
      <ModalHeader>Configuración</ModalHeader>
      <ModalBody>
        <div style={{ display: 'flex', minHeight: '420px', gap: 0, margin: '0 -1px' }}>
          <div
            style={{
              width: '180px',
              flexShrink: 0,
              borderRight: '1px solid #444',
              paddingRight: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#ccc',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, paddingLeft: '1.25rem', minWidth: 0 }}>
            {activeTab === 'proyectos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Proyectos existentes</h3>
                  {projects.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>No hay proyectos creados.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {projects.map(p => (
                        <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: colorForCategoria(p.label), flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                          </span>
                          <Button
                            onClick={() => deleteProject(p.id)}
                            kind="tertiary"
                            size="mini"
                            overrides={{ BaseButton: { style: { color: '#d32f2f' } } }}
                          >
                            Eliminar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Recuperar proyectos</h3>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                    Busca tareas guardadas cuyo proyecto ya no existe y vuelve a crear ese proyecto a partir de la información guardada en cada tarea.
                  </p>
                  <Button onClick={rescueProjects} disabled={missingProjects.length === 0} size="compact">
                    {missingProjects.length > 0
                      ? `Rescatar proyectos (${missingProjects.length})`
                      : 'No hay proyectos por rescatar'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'informacion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Datos</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={handleDownload} size="compact">Descargar JSON</Button>
                    <Button onClick={() => fileInputRef.current.click()} size="compact" kind="secondary">Cargar JSON</Button>
                    <input
                      type="file"
                      accept="application/json"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleUpload}
                    />
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Esquema JSON</h3>
                  <Textarea
                    value={TASKS_JSON_SCHEMA}
                    readOnly
                    overrides={{
                      Input: { style: { fontFamily: 'monospace', fontSize: '0.78rem', minHeight: '260px' } },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
