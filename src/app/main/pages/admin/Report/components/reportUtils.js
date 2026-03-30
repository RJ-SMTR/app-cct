export const normalizeErroStatusSelection = (newValue) => {
  if (!Array.isArray(newValue) || newValue.length === 0) return [];
  const hasTodos = newValue.some((option) => option.label === "Todos");
  if (!hasTodos) return newValue;
  return [newValue.find((option) => option.label === "Todos")].filter(Boolean);
};
