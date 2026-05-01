export type Section = "inicio" | "finanzas" | "estudios" | "dia" | "calendario" | "objetivos";
export type Lang = "es" | "en";
export type Theme = "light" | "dark";
export type PriorityKey = "high" | "medium" | "low";
export type Frequency = "daily" | "weekly" | "monthly";
export type CalendarMode = "day" | "week" | "month";
export type QuickType = "expense" | "income" | "studyTask" | "task" | "habit" | "event" | "goal" | "budget";

export type Task = {
  id: string;
  title: string;
  areaKey: "estudios" | "dia";
  time: string;
  priority: PriorityKey;
};

export type Movement = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
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
};

export type Goal = {
  id: string;
  title: string;
  area: string;
  progress: number;
  target: string;
};

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type AppData = {
  tasks: Task[];
  movements: Movement[];
  habits: Habit[];
  events: EventItem[];
  goals: Goal[];
  budgets: Budget[];
};

export const emptyData: AppData = {
  tasks: [],
  movements: [],
  habits: [],
  events: [],
  goals: [],
  budgets: [],
};
