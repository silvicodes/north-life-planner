import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
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
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";

type Section = "inicio" | "finanzas" | "estudios" | "dia" | "calendario" | "objetivos";
type Lang = "es" | "en";
type Theme = "light" | "dark";
type PriorityKey = "high" | "medium" | "low";
type QuickType = "expense" | "income" | "studyTask" | "task" | "habit" | "event" | "goal";

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

type AppData = {
  tasks: Task[];
  movements: Movement[];
  habits: Habit[];
  events: EventItem[];
  goals: Goal[];
};

const emptyData: AppData = {
  tasks: [],
  movements: [],
  habits: [],
  events: [],
  goals: [],
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
    title: "Título",
    category: "Categoría",
    amount: "Cantidad",
    time: "Hora",
    dateLabel: "Fecha",
    area: "Área",
    target: "Meta",
    progress: "Progreso",
    markDone: "Marcar como hecho",
    days: "días",
    noDate: "Sin fecha",
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
    },
    placeholders: {
      task: "Ej. Preparar la presentación",
      category: "Ej. Casa, transporte, universidad",
      amount: "0",
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
    title: "Title",
    category: "Category",
    amount: "Amount",
    time: "Time",
    dateLabel: "Date",
    area: "Area",
    target: "Target",
    progress: "Progress",
    markDone: "Mark as done",
    days: "days",
    noDate: "No date",
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
    },
    placeholders: {
      task: "E.g. Prepare the presentation",
      category: "E.g. Home, transport, university",
      amount: "0",
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

function loadData(): AppData {
  try {
    const saved = localStorage.getItem("north-data");
    return saved ? { ...emptyData, ...JSON.parse(saved) } : emptyData;
  } catch {
    return emptyData;
  }
}

function App() {
  const [active, setActive] = useState<Section>("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickType, setQuickType] = useState<QuickType | null>(null);
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

  const completedHabits = data.habits.filter((habit) => habit.done).length;
  const title = navItems.find((item) => item.id === active)?.label ?? t.nav.inicio;
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  function openQuick(type: QuickType = "task") {
    setQuickType(type);
  }

  function addItem(type: QuickType, payload: Record<string, FormDataEntryValue>) {
    setData((current) => {
      if (type === "income" || type === "expense") {
        const amount = Number(payload.amount) || 0;
        const movement: Movement = {
          id: createId(),
          title: String(payload.title || t.quick[type]),
          category: String(payload.category || t.nav.finanzas),
          amount,
          type,
        };
        return { ...current, movements: [movement, ...current.movements] };
      }

      if (type === "habit") {
        const habit: Habit = {
          id: createId(),
          name: String(payload.title || t.quick.habit),
          done: false,
          streak: 0,
        };
        return { ...current, habits: [habit, ...current.habits] };
      }

      if (type === "event") {
        const event: EventItem = {
          id: createId(),
          title: String(payload.title || t.quick.event),
          date: String(payload.date || ""),
          time: String(payload.time || ""),
        };
        return { ...current, events: [event, ...current.events] };
      }

      if (type === "goal") {
        const goal: Goal = {
          id: createId(),
          title: String(payload.title || t.quick.goal),
          area: String(payload.area || t.labels.goals),
          progress: Math.min(100, Math.max(0, Number(payload.progress) || 0)),
          target: String(payload.target || ""),
        };
        return { ...current, goals: [goal, ...current.goals] };
      }

      const task: Task = {
        id: createId(),
        title: String(payload.title || t.quick.task),
        areaKey: type === "studyTask" ? "estudios" : "dia",
        time: String(payload.time || ""),
        priority: String(payload.priority || "medium") as PriorityKey,
      };
      return { ...current, tasks: [task, ...current.tasks] };
    });
  }

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

        <section className="page-grid">{renderSection(active, { t, data, money, openQuick, setData })}</section>

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
          onSelect={setQuickType}
          onAdd={addItem}
          onClose={() => setQuickType(null)}
        />
      )}
    </div>
  );
}

type ViewProps = {
  t: (typeof copy)[Lang];
  data: AppData;
  money: Intl.NumberFormat;
  openQuick: (type?: QuickType) => void;
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

function HomeView({ t, data, money, openQuick, setData }: ViewProps) {
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
          <Metric icon={Flame} label={t.labels.habits} value={`${data.habits.filter((habit) => habit.done).length}/${data.habits.length}`} />
        </div>
      </section>
      <Panel title={t.labels.priorities} icon={Target} viewLabel={t.view} className="span-4">
        <TaskList t={t} tasks={data.tasks.slice(0, 4)} setData={setData} emptyType="task" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.monthFinance} icon={CircleDollarSign} viewLabel={t.view} className="span-4">
        <MetricRow label={t.labels.income} value={money.format(income)} positive />
        <MetricRow label={t.labels.expenses} value={money.format(expenses)} />
        <MetricRow label={t.labels.plannedSavings} value={money.format(balance)} positive={balance >= 0} />
      </Panel>
      <Panel title={t.labels.academicTasks} icon={BookOpen} viewLabel={t.view} className="span-4">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios").slice(0, 3)} setData={setData} emptyType="studyTask" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.habits} icon={Flame} viewLabel={t.view} className="span-4">
        <HabitGrid t={t} habits={data.habits} setData={setData} openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.todayAgenda} icon={CalendarDays} viewLabel={t.view} className="span-12">
        <EventList t={t} events={data.events} openQuick={openQuick} />
      </Panel>
    </>
  );
}

function FinanceView({ t, data, money, openQuick }: ViewProps) {
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
      <Panel title={t.labels.recentMovements} icon={CircleDollarSign} viewLabel={t.view} className="span-8">
        <MovementList t={t} movements={data.movements} money={money} openQuick={openQuick} />
      </Panel>
    </>
  );
}

function StudyView({ t, data, openQuick, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.subjects} icon={GraduationCap} viewLabel={t.view} className="span-5">
        <EmptyState t={t} type="studyTask" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.academicTasks} icon={BookOpen} viewLabel={t.view} className="span-7">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios")} setData={setData} emptyType="studyTask" openQuick={openQuick} />
      </Panel>
    </>
  );
}

function DayView({ t, data, openQuick, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.todayTasks} icon={ListTodo} viewLabel={t.view} className="span-7">
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "dia")} setData={setData} emptyType="task" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.habits} icon={Flame} viewLabel={t.view} className="span-5">
        <HabitGrid t={t} habits={data.habits} setData={setData} openQuick={openQuick} />
      </Panel>
    </>
  );
}

function CalendarView({ t, data, openQuick }: ViewProps) {
  return (
    <Panel title={t.labels.todayAgenda} icon={Clock3} viewLabel={t.view} className="span-12">
      <EventList t={t} events={data.events} openQuick={openQuick} />
    </Panel>
  );
}

function GoalsView({ t, data, openQuick }: ViewProps) {
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
}: {
  t: (typeof copy)[Lang];
  tasks: Task[];
  setData: Dispatch<SetStateAction<AppData>>;
  emptyType: QuickType;
  openQuick: (type?: QuickType) => void;
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
        </div>
      ))}
    </div>
  );
}

function MovementList({ t, movements, money, openQuick }: { t: (typeof copy)[Lang]; movements: Movement[]; money: Intl.NumberFormat; openQuick: (type?: QuickType) => void }) {
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
        </div>
      ))}
    </div>
  );
}

function HabitGrid({
  t,
  habits,
  setData,
  openQuick,
}: {
  t: (typeof copy)[Lang];
  habits: Habit[];
  setData: Dispatch<SetStateAction<AppData>>;
  openQuick: (type?: QuickType) => void;
}) {
  if (!habits.length) return <EmptyState t={t} type="habit" openQuick={openQuick} />;

  return (
    <div className="habit-grid">
      {habits.map((habit) => (
        <button
          className={habit.done ? "done" : ""}
          key={habit.id}
          onClick={() =>
            setData((current) => ({
              ...current,
              habits: current.habits.map((item) =>
                item.id === habit.id ? { ...item, done: !item.done, streak: item.done ? Math.max(0, item.streak - 1) : item.streak + 1 } : item,
              ),
            }))
          }
        >
          <CheckCircle2 size={18} />
          <strong>{habit.name}</strong>
          <span>
            {habit.streak} {t.days}
          </span>
        </button>
      ))}
    </div>
  );
}

function EventList({ t, events, openQuick }: { t: (typeof copy)[Lang]; events: EventItem[]; openQuick: (type?: QuickType) => void }) {
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
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t, type, openQuick }: { t: (typeof copy)[Lang]; type: QuickType; openQuick: (type?: QuickType) => void }) {
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
  onSelect,
  onAdd,
  onClose,
}: {
  type: QuickType;
  t: (typeof copy)[Lang];
  onSelect: (type: QuickType) => void;
  onAdd: (type: QuickType, payload: Record<string, FormDataEntryValue>) => void;
  onClose: () => void;
}) {
  const typeLabels = t.quick;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAdd(type, Object.fromEntries(formData));
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
        <div className="quick-grid type-picker">
          {(Object.keys(typeLabels) as QuickType[]).map((item) => (
            <button className={type === item ? "selected" : ""} key={item} onClick={() => onSelect(item)}>
              {typeLabels[item]}
            </button>
          ))}
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            <span>{t.title}</span>
            <input name="title" required placeholder={placeholderFor(type, t)} />
          </label>
          {(type === "income" || type === "expense") && (
            <>
              <label>
                <span>{t.amount}</span>
                <input name="amount" type="number" min="0" step="0.01" required placeholder={t.placeholders.amount} />
              </label>
              <label>
                <span>{t.category}</span>
                <input name="category" placeholder={t.placeholders.category} />
              </label>
            </>
          )}
          {(type === "task" || type === "studyTask") && (
            <>
              <label>
                <span>{t.time}</span>
                <input name="time" type="time" />
              </label>
              <label>
                <span>{t.progress}</span>
                <select name="priority" defaultValue="medium">
                  <option value="high">{t.priorities.high}</option>
                  <option value="medium">{t.priorities.medium}</option>
                  <option value="low">{t.priorities.low}</option>
                </select>
              </label>
            </>
          )}
          {type === "event" && (
            <>
              <label>
                <span>{t.dateLabel}</span>
                <input name="date" type="date" />
              </label>
              <label>
                <span>{t.time}</span>
                <input name="time" type="time" />
              </label>
            </>
          )}
          {type === "goal" && (
            <>
              <label>
                <span>{t.area}</span>
                <input name="area" placeholder={t.placeholders.area} />
              </label>
              <label>
                <span>{t.target}</span>
                <input name="target" placeholder={t.placeholders.target} />
              </label>
              <label>
                <span>{t.progress}</span>
                <input name="progress" type="number" min="0" max="100" placeholder="0" />
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
  if (type === "habit") return t.placeholders.habit;
  if (type === "event") return t.placeholders.event;
  if (type === "goal") return t.placeholders.goal;
  return t.placeholders.task;
}

export default App;
