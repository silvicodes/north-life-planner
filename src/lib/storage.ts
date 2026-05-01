import { todayKey } from "./date";
import { emptyData } from "../types";
import type { AppData, QuickType } from "../types";

const DATA_KEY = "north-data";
export const LANG_KEY = "north-lang";
export const THEME_KEY = "north-theme";

export function normalizeData(data: Partial<AppData>): AppData {
  return {
    tasks: data.tasks ?? [],
    movements: data.movements ?? [],
    events: data.events ?? [],
    goals: data.goals ?? [],
    budgets: data.budgets ?? [],
    habits: (data.habits ?? []).map((habit) => ({
      ...habit,
      frequency: habit.frequency ?? "daily",
      history: habit.history ?? (habit.done ? [todayKey()] : []),
      streak: habit.streak ?? habit.history?.length ?? 0,
    })),
  };
}

export function loadData(): AppData {
  try {
    const saved = localStorage.getItem(DATA_KEY);
    return saved ? normalizeData({ ...emptyData, ...JSON.parse(saved) }) : emptyData;
  } catch {
    return emptyData;
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function parseImportedData(value: string) {
  return normalizeData(JSON.parse(value));
}

export function findItem(data: AppData, type: QuickType, id: string) {
  if (type === "task" || type === "studyTask") return data.tasks.find((item) => item.id === id) ?? null;
  if (type === "income" || type === "expense") return data.movements.find((item) => item.id === id) ?? null;
  if (type === "habit") return data.habits.find((item) => item.id === id) ?? null;
  if (type === "event") return data.events.find((item) => item.id === id) ?? null;
  if (type === "goal") return data.goals.find((item) => item.id === id) ?? null;
  return data.budgets.find((item) => item.id === id) ?? null;
}
