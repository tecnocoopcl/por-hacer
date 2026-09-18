import React, { useState, useEffect } from 'react';
import { Button } from "baseui/button";
import { Input } from "baseui/input";
import { Checkbox } from "baseui/checkbox";
import { CategorySelect, colorForCategoria } from '@newale/ui';
import { SettingsModal } from './SettingsModal';
import { WeekView } from './WeekView';
import { toDayKey, parseDayKey, startOfWeek, addDays } from './dates';
import './App.css';

function App() {
  const [activeTasks, setActiveTasks] = useState(() => loadTasks(t => t.state !== "done" && t.state !== "archived"));
  const [doneTasks, setDoneTasks] = useState(() => loadTasks(t => t.state === "done"));
  const [archivedTasks, setArchivedTasks] = useState(() => loadTasks(t => t.state === "archived"));
  const [newTask, setNewTask] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [editTask, setEditTask] = useState(null);
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projects")) ?? []; } catch { return []; }
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [taskProject, setTaskProject] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState("lista");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify([...activeTasks, ...doneTasks, ...archivedTasks]));
  }, [activeTasks, doneTasks, archivedTasks]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key === ".") {
        e.preventDefault();
        setSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getDaysDuration = (start, end) => {
    if (!start || !end) return "";
    const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    return diff === 1 ? `${diff} día` : `${diff} días`;
  };

  const getDaysPending = (start) => {
    if (!start) return "";
    const diff = Math.ceil((new Date() - new Date(start)) / (1000 * 60 * 60 * 24));
    return diff === 1 ? `Pendiente hace ${diff} día` : `Pendiente hace ${diff} días`;
  };

  const ensureProject = (label) => {
    const id = label.toLowerCase();
    if (!projects.find(p => p.id === id)) {
      setProjects(prev => [...prev, { id, label }]);
    }
    return id;
  };

  const resetForm = () => {
    setNewTask("");
    setTaskDate("");
    setEditTask(null);
    setTaskProject(selectedProject ? [{ id: selectedProject, label: projects.find(p => p.id === selectedProject)?.label ?? selectedProject }] : []);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const rawProject = taskProject[0];
    let projectId = null;
    let projectLabel = null;
    if (rawProject) {
      projectLabel = rawProject.label || rawProject.id;
      projectId = ensureProject(projectLabel);
    }

    const scheduledFor = taskDate || null;

    if (editTask) {
      setActiveTasks(prev => prev.map(t =>
        t === editTask ? { ...t, task: newTask.trim(), projectId, projectLabel, scheduledFor } : t
      ));
    } else {
      setActiveTasks(prev => [...prev, {
        date: new Date().toISOString(),
        state: "active",
        task: newTask.trim(),
        projectId,
        projectLabel,
        scheduledFor,
      }]);
    }
    resetForm();
  };

  const startEditTask = (task) => {
    setNewTask(task.task);
    setTaskDate(task.scheduledFor ?? "");
    setEditTask(task);
    if (task.projectId) {
      const proj = projects.find(p => p.id === task.projectId);
      const label = proj?.label ?? task.projectLabel ?? task.projectId;
      setTaskProject([{ id: task.projectId, label }]);
    } else {
      setTaskProject([]);
    }
  };

  const setterFor = (state) => (
    state === "done" ? setDoneTasks : state === "archived" ? setArchivedTasks : setActiveTasks
  );

  const moveTask = (task, toState) => {
    const fromState = task.state === "done" ? "done" : task.state === "archived" ? "archived" : "active";
    if (fromState === toState) return;

    const { completedAt, archivedAt, ...rest } = task;
    const moved = { ...rest, state: toState };
    if (toState === "done") moved.completedAt = new Date().toISOString();
    if (toState === "archived") moved.archivedAt = new Date().toISOString();
    if (toState === "active" && fromState === "archived") moved.scheduledFor = null;

    setterFor(fromState)(prev => prev.filter(t => t !== task));
    setterFor(toState)(prev => [...prev, moved]);
    if (editTask === task) resetForm();
  };

  const scheduleTask = (task, dayKey) => {
    setActiveTasks(prev => prev.map(t => t === task ? { ...t, scheduledFor: dayKey || null } : t));
  };

  const deleteTask = (task) => {
    const fromState = task.state === "done" ? "done" : task.state === "archived" ? "archived" : "active";
    setterFor(fromState)(prev => prev.filter(t => t !== task));
    if (editTask === task) resetForm();
  };

  const handleDownload = () => {
    const allTasks = [...activeTasks, ...doneTasks, ...archivedTasks];
    const dateStr = new Date().toISOString().replace(/[:T.Z]/g, "-").slice(0, 19);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allTasks, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `tasks_${dateStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setActiveTasks(imported.filter(t => t.state !== "done" && t.state !== "archived"));
        setDoneTasks(imported.filter(t => t.state === "done"));
        setArchivedTasks(imported.filter(t => t.state === "archived"));
      } catch {
        alert("Error al cargar el archivo. ¿Es un JSON válido?");
      }
    };
    reader.readAsText(file);
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject === id) setSelectedProject(null);
  };

  const selectProject = (id) => {
    setSelectedProject(id);
    if (editTask) return;
    if (id) {
      const label = projects.find(p => p.id === id)?.label ?? id;
      setTaskProject([{ id, label }]);
    } else {
      setTaskProject([]);
    }
  };

  const getProjectLabel = (task) => {
    if (!task || !task.projectId) return null;
    return projects.find(p => p.id === task.projectId)?.label ?? task.projectLabel ?? task.projectId;
  };

  const byProject = (list) => selectedProject ? list.filter(t => t.projectId === selectedProject) : list;
  const filteredActive = byProject(activeTasks);
  const filteredDone = byProject(doneTasks);
  const filteredArchived = byProject(archivedTasks);

  const today = toDayKey(new Date());

  const sortedActive = filteredActive.slice().sort((a, b) => {
    const sa = a.scheduledFor || null;
    const sb = b.scheduledFor || null;
    if (sa && sb) return sa < sb ? -1 : sa > sb ? 1 : 0;
    if (sa) return -1;
    if (sb) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="App">
      <header className="App-header" style={{ position: "relative" }}>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button onClick={() => setSettingsOpen(true)} kind="minimal" size="compact" overrides={{ BaseButton: { style: { padding: 0, minWidth: 0 } } }} title="Configuración (⌘.)">
            <SettingsIcon />
          </Button>
        </div>

        <h1 style={{ marginBottom: "0.5rem" }}>Por hacer ({filteredActive.length})</h1>

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
          <ViewTab label="Lista" active={view === "lista"} onClick={() => setView("lista")} />
          <ViewTab label="Semana" active={view === "semana"} onClick={() => setView("semana")} />
        </div>

        {(() => {
          const selectedProjId = taskProject[0]?.id ?? null;
          const suggestions = activeTasks
            .filter(t => selectedProjId ? t.projectId === selectedProjId : true)
            .map(t => t.task);
          return (
            <datalist id="por-hacer-suggestions">
              {suggestions.map((t, i) => <option key={i} value={t} />)}
            </datalist>
          );
        })()}
        <form onSubmit={addTask} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Ingresa una tarea"
                clearOnEscape
                overrides={{
                  Input: { style: { width: "100%" }, props: { list: "por-hacer-suggestions" } },
                  Root: { style: { width: "100%" } },
                }}
              />
            </div>
            <Button type="submit">{editTask ? "Guardar" : "Agregar"}</Button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <CategorySelect
                options={projects}
                value={taskProject}
                onChange={({ value }) => setTaskProject(value)}
                onCreateOption={(label) => ensureProject(label)}
                placeholder="Proyecto (opcional)"
              />
            </div>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              title="Planificar para (opcional)"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                padding: "0.6rem 0.5rem",
                fontSize: "0.9rem",
                colorScheme: "dark",
              }}
            />
            {taskDate && (
              <button type="button" onClick={() => setTaskDate("")} title="Quitar fecha"
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
            )}
            {editTask && (
              <Button type="button" kind="tertiary" size="compact" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </form>

        {projects.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", width: "100%", marginTop: "0.75rem", marginBottom: "1rem" }}>
            <ProjectChip label="Todos" active={selectedProject === null} onClick={() => selectProject(null)} />
            {projects.map(p => (
              <ProjectChip
                key={p.id}
                label={p.label}
                color={colorForCategoria(p.label)}
                active={selectedProject === p.id}
                onClick={() => selectProject(p.id === selectedProject ? null : p.id)}
                onDelete={() => deleteProject(p.id)}
              />
            ))}
          </div>
        )}

        {view === "semana" ? (
          <WeekView
            tasks={filteredActive}
            weekStart={weekStart}
            onPrev={() => setWeekStart(prev => addDays(prev, -7))}
            onNext={() => setWeekStart(prev => addDays(prev, 7))}
            onToday={() => setWeekStart(startOfWeek(new Date()))}
            onToggleDone={(task) => moveTask(task, "done")}
            onEdit={startEditTask}
            onSchedule={scheduleTask}
            getProjectLabel={getProjectLabel}
          />
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {sortedActive.map((task, index) => {
                const projLabel = getProjectLabel(task);
                return (
                  <li key={`${task.date}-${index}`} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                      <Checkbox checked={false} onChange={() => moveTask(task, "done")} overrides={{ Root: { style: { marginRight: "0.5rem" } } }}>
                        <span style={{ display: "block" }}>{task.task}</span>
                        <span style={{ display: "block", marginTop: "0.3rem" }}>
                          {projLabel && (
                            <span style={{ display: "inline-block", lineHeight: 1.4, fontSize: "0.75rem", background: colorForCategoria(projLabel), color: "#1a1a1a", padding: "1px 8px", borderRadius: 10, fontWeight: 600, marginRight: "0.4rem" }}>
                              {projLabel}
                            </span>
                          )}
                          {task.scheduledFor && <ScheduleChip dayKey={task.scheduledFor} today={today} />}
                          <small style={{ color: "#888" }}>
                            ({formatDate(task.date)}) · {getDaysPending(task.date)}
                          </small>
                        </span>
                      </Checkbox>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <IconButton onClick={() => startEditTask(task)} label={`Editar ${task.task}`}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => moveTask(task, "archived")} label={`Archivar ${task.task}`}>
                        <ArchiveIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteTask(task)} label={`Eliminar ${task.task}`} danger>
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>

            <details style={{ marginTop: "2rem", width: "100%" }}>
              <summary style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Completadas ({filteredDone.length})</summary>
              <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
                {filteredDone.map((task, index) => {
                  const projLabel = getProjectLabel(task);
                  return (
                    <li key={`${task.date}-${index}`} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", justifyContent: "space-between", opacity: 0.7 }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Checkbox checked={true} onChange={() => moveTask(task, "active")} overrides={{ Root: { style: { marginRight: "0.5rem" } } }}>
                          <span style={{ display: "block", textDecoration: "line-through" }}>{task.task}</span>
                          <span style={{ display: "block", marginTop: "0.3rem" }}>
                            {projLabel && (
                              <span style={{ display: "inline-block", lineHeight: 1.4, fontSize: "0.75rem", background: colorForCategoria(projLabel), color: "#1a1a1a", padding: "1px 8px", borderRadius: 10, fontWeight: 600, marginRight: "0.4rem" }}>
                                {projLabel}
                              </span>
                            )}
                            <small style={{ color: "#888", textDecoration: "line-through" }}>
                              {getDaysDuration(task.date, task.completedAt)}
                            </small>
                          </span>
                        </Checkbox>
                      </div>
                      <IconButton onClick={() => deleteTask(task)} label={`Eliminar ${task.task}`} danger>
                        <TrashIcon />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            </details>

            <details style={{ marginTop: "1rem", width: "100%" }}>
              <summary style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Archivadas ({filteredArchived.length})</summary>
              <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
                {filteredArchived.map((task, index) => {
                  const projLabel = getProjectLabel(task);
                  return (
                    <li key={`${task.date}-${index}`} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", justifyContent: "space-between", opacity: 0.7 }}>
                      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, paddingLeft: "0.2rem" }}>
                        <span>
                          <span style={{ display: "block" }}>{task.task}</span>
                          <span style={{ display: "block", marginTop: "0.3rem" }}>
                            {projLabel && (
                              <span style={{ display: "inline-block", lineHeight: 1.4, fontSize: "0.75rem", background: colorForCategoria(projLabel), color: "#1a1a1a", padding: "1px 8px", borderRadius: 10, fontWeight: 600, marginRight: "0.4rem" }}>
                                {projLabel}
                              </span>
                            )}
                            <small style={{ color: "#888" }}>
                              Archivada el {formatDate(task.archivedAt ?? task.date)}
                            </small>
                          </span>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Button onClick={() => moveTask(task, "active")} kind="tertiary" size="mini">Restaurar</Button>
                        <IconButton onClick={() => deleteTask(task)} label={`Eliminar ${task.task}`} danger>
                          <TrashIcon />
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          </>
        )}
      </header>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
        setProjects={setProjects}
        deleteProject={deleteProject}
        activeTasks={activeTasks}
        doneTasks={doneTasks}
        archivedTasks={archivedTasks}
        handleDownload={handleDownload}
        handleUpload={handleUpload}
      />
    </div>
  );
}

function loadTasks(predicate) {
  try {
    const saved = JSON.parse(localStorage.getItem("tasks")) ?? [];
    return saved.filter(predicate);
  } catch { return []; }
}

function ScheduleChip({ dayKey, today }) {
  const overdue = dayKey < today;
  const label = describeDay(dayKey, today);
  return (
    <span style={{
      display: "inline-block", lineHeight: 1.4, fontSize: "0.75rem",
      background: overdue ? "rgba(211,47,47,0.2)" : "rgba(255,255,255,0.12)",
      color: overdue ? "#ef9a9a" : "#ddd",
      border: `1px solid ${overdue ? "#8e3a3a" : "#555"}`,
      padding: "0px 8px", borderRadius: 10, fontWeight: 600, marginRight: "0.4rem",
    }}>
      {overdue ? `Atrasada · ${label}` : label}
    </span>
  );
}

function describeDay(dayKey, today) {
  const d = parseDayKey(dayKey);
  const t = parseDayKey(today);
  const diff = Math.round((d - t) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ViewTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: "1px solid #555", borderRadius: 16, padding: "3px 14px", cursor: "pointer",
      background: active ? "#fff" : "transparent", color: active ? "#1a1a1a" : "#fff",
      fontSize: "0.82rem", fontWeight: active ? 600 : 400,
    }}>{label}</button>
  );
}

function ProjectChip({ label, color, active, onClick, onDelete }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px 3px 10px", borderRadius: 16, border: "1px solid #555", background: active ? (color || "#fff") : "transparent", color: active ? "#1a1a1a" : "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: active ? 600 : 400 }}>
      <span onClick={onClick}>{label}</span>
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, opacity: 0.6, fontSize: "0.9rem" }} title="Eliminar proyecto">×</button>
      )}
    </span>
  );
}

function IconButton({ onClick, label, danger, children }) {
  return (
    <Button onClick={onClick} kind="tertiary" size="compact" aria-label={label}
      overrides={{ BaseButton: { style: { marginLeft: "0.5rem", color: danger ? "#d32f2f" : undefined, paddingTop: "4px", paddingBottom: "4px", minWidth: "32px", display: "flex", alignItems: "center", justifyContent: "center" } } }}>
      {children}
    </Button>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="4" rx="1" /><path d="M5 7v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7" />
      <path d="M10 12h4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default App;
