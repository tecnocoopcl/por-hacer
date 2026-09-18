const pad = (n) => String(n).padStart(2, "0");

// Día local en formato YYYY-MM-DD. A propósito no usamos ISO con hora:
// al agrupar por día, la conversión a UTC corre las tareas de día.
export const toDayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDayKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

// Lunes de la semana a la que pertenece d.
export const startOfWeek = (d) => {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0 = lunes
  return addDays(copy, -dow);
};
