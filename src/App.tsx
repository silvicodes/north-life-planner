import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
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
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { addDays, dateKey, formatToday, monthGridDays, startOfWeek, todayKey } from "./lib/date";
import { clearLocalData, findItem, LANG_KEY, loadData, parseImportedData, saveData, THEME_KEY } from "./lib/storage";
import { isSupabaseConfigured, loadCloudData, saveCloudData, supabase } from "./lib/supabase";
import { emptyData } from "./types";
import type {
  AppData,
  Budget,
  CalendarMode,
  EventItem,
  Frequency,
  Goal,
  Habit,
  Lang,
  Movement,
  PriorityKey,
  QuickType,
  Section,
  Task,
  Theme,
} from "./types";
import { copy } from "./i18n/copy";
import type { User } from "@supabase/supabase-js";

const icons = {
  inicio: Home,
  finanzas: CircleDollarSign,
  estudios: GraduationCap,
  dia: ListTodo,
  calendario: CalendarDays,
  objetivos: Target,
};

type PendingDelete = {
  type: QuickType;
  id: string;
} | null;
type AuthMode = "signIn" | "signUp";
type SyncStatus = "local" | "loading" | "synced" | "saving" | "error";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [active, setActive] = useState<Section>("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickType, setQuickType] = useState<QuickType | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [data, setData] = useState<AppData>(loadData);
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) === "en" ? "en" : "es"));
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"));
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? "loading" : "local");
  const [cloudReady, setCloudReady] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const t = copy[lang];
  const todayLabel = useMemo(() => formatToday(t.locale), [t.locale]);
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
    saveData(data);
    if (!authUser || !cloudReady) return;

    setSyncStatus("saving");
    saveCloudData(authUser.id, data)
      .then(() => setSyncStatus("synced"))
      .catch(() => setSyncStatus("error"));
  }, [authUser, cloudReady, data]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const user = sessionData.session?.user ?? null;
      setAuthUser(user);
      if (user) syncFromCloud(user.id);
      else setSyncStatus("local");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setCloudReady(false);
      if (user) syncFromCloud(user.id);
      else {
        setSyncStatus("local");
        setCloudReady(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
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
    setPendingDelete({ type, id });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setData((current) => ({
      ...current,
      tasks: pendingDelete.type === "task" || pendingDelete.type === "studyTask" ? current.tasks.filter((item) => item.id !== pendingDelete.id) : current.tasks,
      movements: pendingDelete.type === "income" || pendingDelete.type === "expense" ? current.movements.filter((item) => item.id !== pendingDelete.id) : current.movements,
      habits: pendingDelete.type === "habit" ? current.habits.filter((item) => item.id !== pendingDelete.id) : current.habits,
      events: pendingDelete.type === "event" ? current.events.filter((item) => item.id !== pendingDelete.id) : current.events,
      goals: pendingDelete.type === "goal" ? current.goals.filter((item) => item.id !== pendingDelete.id) : current.goals,
      budgets: pendingDelete.type === "budget" ? current.budgets.filter((item) => item.id !== pendingDelete.id) : current.budgets,
    }));
    setPendingDelete(null);
  }

  function handleClearLocalData() {
    clearLocalData();
    setData(emptyData);
    setSettingsOpen(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `north-data-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(parseImportedData(String(reader.result)));
      } catch {
        window.alert(t.importError);
      }
    };
    reader.readAsText(file);
  }

  async function syncFromCloud(userId: string) {
    setSyncStatus("loading");
    try {
      const cloudData = await loadCloudData(userId);
      if (cloudData) {
        setData(cloudData);
      } else {
        await saveCloudData(userId, data);
      }
      setCloudReady(true);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthMessage("");
    const credentials = { email: authEmail, password: authPassword };
    const { error } =
      authMode === "signIn"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (error) setAuthMessage(error.message);
    else if (authMode === "signUp") setAuthMessage(t.checkEmail);
    setAuthLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
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
            <p className="eyebrow">{todayLabel}</p>
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
            <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label={t.settings}>
              <Settings size={19} />
            </button>
          </div>
        </header>

        <section className="page-grid">
          {renderSection(active, {
            t,
            data,
            money,
            openQuick,
            deleteItem,
            setData,
            exportData,
            importData: () => importInputRef.current?.click(),
            authUser,
            authEmail,
            authPassword,
            authMode,
            authLoading,
            authMessage,
            syncStatus,
            supabaseEnabled: isSupabaseConfigured,
            setAuthEmail,
            setAuthPassword,
            setAuthMode,
            handleAuth,
            handleSignOut,
          })}
        </section>

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
      <input
        ref={importInputRef}
        className="file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importData(file);
          event.currentTarget.value = "";
        }}
      />
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
      {settingsOpen && (
        <SettingsDialog
          t={t}
          lang={lang}
          theme={theme}
          authUser={authUser}
          syncStatus={syncStatus}
          supabaseEnabled={isSupabaseConfigured}
          onLangChange={setLang}
          onThemeChange={setTheme}
          onExport={exportData}
          onImport={() => importInputRef.current?.click()}
          onClearLocalData={handleClearLocalData}
          onSignOut={handleSignOut}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={t.confirmDelete}
          body={t.confirmDeleteBody}
          cancelLabel={t.cancel}
          confirmLabel={t.delete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
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
  exportData: () => void;
  importData: () => void;
  authUser: User | null;
  authEmail: string;
  authPassword: string;
  authMode: AuthMode;
  authLoading: boolean;
  authMessage: string;
  syncStatus: SyncStatus;
  supabaseEnabled: boolean;
  setAuthEmail: Dispatch<SetStateAction<string>>;
  setAuthPassword: Dispatch<SetStateAction<string>>;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  handleAuth: (event: FormEvent<HTMLFormElement>) => void;
  handleSignOut: () => void;
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

function HomeView({
  t,
  data,
  money,
  openQuick,
  deleteItem,
  setData,
  exportData,
  importData,
  authUser,
  authEmail,
  authPassword,
  authMode,
  authLoading,
  authMessage,
  syncStatus,
  supabaseEnabled,
  setAuthEmail,
  setAuthPassword,
  setAuthMode,
  handleAuth,
  handleSignOut,
}: ViewProps) {
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
      <Panel title={t.cloudSync} icon={Sparkles} viewLabel={t.view} className="span-12">
        <AuthPanel
          t={t}
          user={authUser}
          email={authEmail}
          password={authPassword}
          mode={authMode}
          loading={authLoading}
          message={authMessage}
          syncStatus={syncStatus}
          enabled={supabaseEnabled}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onModeChange={setAuthMode}
          onSubmit={handleAuth}
          onSignOut={handleSignOut}
        />
      </Panel>
      <Panel title={t.labels.dataPortability} icon={Download} viewLabel={t.view} className="span-12">
        <div className="data-tools">
          <span>{t.labels.dataPortabilityBody}</span>
          <div>
            <button className="ghost-button" onClick={exportData}>
              <Download size={16} />
              {t.exportData}
            </button>
            <button className="ghost-button" onClick={importData}>
              <Upload size={16} />
              {t.importData}
            </button>
          </div>
        </div>
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
      <Panel title={t.labels.charts} icon={CircleDollarSign} viewLabel={t.view} className="span-12">
        <FinanceCharts t={t} movements={data.movements} money={money} />
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
  const [mode, setMode] = useState<CalendarMode>("day");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const selected = new Date(`${selectedDate}T00:00:00`);
  const eventsForDay = data.events.filter((event) => event.date === selectedDate);
  const weekStart = startOfWeek(selected);
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <>
      <Panel title={t.labels.todayAgenda} icon={Clock3} viewLabel={t.view} className="span-12">
        <div className="calendar-toolbar">
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <div className="segmented-control">
            {(["day", "week", "month"] as CalendarMode[]).map((item) => (
              <button className={mode === item ? "active" : ""} key={item} onClick={() => setMode(item)}>
                {item === "day" ? t.labels.calendarDay : item === "week" ? t.labels.calendarWeek : t.labels.calendarMonth}
              </button>
            ))}
          </div>
        </div>
        {mode === "day" && (
          <div className="calendar-detail">
            <EventList t={t} events={eventsForDay} openQuick={openQuick} deleteItem={deleteItem} emptyMessage={t.labels.noEventsForDate} />
          </div>
        )}
        {mode === "week" && (
          <div className="calendar-week">
            {week.map((day) => {
              const key = dateKey(day);
              const count = data.events.filter((event) => event.date === key).length;
              return (
                <button className={key === selectedDate ? "active" : ""} key={key} onClick={() => setSelectedDate(key)}>
                  <strong>{day.toLocaleDateString(t.locale, { weekday: "short" })}</strong>
                  <span>{day.getDate()}</span>
                  <b>{count}</b>
                </button>
              );
            })}
          </div>
        )}
        {mode === "month" && (
          <div className="calendar-month">
            {monthGridDays(selected).map((day, index) => {
              if (!day) return <span className="calendar-empty-day" key={`empty-${index}`} />;
              const key = dateKey(day);
              const count = data.events.filter((event) => event.date === key).length;
              return (
                <button className={key === selectedDate ? "active" : ""} key={key} onClick={() => setSelectedDate(key)}>
                  <span>{day.getDate()}</span>
                  {count > 0 && <b>{count}</b>}
                </button>
              );
            })}
          </div>
        )}
      </Panel>
      <Panel title={t.labels.thisWeek} icon={CalendarDays} viewLabel={t.view} className="span-12">
        <EventList t={t} events={data.events} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
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
      <Panel title={t.labels.progressTracking} icon={Target} viewLabel={t.view} className="span-12">
        <BarChart
          title={t.labels.progressTracking}
          rows={data.goals.map((goal) => ({ label: goal.title, value: goal.progress }))}
          money={{ format: (value: number) => `${value}%` } as Intl.NumberFormat}
        />
      </Panel>
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

function SettingsDialog({
  t,
  lang,
  theme,
  authUser,
  syncStatus,
  supabaseEnabled,
  onLangChange,
  onThemeChange,
  onExport,
  onImport,
  onClearLocalData,
  onSignOut,
  onClose,
}: {
  t: (typeof copy)[Lang];
  lang: Lang;
  theme: Theme;
  authUser: User | null;
  syncStatus: SyncStatus;
  supabaseEnabled: boolean;
  onLangChange: Dispatch<SetStateAction<Lang>>;
  onThemeChange: Dispatch<SetStateAction<Theme>>;
  onExport: () => void;
  onImport: () => void;
  onClearLocalData: () => void;
  onSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="settings-modal">
        <header>
          <h2 id="settings-title">{t.settings}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t.closeMenu}>
            <X size={19} />
          </button>
        </header>

        <section className="settings-section">
          <h3>{t.language}</h3>
          <div className="segmented-control settings-segment">
            <button className={lang === "es" ? "active" : ""} onClick={() => onLangChange("es")}>Español</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => onLangChange("en")}>English</button>
          </div>
        </section>

        <section className="settings-section">
          <h3>{t.appearance}</h3>
          <div className="segmented-control settings-segment">
            <button className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}>{t.lightTheme}</button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}>{t.darkTheme}</button>
          </div>
        </section>

        <section className="settings-section">
          <h3>{t.cloudSync}</h3>
          <div className="settings-row">
            <span>{authUser ? `${t.signedInAs} ${authUser.email}` : supabaseEnabled ? t.syncDisabled : t.authHint}</span>
            <span className="sync-pill">{syncLabel(t, syncStatus)}</span>
          </div>
          {authUser && (
            <button className="ghost-button" onClick={onSignOut}>
              {t.signOut}
            </button>
          )}
        </section>

        <section className="settings-section">
          <h3>{t.dataManagement}</h3>
          <div className="settings-actions">
            <button className="ghost-button" onClick={onExport}>
              <Download size={16} />
              {t.exportData}
            </button>
            <button className="ghost-button" onClick={onImport}>
              <Upload size={16} />
              {t.importData}
            </button>
          </div>
        </section>

        <section className="settings-section danger-section">
          <h3>{t.dangerZone}</h3>
          <p>{t.clearLocalDataBody}</p>
          <button
            className="primary-button danger"
            onClick={() => {
              if (window.confirm(t.clearLocalDataBody)) onClearLocalData();
            }}
          >
            {t.clearLocalData}
          </button>
        </section>

        <section className="settings-section">
          <h3>{t.about}</h3>
          <p>North · {t.appVersion}</p>
          <p>silvicodes · ReadyCreation</p>
        </section>
      </div>
    </div>
  );
}

function AuthPanel({
  t,
  user,
  email,
  password,
  mode,
  loading,
  message,
  syncStatus,
  enabled,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
  onSignOut,
}: {
  t: (typeof copy)[Lang];
  user: User | null;
  email: string;
  password: string;
  mode: AuthMode;
  loading: boolean;
  message: string;
  syncStatus: SyncStatus;
  enabled: boolean;
  onEmailChange: Dispatch<SetStateAction<string>>;
  onPasswordChange: Dispatch<SetStateAction<string>>;
  onModeChange: Dispatch<SetStateAction<AuthMode>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
}) {
  if (!enabled) {
    return (
      <div className="auth-panel">
        <div>
          <strong>{t.localMode}</strong>
          <span>{t.authHint}</span>
        </div>
        <span className="sync-pill">{t.syncDisabled}</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-panel">
        <div>
          <strong>{t.signedInAs}</strong>
          <span>{user.email}</span>
        </div>
        <span className="sync-pill">{syncLabel(t, syncStatus)}</span>
        <button className="ghost-button" onClick={onSignOut}>
          {t.signOut}
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>{t.email}</span>
        <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required />
      </label>
      <label>
        <span>{t.password}</span>
        <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required minLength={6} />
      </label>
      {message && <span className="auth-message">{message}</span>}
      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={() => onModeChange(mode === "signIn" ? "signUp" : "signIn")}>
          {mode === "signIn" ? t.createAccount : t.haveAccount}
        </button>
        <button type="submit" className="primary-button" disabled={loading}>
          {mode === "signIn" ? t.signIn : t.signUp}
        </button>
      </div>
    </form>
  );
}

function syncLabel(t: (typeof copy)[Lang], status: SyncStatus) {
  if (status === "saving") return t.syncSaving;
  if (status === "synced") return t.syncReady;
  if (status === "loading") return t.syncSaving;
  return t.syncDisabled;
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

function FinanceCharts({
  t,
  movements,
  money,
}: {
  t: (typeof copy)[Lang];
  movements: Movement[];
  money: Intl.NumberFormat;
}) {
  const income = movements.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = movements
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((totals, movement) => {
      totals[movement.category] = (totals[movement.category] ?? 0) + movement.amount;
      return totals;
    }, {});

  return (
    <div className="chart-grid">
      <BarChart
        title={t.labels.incomeVsExpenses}
        rows={[
          { label: t.labels.income, value: income },
          { label: t.labels.expenses, value: expenses },
        ]}
        money={money}
      />
      <BarChart
        title={t.labels.spendingByCategory}
        rows={Object.entries(categoryTotals).map(([label, value]) => ({ label, value }))}
        money={money}
      />
    </div>
  );
}

function BarChart({ title, rows, money }: { title: string; rows: { label: string; value: number }[]; money: { format: (value: number) => string } }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (!rows.length) {
    return (
      <div className="chart-card">
        <strong>{title}</strong>
        <span>0</span>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <strong>{title}</strong>
      {rows.map((row) => (
        <div className="chart-row" key={row.label}>
          <div>
            <span>{row.label}</span>
            <b>{money.format(row.value)}</b>
          </div>
          <div className="chart-track">
            <span style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
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
  emptyMessage,
}: {
  t: (typeof copy)[Lang];
  events: EventItem[];
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
  emptyMessage?: string;
}) {
  if (!events.length) return <EmptyState t={t} type="event" openQuick={openQuick} message={emptyMessage} />;

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

function EmptyState({ t, type, openQuick, message }: { t: (typeof copy)[Lang]; type: QuickType; openQuick: (type?: QuickType, id?: string) => void; message?: string }) {
  return (
    <div className="empty-state">
      <strong>{t.empty.title}</strong>
      <span>{message ?? t.empty.body}</span>
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

function ConfirmDialog({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-modal">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="primary-button danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
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
