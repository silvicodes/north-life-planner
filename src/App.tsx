import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  Flame,
  Globe2,
  GraduationCap,
  Home,
  ListTodo,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";

type Section = "inicio" | "finanzas" | "estudios" | "dia" | "calendario" | "objetivos";
type Lang = "es" | "en";
type Theme = "light" | "dark";
type PriorityKey = "high" | "medium" | "low";
type Frequency = "daily" | "weekly" | "monthly";
type QuickType = "expense" | "income" | "studyTask" | "task" | "habit" | "event" | "goal" | "budget";

type Task = {
  id: string;
  title: string;
  areaKey: "estudios" | "dia";
  time: string;
  priority: PriorityKey;
};

type Movement = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

type Habit = {
  id: string;
  name: string;
  done: boolean;
  streak: number;
  frequency: Frequency;
  history: string[];
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
};

type Goal = {
  id: string;
  title: string;
  area: string;
  progress: number;
  target: string;
};

type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

type AppData = {
  tasks: Task[];
  movements: Movement[];
  habits: Habit[];
  events: EventItem[];
  goals: Goal[];
  budgets: Budget[];
};

const emptyData: AppData = {
  tasks: [],
  movements: [],
  habits: [],
  events: [],
  goals: [],
  budgets: [],
};

const copy = {
  es: {
    locale: "es-ES",
    date: "Viernes, 1 de mayo",
    brandSubtitle: "Organización diaria",
    todayRhythm: "Ritmo de hoy",
    habitsCompleted: "hábitos completados",
    search: "Buscar",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    darkMode: "Activar modo oscuro",
    lightMode: "Activar modo claro",
    switchLanguage: "Cambiar idioma a inglés",
    settings: "Ajustes",
    view: "Ver",
    createdBy: "Creado por",
    addQuick: "Añadir rápido",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    title: "Título",
    category: "Categoría",
    amount: "Cantidad",
    monthlyLimit: "Límite mensual",
    frequency: "Frecuencia",
    time: "Hora",
    dateLabel: "Fecha",
    area: "Área",
    target: "Meta",
    progress: "Progreso",
    markDone: "Marcar como hecho",
    days: "días",
    noDate: "Sin fecha",
    completedToday: "Completado hoy",
    streakHistory: "Historial",
    nav: {
      inicio: "Inicio",
      finanzas: "Finanzas",
      estudios: "Estudios",
      dia: "Día",
      calendario: "Agenda",
      objetivos: "Objetivos",
    },
    hero: {
      eyebrow: "Tu espacio",
      title: "Empieza añadiendo lo que quieres organizar hoy.",
      body: "Cada persona que abra North verá su propio espacio vacío. Los datos se guardan en su navegador.",
    },
    labels: {
      available: "Balance",
      pending: "Tareas",
      habits: "Hábitos",
      priorities: "Prioridades",
      monthFinance: "Finanzas del mes",
      income: "Ingresos",
      expenses: "Gastos",
      plannedSavings: "Balance actual",
      studies: "Estudios",
      week: "Semana",
      summary: "Resumen",
      estimatedBalance: "Balance estimado",
      averageDailySpend: "Gasto medio",
      savingsGoal: "Objetivos activos",
      recentMovements: "Movimientos recientes",
      budgets: "Presupuestos",
      spent: "Gastado",
      remaining: "Restante",
      overBudget: "Sobre el límite",
      subjects: "Plan de estudio",
      academicTasks: "Tareas académicas",
      todayTasks: "Tareas de hoy",
      routine: "Hábitos",
      thisWeek: "Esta semana",
      todayAgenda: "Agenda",
      goals: "Objetivos",
    },
    priorities: {
      high: "Alta",
      medium: "Media",
      low: "Baja",
    },
    quick: {
      expense: "Gasto",
      income: "Ingreso",
      studyTask: "Tarea estudio",
      task: "Tarea",
      habit: "Hábito",
      event: "Evento",
      goal: "Objetivo",
      budget: "Presupuesto",
    },
    frequencies: {
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
    },
    placeholders: {
      task: "Ej. Preparar la presentación",
      category: "Ej. Casa, transporte, universidad",
      amount: "0",
      budget: "Ej. Comida",
      habit: "Ej. Leer 20 minutos",
      event: "Ej. Clase, cita o entrega",
      goal: "Ej. Ahorrar para el viaje",
      target: "Ej. 500 EUR, domingo, 21 días",
      area: "Ej. Finanzas, estudios, salud",
    },
    empty: {
      title: "Aún no hay nada aquí",
      body: "Añade tu primer elemento y North empezará a organizarlo en esta vista.",
      cta: "Añadir",
    },
  },
  en: {
    locale: "en-GB",
    date: "Friday, May 1",
    brandSubtitle: "Daily organization",
    todayRhythm: "Today's rhythm",
    habitsCompleted: "habits completed",
    search: "Search",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    darkMode: "Turn on dark mode",
    lightMode: "Turn on light mode",
    switchLanguage: "Switch language to Spanish",
    settings: "Settings",
    view: "View",
    createdBy: "Created by",
    addQuick: "Quick add",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    title: "Title",
    category: "Category",
    amount: "Amount",
    monthlyLimit: "Monthly limit",
    frequency: "Frequency",
    time: "Time",
    dateLabel: "Date",
    area: "Area",
    target: "Target",
    progress: "Progress",
    markDone: "Mark as done",
    days: "days",
    noDate: "No date",
    completedToday: "Completed today",
    streakHistory: "History",
    nav: {
      inicio: "Home",
      finanzas: "Finance",
      estudios: "Study",
      dia: "Day",
      calendario: "Agenda",
      objetivos: "Goals",
    },
    hero: {
      eyebrow: "Your space",
      title: "Start by adding what you want to organize today.",
      body: "Every person who opens North gets their own empty space. Data is saved in their browser.",
    },
    labels: {
      available: "Balance",
      pending: "Tasks",
      habits: "Habits",
      priorities: "Priorities",
      monthFinance: "Month finance",
      income: "Income",
      expenses: "Expenses",
      plannedSavings: "Current balance",
      studies: "Study",
      week: "Week",
      summary: "Summary",
      estimatedBalance: "Estimated balance",
      averageDailySpend: "Average spend",
      savingsGoal: "Active goals",
      recentMovements: "Recent movements",
      budgets: "Budgets",
      spent: "Spent",
      remaining: "Remaining",
      overBudget: "Over budget",
      subjects: "Study plan",
      academicTasks: "Academic tasks",
      todayTasks: "Today's tasks",
      routine: "Habits",
      thisWeek: "This week",
      todayAgenda: "Agenda",
      goals: "Goals",
    },
    priorities: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    quick: {
      expense: "Expense",
      income: "Income",
      studyTask: "Study task",
      task: "Task",
      habit: "Habit",
      event: "Event",
      goal: "Goal",
      budget: "Budget",
    },
    frequencies: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    placeholders: {
      task: "E.g. Prepare the presentation",
      category: "E.g. Home, transport, university",
      amount: "0",
      budget: "E.g. Food",
      habit: "E.g. Read for 20 minutes",
      event: "E.g. Class, appointment, deadline",
      goal: "E.g. Save for the trip",
      target: "E.g. EUR 500, Sunday, 21 days",
      area: "E.g. Finance, study, health",
    },
    empty: {
      title: "Nothing here yet",
      body: "Add your first item and North will organize it into this view.",
      cta: "Add",
    },
  },
} as const;

const icons = {
  inicio: Home,
  finanzas: CircleDollarSign,
  estudios: GraduationCap,
  dia: ListTodo,
  calendario: CalendarDays,
  objetivos: Target,
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeData(data: Partial<AppData>): AppData {
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

function loadData(): AppData {
  try {
    const saved = localStorage.getItem("north-data");
    return saved ? normalizeData({ ...emptyData, ...JSON.parse(saved) }) : emptyData;
  } catch {
    return emptyData;
  }
}

function findItem(data: AppData, type: QuickType, id: string) {
  if (type === "task" || type === "studyTask") return data.tasks.find((item) => item.id === id) ?? null;
  if (type === "income" || type === "expense") return data.movements.find((item) => item.id === id) ?? null;
  if (type === "habit") return data.habits.find((item) => item.id === id) ?? null;
  if (type === "event") return data.events.find((item) => item.id === id) ?? null;
  if (type === "goal") return data.goals.find((item) => item.id === id) ?? null;
  return data.budgets.find((item) => item.id === id) ?? null;
}

function App() {
  const [active, setActive] = useState<Section>("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickType, setQuickType] = useState<QuickType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [data, setData] = useState<AppData>(loadData);
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("north-lang") === "en" ? "en" : "es"));
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("north-theme") === "dark" ? "dark" : "light"));

  const t = copy[lang];
  const money = useMemo(
    () =>
      new Intl.NumberFormat(t.locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [t.locale],
  );

  const navItems = useMemo(
    () =>
      (Object.keys(t.nav) as Section[]).map((id) => ({
        id,
        label: t.nav[id],
        icon: icons[id],
      })),
    [t],
  );

  useEffect(() => {
    localStorage.setItem("north-data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("north-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("north-lang", lang);
  }, [lang]);

  const completedHabits = data.habits.filter((habit) => habit.history.includes(todayKey())).length;
  const title = navItems.find((item) => item.id === active)?.label ?? t.nav.inicio;
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  function openQuick(type: QuickType = "task", id?: string) {
    setQuickType(type);
    setEditingId(id ?? null);
  }

  function closeQuick() {
    setQuickType(null);
    setEditingId(null);
  }

  function saveItem(type: QuickType, payload: Record<string, FormDataEntryValue>) {
    setData((current) => {
      if (type === "income" || type === "expense") {
        const amount = Number(payload.amount) || 0;
        const movement: Movement = {
          id: editingId ?? createId(),
          title: String(payload.title || t.quick[type]),
          category: String(payload.category || t.nav.finanzas),
          amount,
          type,
        };
        if (editingId) {
          return { ...current, movements: current.movements.map((item) => (item.id === editingId ? movement : item)) };
        }
        return { ...current, movements: [movement, ...current.movements] };
      }

      if (type === "habit") {
        const existing = current.habits.find((item) => item.id === editingId);
        const habit: Habit = {
          id: editingId ?? createId(),
          name: String(payload.title || t.quick.habit),
          done: existing?.done ?? false,
          streak: existing?.streak ?? 0,
          frequency: String(payload.frequency || existing?.frequency || "daily") as Frequency,
          history: existing?.history ?? [],
        };
        if (editingId) {
          return { ...current, habits: current.habits.map((item) => (item.id === editingId ? habit : item)) };
        }
        return { ...current, habits: [habit, ...current.habits] };
      }

      if (type === "event") {
        const event: EventItem = {
          id: editingId ?? createId(),
          title: String(payload.title || t.quick.event),
          date: String(payload.date || ""),
          time: String(payload.time || ""),
        };
        if (editingId) {
          return { ...current, events: current.events.map((item) => (item.id === editingId ? event : item)) };
        }
        return { ...current, events: [event, ...current.events] };
      }

      if (type === "goal") {
        const goal: Goal = {
          id: editingId ?? createId(),
          title: String(payload.title || t.quick.goal),
          area: String(payload.area || t.labels.goals),
          progress: Math.min(100, Math.max(0, Number(payload.progress) || 0)),
          target: String(payload.target || ""),
        };
        if (editingId) {
          return { ...current, goals: current.goals.map((item) => (item.id === editingId ? goal : item)) };
        }
        return { ...current, goals: [goal, ...current.goals] };
      }

      if (type === "budget") {
        const budget: Budget = {
          id: editingId ?? createId(),
          category: String(payload.title || payload.category || t.quick.budget),
          monthlyLimit: Number(payload.amount) || 0,
        };
        if (editingId) {
          return { ...current, budgets: current.budgets.map((item) => (item.id === editingId ? budget : item)) };
        }
        return { ...current, budgets: [budget, ...current.budgets] };
      }

      const task: Task = {
        id: editingId ?? createId(),
        title: String(payload.title || t.quick.task),
        areaKey: type === "studyTask" ? "estudios" : "dia",
        time: String(payload.time || ""),
        priority: String(payload.priority || "medium") as PriorityKey,
      };
      if (editingId) {
        return { ...current, tasks: current.tasks.map((item) => (item.id === editingId ? task : item)) };
      }
      return { ...current, tasks: [task, ...current.tasks] };
    });
  }

  function deleteItem(type: QuickType, id: string) {
    setData((current) => ({
      ...current,
      tasks: type === "task" || type === "studyTask" ? current.tasks.filter((item) => item.id !== id) : current.tasks,
      movements: type === "income" || type === "expense" ? current.movements.filter((item) => item.id !== id) : current.movements,
      habits: type === "habit" ? current.habits.filter((item) => item.id !== id) : current.habits,
      events: type === "event" ? current.events.filter((item) => item.id !== id) : current.events,
      goals: type === "goal" ? current.goals.filter((item) => item.id !== id) : current.goals,
      budgets: type === "budget" ? current.budgets.filter((item) => item.id !== id) : current.budgets,
    }));
  }

  const editingItem = quickType && editingId ? findItem(data, quickType, editingId) : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <strong>North</strong>
            <span>{t.brandSubtitle}</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${active === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <Sparkles size={18} />
          <strong>{t.todayRhythm}</strong>
          <span>
            {completedHabits}/{data.habits.length} {t.habitsCompleted}
          </span>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label={t.openMenu}>
            <Menu size={21} />
          </button>
          <div>
            <p className="eyebrow">{t.date}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <Search size={17} />
              <input aria-label={t.search} placeholder={t.search} />
            </div>
            <button className="language-button" onClick={() => setLang(lang === "es" ? "en" : "es")} aria-label={t.switchLanguage}>
              <Globe2 size={17} />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={theme === "light" ? t.darkMode : t.lightMode}
            >
              <ThemeIcon size={19} />
            </button>
            <button className="icon-button" aria-label={t.settings}>
              <Settings size={19} />
            </button>
          </div>
        </header>

        <section className="page-grid">{renderSection(active, { t, data, money, openQuick, deleteItem, setData })}</section>

        <footer className="app-footer">
          <span>{t.createdBy}</span>
          <strong>silvicodes</strong>
          <span className="footer-dot" />
          <strong>ReadyCreation</strong>
        </footer>
      </main>

      <button className="fab" onClick={() => openQuick("task")} aria-label={t.addQuick}>
        <Plus size={23} />
      </button>

      <nav className="bottom-nav" aria-label="Principal móvil">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <button className={active === item.id ? "active" : ""} key={item.id} onClick={() => setActive(item.id)}>
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {menuOpen && <button className="scrim" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)} />}
      {quickType && (
        <QuickAdd
          type={quickType}
          t={t}
          editingItem={editingItem}
          isEditing={Boolean(editingId)}
          onSelect={setQuickType}
          onSave={saveItem}
          onClose={closeQuick}
        />
      )}
    </div>
  );
}

type ViewProps = {
  t: (typeof copy)[Lang];
  data: AppData;
  money: Intl.NumberFormat;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
  setData: Dispatch<SetStateAction<AppData>>;
};

function renderSection(active: Section, props: ViewProps) {
  switch (active) {
    case "finanzas":
      return <FinanceView {...props} />;
    case "estudios":
      return <StudyView {...props} />;
    case "dia":
      return <DayView {...props} />;
    case "calendario":
      return <CalendarView {...props} />;
    case "objetivos":
      return <GoalsView {...props} />;
    default:
      return <HomeView {...props} />;
  }
}

function HomeView({ t, data, money, openQuick, deleteItem, setData }: ViewProps) {
  const income = data.movements.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;

  return (
    <>
      <section className="hero-panel span-8">
        <div>
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h2>{t.hero.title}</h2>
          <p>{t.hero.body}</p>
          <button className="hero-action" onClick={() => openQuick("task")}>
            <Plus size={18} />
            {t.addQuick}
          </button>
        </div>
        <div className="hero-stats">
          <Metric icon={WalletCards} label={t.labels.available} value={money.format(balance)} />
          <Metric icon={CheckCircle2} label={t.labels.pending} value={String(data.tasks.length)} />
          <Metric icon={Flame} label={t.labels.habits} value={`${data.habits.filter((habit) => habit.history.includes(todayKey())).length}/${data.habits.length}`} />
        </div>
      </section>
      <Panel title={t.labels.priorities} icon={Target} viewLabel={t.view} className="span-4">
        <TaskList t={t} tasks={data.tasks.slice(0, 4)} setData={setData} emptyType="task" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.monthFinance} icon={CircleDollarSign} viewLabel={t.view} className="span-4">
        <MetricRow label={t.labels.income} value={money.format(income)} positive />
        <MetricRow label={t.labels.expenses} value={money.format(expenses)} />
        <MetricRow label={t.labels.plannedSavings} value={money.format(balance)} positive={balance >= 0} />
      </Panel>
      <Panel title={t.labels.academicTasks} icon={BookOpen} viewLabel={t.view} className="span-4">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios").slice(0, 3)} setData={setData} emptyType="studyTask" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.habits} icon={Flame} viewLabel={t.view} className="span-4">
        <HabitGrid t={t} habits={data.habits} setData={setData} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.todayAgenda} icon={CalendarDays} viewLabel={t.view} className="span-12">
        <EventList t={t} events={data.events} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function FinanceView({ t, data, money, openQuick, deleteItem }: ViewProps) {
  const income = data.movements.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const averageExpense = data.movements.filter((item) => item.type === "expense").length ? expenses / data.movements.filter((item) => item.type === "expense").length : 0;

  return (
    <>
      <Panel title={t.labels.summary} icon={WalletCards} viewLabel={t.view} className="span-4">
        <MetricRow label={t.labels.estimatedBalance} value={money.format(balance)} positive={balance >= 0} />
        <MetricRow label={t.labels.averageDailySpend} value={money.format(averageExpense)} />
        <MetricRow label={t.labels.savingsGoal} value={String(data.goals.length)} positive />
      </Panel>
      <Panel title={t.labels.budgets} icon={Target} viewLabel={t.view} className="span-8">
        <BudgetList t={t} budgets={data.budgets} movements={data.movements} money={money} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.recentMovements} icon={CircleDollarSign} viewLabel={t.view} className="span-12">
        <MovementList t={t} movements={data.movements} money={money} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function StudyView({ t, data, openQuick, deleteItem, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.subjects} icon={GraduationCap} viewLabel={t.view} className="span-5">
        <EmptyState t={t} type="studyTask" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.academicTasks} icon={BookOpen} viewLabel={t.view} className="span-7">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios")} setData={setData} emptyType="studyTask" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function DayView({ t, data, openQuick, deleteItem, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.todayTasks} icon={ListTodo} viewLabel={t.view} className="span-7">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "dia")} setData={setData} emptyType="task" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.habits} icon={Flame} viewLabel={t.view} className="span-5">
        <HabitGrid t={t} habits={data.habits} setData={setData} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function CalendarView({ t, data, openQuick, deleteItem }: ViewProps) {
  return (
    <Panel title={t.labels.todayAgenda} icon={Clock3} viewLabel={t.view} className="span-12">
      <EventList t={t} events={data.events} openQuick={openQuick} deleteItem={deleteItem} />
    </Panel>
  );
}

function GoalsView({ t, data, openQuick, deleteItem }: ViewProps) {
  if (!data.goals.length) {
    return (
      <Panel title={t.labels.goals} icon={Target} viewLabel={t.view} className="span-12">
        <EmptyState t={t} type="goal" openQuick={openQuick} />
      </Panel>
    );
  }

  return (
    <>
      {data.goals.map((goal) => (
        <Panel title={goal.area} icon={Target} viewLabel={t.view} className="span-4" key={goal.id}>
          <ProgressRing value={goal.progress} label={goal.title} />
          <p className="goal-target">{goal.target}</p>
          <ItemActions
            editLabel={t.edit}
            deleteLabel={t.delete}
            onEdit={() => openQuick("goal", goal.id)}
            onDelete={() => deleteItem("goal", goal.id)}
          />
        </Panel>
      ))}
    </>
  );
}

function Panel({
  title,
  icon: Icon,
  viewLabel,
  className = "",
  children,
}: {
  title: string;
  icon: typeof Home;
  viewLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={`panel ${className}`}>
      <header className="panel-header">
        <div>
          <Icon size={18} />
          <h2>{title}</h2>
        </div>
        <button className="ghost-button">{viewLabel}</button>
      </header>
      {children}
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong className={positive ? "positive" : ""}>{value}</strong>
    </div>
  );
}

function TaskList({
  t,
  tasks,
  setData,
  emptyType,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  tasks: Task[];
  setData: Dispatch<SetStateAction<AppData>>;
  emptyType: QuickType;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!tasks.length) return <EmptyState t={t} type={emptyType} openQuick={openQuick} />;

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div className="task" key={task.id}>
          <button
            aria-label={t.markDone}
            onClick={() =>
              setData((current) => ({
                ...current,
                tasks: current.tasks.filter((item) => item.id !== task.id),
              }))
            }
          />
          <div>
            <strong>{task.title}</strong>
            <span>
              {task.time || t.noDate} · {task.areaKey === "estudios" ? t.nav.estudios : t.nav.dia}
            </span>
          </div>
          <PriorityPill label={t.priorities[task.priority]} value={task.priority} />
          <ItemActions
            editLabel={t.edit}
            deleteLabel={t.delete}
            onEdit={() => openQuick(task.areaKey === "estudios" ? "studyTask" : "task", task.id)}
            onDelete={() => deleteItem(task.areaKey === "estudios" ? "studyTask" : "task", task.id)}
          />
        </div>
      ))}
    </div>
  );
}

function MovementList({
  t,
  movements,
  money,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  movements: Movement[];
  money: Intl.NumberFormat;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!movements.length) return <EmptyState t={t} type="expense" openQuick={openQuick} />;

  return (
    <div className="movement-list">
      {movements.map((movement) => (
        <div className="movement" key={movement.id}>
          <span className={`dot ${movement.type === "income" ? "sage" : "amber"}`} />
          <div>
            <strong>{movement.title}</strong>
            <small>{movement.category}</small>
          </div>
          <b className={movement.type === "income" ? "positive" : ""}>
            {movement.type === "income" ? "+" : "-"}
            {money.format(movement.amount)}
          </b>
          <ItemActions
            editLabel={t.edit}
            deleteLabel={t.delete}
            onEdit={() => openQuick(movement.type, movement.id)}
            onDelete={() => deleteItem(movement.type, movement.id)}
          />
        </div>
      ))}
    </div>
  );
}

function BudgetList({
  t,
  budgets,
  movements,
  money,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  budgets: Budget[];
  movements: Movement[];
  money: Intl.NumberFormat;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!budgets.length) return <EmptyState t={t} type="budget" openQuick={openQuick} />;

  return (
    <div className="budget-list">
      {budgets.map((budget) => {
        const spent = movements
          .filter((movement) => movement.type === "expense" && movement.category.toLowerCase() === budget.category.toLowerCase())
          .reduce((sum, movement) => sum + movement.amount, 0);
        const progress = budget.monthlyLimit > 0 ? Math.min(100, Math.round((spent / budget.monthlyLimit) * 100)) : 0;
        const remaining = budget.monthlyLimit - spent;

        return (
          <div className="budget-item" key={budget.id}>
            <div className="budget-topline">
              <div>
                <strong>{budget.category}</strong>
                <span>
                  {t.labels.spent}: {money.format(spent)} · {remaining >= 0 ? t.labels.remaining : t.labels.overBudget}: {money.format(Math.abs(remaining))}
                </span>
              </div>
              <ItemActions
                editLabel={t.edit}
                deleteLabel={t.delete}
                onEdit={() => openQuick("budget", budget.id)}
                onDelete={() => deleteItem("budget", budget.id)}
              />
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HabitGrid({
  t,
  habits,
  setData,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  habits: Habit[];
  setData: Dispatch<SetStateAction<AppData>>;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!habits.length) return <EmptyState t={t} type="habit" openQuick={openQuick} />;

  return (
    <div className="habit-grid">
      {habits.map((habit) => (
        <div
          className={`habit-card ${habit.history.includes(todayKey()) ? "done" : ""}`}
          key={habit.id}
        >
          <CheckCircle2 size={18} />
          <strong>{habit.name}</strong>
          <span>
            {t.frequencies[habit.frequency]} · {habit.history.length} {t.days}
          </span>
          <span>{t.streakHistory}: {habit.history.slice(-4).join(", ") || t.noDate}</span>
          <div className="habit-actions">
            <button
              className="ghost-button"
              onClick={() =>
                setData((current) => ({
                  ...current,
                  habits: current.habits.map((item) => {
                    if (item.id !== habit.id) return item;
                    const today = todayKey();
                    const complete = item.history.includes(today);
                    const history = complete ? item.history.filter((date) => date !== today) : [...item.history, today];
                    return { ...item, done: !complete, history, streak: history.length };
                  }),
                }))
              }
            >
              {habit.history.includes(todayKey()) ? t.completedToday : t.markDone}
            </button>
            <ItemActions
              editLabel={t.edit}
              deleteLabel={t.delete}
              onEdit={() => openQuick("habit", habit.id)}
              onDelete={() => deleteItem("habit", habit.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventList({
  t,
  events,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  events: EventItem[];
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!events.length) return <EmptyState t={t} type="event" openQuick={openQuick} />;

  return (
    <div className="task-list">
      {events.map((event) => (
        <div className="task" key={event.id}>
          <CalendarDays size={19} />
          <div>
            <strong>{event.title}</strong>
            <span>
              {event.date || t.noDate}
              {event.time ? ` · ${event.time}` : ""}
            </span>
          </div>
          <ItemActions
            editLabel={t.edit}
            deleteLabel={t.delete}
            onEdit={() => openQuick("event", event.id)}
            onDelete={() => deleteItem("event", event.id)}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t, type, openQuick }: { t: (typeof copy)[Lang]; type: QuickType; openQuick: (type?: QuickType, id?: string) => void }) {
  return (
    <div className="empty-state">
      <strong>{t.empty.title}</strong>
      <span>{t.empty.body}</span>
      <button className="ghost-button" onClick={() => openQuick(type)}>
        <Plus size={16} />
        {t.empty.cta}
      </button>
    </div>
  );
}

function ItemActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="item-actions">
      <button className="icon-button small" onClick={onEdit} aria-label={editLabel}>
        <Edit3 size={15} />
      </button>
      <button className="icon-button small danger" onClick={onDelete} aria-label={deleteLabel}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PriorityPill({ value, label }: { value: PriorityKey; label: string }) {
  return <span className={`priority ${value}`}>{label}</span>;
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="ring-wrap">
      <div className="ring" style={{ background: `conic-gradient(var(--accent) ${value * 3.6}deg, var(--ring-track) 0deg)` }}>
        <div>
          <strong>{value}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAdd({
  type,
  t,
  editingItem,
  isEditing,
  onSelect,
  onSave,
  onClose,
}: {
  type: QuickType;
  t: (typeof copy)[Lang];
  editingItem: ReturnType<typeof findItem>;
  isEditing: boolean;
  onSelect: (type: QuickType) => void;
  onSave: (type: QuickType, payload: Record<string, FormDataEntryValue>) => void;
  onClose: () => void;
}) {
  const typeLabels = t.quick;
  const values = formValuesFor(type, editingItem);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave(type, Object.fromEntries(formData));
    onClose();
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="quick-title">
      <div className="quick-modal">
        <header>
          <h2 id="quick-title">{t.addQuick}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t.closeMenu}>
            <X size={19} />
          </button>
        </header>
        {!isEditing && (
          <div className="quick-grid type-picker">
            {(Object.keys(typeLabels) as QuickType[]).map((item) => (
              <button className={type === item ? "selected" : ""} key={item} onClick={() => onSelect(item)}>
                {typeLabels[item]}
              </button>
            ))}
          </div>
        )}
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            <span>{t.title}</span>
            <input name="title" required placeholder={placeholderFor(type, t)} defaultValue={values.title} />
          </label>
          {(type === "income" || type === "expense") && (
            <>
              <label>
                <span>{t.amount}</span>
                <input name="amount" type="number" min="0" step="0.01" required placeholder={t.placeholders.amount} defaultValue={values.amount} />
              </label>
              <label>
                <span>{t.category}</span>
                <input name="category" placeholder={t.placeholders.category} defaultValue={values.category} />
              </label>
            </>
          )}
          {type === "budget" && (
            <label>
              <span>{t.monthlyLimit}</span>
              <input name="amount" type="number" min="0" step="0.01" required placeholder={t.placeholders.amount} defaultValue={values.amount} />
            </label>
          )}
          {(type === "task" || type === "studyTask") && (
            <>
              <label>
                <span>{t.time}</span>
                <input name="time" type="time" defaultValue={values.time} />
              </label>
              <label>
                <span>{t.progress}</span>
                <select name="priority" defaultValue={values.priority || "medium"}>
                  <option value="high">{t.priorities.high}</option>
                  <option value="medium">{t.priorities.medium}</option>
                  <option value="low">{t.priorities.low}</option>
                </select>
              </label>
            </>
          )}
          {type === "habit" && (
            <label>
              <span>{t.frequency}</span>
              <select name="frequency" defaultValue={values.frequency || "daily"}>
                <option value="daily">{t.frequencies.daily}</option>
                <option value="weekly">{t.frequencies.weekly}</option>
                <option value="monthly">{t.frequencies.monthly}</option>
              </select>
            </label>
          )}
          {type === "event" && (
            <>
              <label>
                <span>{t.dateLabel}</span>
                <input name="date" type="date" defaultValue={values.date} />
              </label>
              <label>
                <span>{t.time}</span>
                <input name="time" type="time" defaultValue={values.time} />
              </label>
            </>
          )}
          {type === "goal" && (
            <>
              <label>
                <span>{t.area}</span>
                <input name="area" placeholder={t.placeholders.area} defaultValue={values.area} />
              </label>
              <label>
                <span>{t.target}</span>
                <input name="target" placeholder={t.placeholders.target} defaultValue={values.target} />
              </label>
              <label>
                <span>{t.progress}</span>
                <input name="progress" type="number" min="0" max="100" placeholder="0" defaultValue={values.progress} />
              </label>
            </>
          )}
          <div className="form-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="primary-button">
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function placeholderFor(type: QuickType, t: (typeof copy)[Lang]) {
  if (type === "budget") return t.placeholders.budget;
  if (type === "habit") return t.placeholders.habit;
  if (type === "event") return t.placeholders.event;
  if (type === "goal") return t.placeholders.goal;
  return t.placeholders.task;
}

function formValuesFor(type: QuickType, item: ReturnType<typeof findItem>) {
  if (!item) return {};
  if (type === "income" || type === "expense") {
    const movement = item as Movement;
    return { title: movement.title, category: movement.category, amount: String(movement.amount) };
  }
  if (type === "budget") {
    const budget = item as Budget;
    return { title: budget.category, amount: String(budget.monthlyLimit) };
  }
  if (type === "habit") {
    const habit = item as Habit;
    return { title: habit.name, frequency: habit.frequency };
  }
  if (type === "event") {
    const event = item as EventItem;
    return { title: event.title, date: event.date, time: event.time };
  }
  if (type === "goal") {
    const goal = item as Goal;
    return { title: goal.title, area: goal.area, target: goal.target, progress: String(goal.progress) };
  }
  const task = item as Task;
  return { title: task.title, time: task.time, priority: task.priority };
}

export default App;
