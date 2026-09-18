import React from 'react';
import { Checkbox } from "baseui/checkbox";
import { colorForCategoria } from '@newale/ui';
import { toDayKey, addDays } from './dates';

export function WeekView({ tasks, weekStart, onPrev, onNext, onToday, onToggleDone, onEdit, onSchedule, getProjectLabel }) {
  const today = toDayKey(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayKeys = days.map(toDayKey);

  const scheduled = tasks.filter(t => t.scheduledFor);
  const unscheduled = tasks.filter(t => !t.scheduledFor);
  // Las atrasadas se muestran en el día de hoy para que no se pierdan al navegar.
  const overdue = scheduled.filter(t => t.scheduledFor < today);

  const tasksFor = (key) => {
    const own = scheduled.filter(t => t.scheduledFor === key);
    return key === today ? [...overdue, ...own] : own;
  };

  const rangeLabel = `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <NavButton onClick={onPrev} label="Semana anterior">‹</NavButton>
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{rangeLabel}</span>
        <NavButton onClick={onNext} label="Semana siguiente">›</NavButton>
        <button onClick={onToday} style={{ marginLeft: "auto", background: "none", border: "1px solid #555", borderRadius: 16, color: "#fff", padding: "3px 12px", cursor: "pointer", fontSize: "0.8rem" }}>Hoy</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {days.map((d, i) => {
          const key = dayKeys[i];
          const isToday = key === today;
          const dayTasks = tasksFor(key);
          return (
            <div key={key} style={{
              border: `1px solid ${isToday ? "#888" : "#3a3f4a"}`,
              background: isToday ? "rgba(255,255,255,0.06)" : "transparent",
              borderRadius: 8, padding: "0.5rem 0.7rem",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: dayTasks.length ? "0.4rem" : 0 }}>
                <span style={{ fontWeight: isToday ? 700 : 600, fontSize: "0.85rem", textTransform: "capitalize" }}>
                  {d.toLocaleDateString(undefined, { weekday: "long" })}
                </span>
                <span style={{ color: "#888", fontSize: "0.8rem" }}>{d.getDate()}</span>
                {isToday && <span style={{ color: "#888", fontSize: "0.75rem" }}>· hoy</span>}
              </div>
              {dayTasks.map((task, idx) => (
                <WeekTask
                  key={`${task.date}-${idx}`}
                  task={task}
                  overdue={task.scheduledFor < today}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                  onSchedule={onSchedule}
                  getProjectLabel={getProjectLabel}
                />
              ))}
            </div>
          );
        })}

        <div style={{ border: "1px dashed #3a3f4a", borderRadius: 8, padding: "0.5rem 0.7rem", marginTop: "0.4rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#aaa", marginBottom: unscheduled.length ? "0.4rem" : 0 }}>
            Sin fecha ({unscheduled.length})
          </div>
          {unscheduled.map((task, idx) => (
            <WeekTask
              key={`${task.date}-${idx}`}
              task={task}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
              onSchedule={onSchedule}
              getProjectLabel={getProjectLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekTask({ task, overdue, onToggleDone, onEdit, onSchedule, getProjectLabel }) {
  const projLabel = getProjectLabel(task);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.2rem" }}>
      <Checkbox checked={false} onChange={() => onToggleDone(task)} overrides={{ Root: { style: { marginRight: "0.25rem" } } }}>
        <span style={{ fontSize: "0.88rem", cursor: "pointer" }} onClick={(e) => { e.preventDefault(); onEdit(task); }}>
          {projLabel && (
            <span style={{ display: "inline-block", lineHeight: 1.4, fontSize: "0.7rem", background: colorForCategoria(projLabel), color: "#1a1a1a", padding: "0 7px", borderRadius: 10, fontWeight: 600, marginRight: "0.35rem" }}>
              {projLabel}
            </span>
          )}
          {task.task}
          {overdue && <span style={{ color: "#ef9a9a", fontSize: "0.72rem", marginLeft: "0.35rem" }}>atrasada</span>}
        </span>
      </Checkbox>
      {task.scheduledFor && (
        <button onClick={() => onSchedule(task, null)} title="Quitar de la planificación"
          style={{ background: "none", border: "none", color: "#777", cursor: "pointer", fontSize: "0.95rem", lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

function NavButton({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      background: "none", border: "1px solid #555", borderRadius: 6, color: "#fff",
      width: 28, height: 28, cursor: "pointer", fontSize: "1rem", lineHeight: 1,
    }}>{children}</button>
  );
}
