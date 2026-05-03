import { todayKey } from "./date";
import { emptyData } from "../types";
import type { AppData, Frequency, PriorityKey, ProjectLifecycleStatus, ProjectPaymentStatus, ProjectStatus, QuickType } from "../types";

const DATA_KEY = "north-data";
export const LANG_KEY = "north-lang";
export const THEME_KEY = "north-theme";

export function normalizeData(data: Partial<AppData>): AppData {
  return {
    tasks: ensureArray(data.tasks).map((task) => ({
      id: text(task.id),
      title: text(task.title),
      areaKey: task.areaKey === "estudios" ? "estudios" : "dia",
      time: text(task.time),
      priority: priority(task.priority),
    })),
    movements: ensureArray(data.movements).map((movement) => ({
      id: text(movement.id),
      title: text(movement.title),
      category: text(movement.category),
      amount: number(movement.amount),
      type: movement.type === "income" ? "income" : "expense",
      date: text(movement.date) || todayKey(),
      expenseKind: movement.expenseKind === "shared" ? "shared" : "individual",
      sharedWith: text(movement.sharedWith),
      ownerSharePercent: Math.min(100, Math.max(0, number(movement.ownerSharePercent || 100))),
      paidBy: movement.paidBy === "other" ? "other" : "me",
    })),
    events: ensureArray(data.events).map((event) => ({
      id: text(event.id),
      title: text(event.title),
      date: text(event.date),
      time: text(event.time),
    })),
    goals: ensureArray(data.goals).map((goal) => ({
      id: text(goal.id),
      title: text(goal.title),
      area: text(goal.area),
      progress: Math.min(100, Math.max(0, number(goal.progress))),
      target: text(goal.target),
    })),
    budgets: ensureArray(data.budgets).map((budget) => ({
      id: text(budget.id),
      category: text(budget.category),
      monthlyLimit: number(budget.monthlyLimit),
    })),
    projects: ensureArray(data.projects).map((project) => ({
      id: text(project.id),
      name: text(project.name),
      client: text(project.client),
      budget: number(project.budget),
      deadline: text(project.deadline),
      priority: priority(project.priority),
      status: projectLifecycleStatus(project.status),
      paymentStatus: paymentStatus(project.paymentStatus),
      estimatedHours: number(project.estimatedHours),
      actualHours: number(project.actualHours),
      notes: text(project.notes),
      tasks: ensureArray(project.tasks).map((task) => ({
        id: text(task.id),
        title: text(task.title),
        description: text(task.description),
        status: projectStatus(task.status),
        priority: priority(task.priority),
        dueDate: text(task.dueDate),
        checklist: ensureArray(task.checklist).map((item) => text(item)).filter(Boolean),
      })),
    })),
    habits: ensureArray(data.habits).map((habit) => {
      const history = ensureArray(habit.history).map((date) => text(date)).filter(Boolean);
      return {
        id: text(habit.id),
        name: text(habit.name),
        done: Boolean(habit.done),
        frequency: frequency(habit.frequency),
        history: history.length ? history : habit.done ? [todayKey()] : [],
        streak: number(habit.streak || history.length),
      };
    }),
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

export function clearLocalData() {
  localStorage.removeItem(DATA_KEY);
}

export function parseImportedData(value: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid North data");
  }
  return normalizeData(parsed);
}

export function findItem(data: AppData, type: QuickType, id: string) {
  if (type === "task" || type === "studyTask") return data.tasks.find((item) => item.id === id) ?? null;
  if (type === "income" || type === "expense") return data.movements.find((item) => item.id === id) ?? null;
  if (type === "habit") return data.habits.find((item) => item.id === id) ?? null;
  if (type === "event") return data.events.find((item) => item.id === id) ?? null;
  if (type === "goal") return data.goals.find((item) => item.id === id) ?? null;
  return data.budgets.find((item) => item.id === id) ?? null;
}

function ensureArray<T>(value: T[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function priority(value: unknown): PriorityKey {
  return value === "high" || value === "low" ? value : "medium";
}

function frequency(value: unknown): Frequency {
  return value === "weekly" || value === "monthly" ? value : "daily";
}

function projectStatus(value: unknown): ProjectStatus {
  if (value === "inProgress" || value === "blocked" || value === "done") return value;
  return "todo";
}

function paymentStatus(value: unknown): ProjectPaymentStatus {
  if (value === "partial" || value === "paid") return value;
  return "pending";
}

function projectLifecycleStatus(value: unknown): ProjectLifecycleStatus {
  if (value === "lead" || value === "review" || value === "delivered" || value === "archived") return value;
  return "active";
}
