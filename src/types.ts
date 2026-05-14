export type Section = "inicio" | "finanzas" | "proyectos" | "estudios" | "dia" | "calendario" | "objetivos";
export type Lang = "es" | "en";
export type Theme = "light" | "dark";
export type Currency = "EUR" | "GBP" | "USD";
export type PriorityKey = "high" | "medium" | "low";
export type Frequency = "daily" | "weekly" | "monthly";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type CalendarMode = "day" | "week" | "month";
export type ProjectStatus = "todo" | "inProgress" | "blocked" | "done";
export type ProjectPaymentStatus = "pending" | "partial" | "paid";
export type ProjectLifecycleStatus = "lead" | "active" | "review" | "delivered" | "archived";
export type QuickType = "expense" | "income" | "studyTask" | "task" | "habit" | "event" | "goal" | "budget";
export type ExpenseKind = "individual" | "shared";
export type ExpensePaidBy = "me" | "other";

export type Task = {
  id: string;
  title: string;
  areaKey: "estudios" | "dia";
  time: string;
  priority: PriorityKey;
  recurrence?: Recurrence;
  tags?: string[];
};

export type Movement = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  expenseKind?: ExpenseKind;
  sharedWith?: string;
  ownerSharePercent?: number;
  paidBy?: ExpensePaidBy;
  tags?: string[];
};

export type Habit = {
  id: string;
  name: string;
  done: boolean;
  streak: number;
  frequency: Frequency;
  history: string[];
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  recurrence?: Recurrence;
  tags?: string[];
};

export type Goal = {
  id: string;
  title: string;
  area: string;
  progress: number;
  target: string;
  tags?: string[];
};

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityKey;
  dueDate: string;
  checklist: string[];
};

export type Project = {
  id: string;
  name: string;
  client: string;
  budget: number;
  deadline: string;
  priority: PriorityKey;
  status: ProjectLifecycleStatus;
  paymentStatus: ProjectPaymentStatus;
  estimatedHours: number;
  actualHours: number;
  notes: string;
  links?: string[];
  tags?: string[];
  tasks: ProjectTask[];
};

export type AppData = {
  tasks: Task[];
  movements: Movement[];
  habits: Habit[];
  events: EventItem[];
  goals: Goal[];
  budgets: Budget[];
  projects: Project[];
};

export const emptyData: AppData = {
  tasks: [],
  movements: [],
  habits: [],
  events: [],
  goals: [],
  budgets: [],
  projects: [],
};
