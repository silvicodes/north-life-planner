import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Clock3,
  Download,
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
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Upload,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
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
  Project,
  ProjectLifecycleStatus,
  ProjectPaymentStatus,
  ProjectStatus,
  ProjectTask,
  QuickType,
  Section,
  Task,
  Theme,
} from "./types";
import { copy } from "./i18n/copy";
import type { User } from "@supabase/supabase-js";
import { ConfirmDialog, EmptyState, ItemActions, Metric, MetricRow, Panel, PriorityPill, ProgressRing } from "./components/common";
import { Onboarding } from "./components/Onboarding";
import { QuickAdd } from "./components/QuickAdd";

const icons = {
  inicio: Home,
  finanzas: CircleDollarSign,
  proyectos: BriefcaseBusiness,
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
type ToastState = {
  message: string;
  tone: "success" | "info";
} | null;

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentMonthKey() {
  return todayKey().slice(0, 7);
}

function sharedOwnAmount(movement: Movement) {
  return movement.amount * ((movement.ownerSharePercent ?? 100) / 100);
}

function sharedOtherAmount(movement: Movement) {
  return Math.max(0, movement.amount - sharedOwnAmount(movement));
}

function sharedSettlementAmount(movement: Movement) {
  if (movement.expenseKind !== "shared") return 0;
  return movement.paidBy === "other" ? -sharedOwnAmount(movement) : sharedOtherAmount(movement);
}

function isAppEmpty(data: AppData) {
  return Object.values(data).every((items) => items.length === 0);
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
  const [toast, setToast] = useState<ToastState>(null);
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  function notify(message: string, tone: NonNullable<ToastState>["tone"] = "success") {
    setToast({ message, tone });
  }

  function saveItem(type: QuickType, payload: Record<string, FormDataEntryValue>) {
    setData((current) => {
      if (type === "income" || type === "expense") {
        const amount = Math.max(0, Number(payload.amount) || 0);
        const expenseKind = type === "expense" && payload.expenseKind === "shared" ? "shared" : "individual";
        const ownerSharePercent = expenseKind === "shared" ? Math.min(100, Math.max(0, Number(payload.ownerSharePercent) || 50)) : 100;
        const paidBy = expenseKind === "shared" && payload.paidBy === "other" ? "other" : "me";
        const movement: Movement = {
          id: editingId ?? createId(),
          title: String(payload.title || t.quick[type]),
          category: String(payload.category || t.nav.finanzas),
          amount,
          type,
          date: String(payload.date || todayKey()),
          expenseKind,
          sharedWith: expenseKind === "shared" ? String(payload.sharedWith || "") : "",
          ownerSharePercent,
          paidBy,
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
    notify(editingId ? t.savedChanges : t.savedItem);
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
    notify(t.deletedItem, "info");
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
            notify,
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
      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          <CheckCircle2 size={17} />
          <span>{toast.message}</span>
        </div>
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
  notify: (message: string, tone?: NonNullable<ToastState>["tone"]) => void;
};

function renderSection(active: Section, props: ViewProps) {
  switch (active) {
    case "finanzas":
      return <FinanceView {...props} />;
    case "proyectos":
      return <ProjectsView {...props} />;
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
  const appEmpty = isAppEmpty(data);

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
      {appEmpty ? (
        <Onboarding t={t} openQuick={openQuick} />
      ) : (
        <>
          <Panel title={t.labels.priorities} icon={Target} className="span-4" action={<button className="ghost-button" onClick={() => openQuick("task")}><Plus size={16} />{t.quick.task}</button>}>
            <TaskList t={t} tasks={data.tasks.slice(0, 4)} setData={setData} emptyType="task" openQuick={openQuick} deleteItem={deleteItem} />
          </Panel>
          <Panel title={t.labels.monthFinance} icon={CircleDollarSign} className="span-4" action={<button className="ghost-button" onClick={() => openQuick("expense")}><Plus size={16} />{t.quick.expense}</button>}>
            <MetricRow label={t.labels.income} value={money.format(income)} positive />
            <MetricRow label={t.labels.expenses} value={money.format(expenses)} />
            <MetricRow label={t.labels.plannedSavings} value={money.format(balance)} positive={balance >= 0} />
          </Panel>
          <Panel title={t.labels.academicTasks} icon={BookOpen} className="span-4" action={<button className="ghost-button" onClick={() => openQuick("studyTask")}><Plus size={16} />{t.quick.studyTask}</button>}>
            <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios").slice(0, 3)} setData={setData} emptyType="studyTask" openQuick={openQuick} deleteItem={deleteItem} />
          </Panel>
          <Panel title={t.labels.habits} icon={Flame} className="span-4" action={<button className="ghost-button" onClick={() => openQuick("habit")}><Plus size={16} />{t.quick.habit}</button>}>
            <HabitGrid t={t} habits={data.habits} setData={setData} openQuick={openQuick} deleteItem={deleteItem} />
          </Panel>
          <Panel title={t.labels.todayAgenda} icon={CalendarDays} className="span-12" action={<button className="ghost-button" onClick={() => openQuick("event")}><Plus size={16} />{t.addEvent}</button>}>
            <EventList t={t} events={data.events} openQuick={openQuick} deleteItem={deleteItem} />
          </Panel>
        </>
      )}
      <Panel title={t.cloudSync} icon={Sparkles} className="span-12">
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
      <Panel title={t.labels.dataPortability} icon={Download} className="span-12">
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
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [movementCategory, setMovementCategory] = useState("all");
  const [movementType, setMovementType] = useState<"all" | "income" | "expense">("all");
  const income = data.movements.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const averageExpense = data.movements.filter((item) => item.type === "expense").length ? expenses / data.movements.filter((item) => item.type === "expense").length : 0;
  const monthlyMovements = data.movements.filter((item) => item.date.startsWith(selectedMonth));
  const monthlyExpenses = data.movements.filter((item) => item.type === "expense" && item.date.startsWith(selectedMonth));
  const individualTotal = monthlyExpenses
    .filter((item) => item.expenseKind !== "shared")
    .reduce((sum, item) => sum + item.amount, 0);
  const sharedExpenses = monthlyExpenses.filter((item) => item.expenseKind === "shared");
  const sharedTotal = sharedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const ownSharedTotal = sharedExpenses.reduce((sum, item) => sum + sharedOwnAmount(item), 0);
  const pendingBalance = sharedExpenses.reduce((sum, item) => sum + sharedSettlementAmount(item), 0);
  const monthlyTotal = individualTotal + ownSharedTotal;
  const categories = Array.from(new Set(data.movements.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredMovements = monthlyMovements.filter((movement) => {
    const categoryMatch = movementCategory === "all" || movement.category === movementCategory;
    const typeMatch = movementType === "all" || movement.type === movementType;
    return categoryMatch && typeMatch;
  });

  return (
    <>
      <Panel
        title={t.labels.monthlyExpenses}
        icon={Users}
        className="span-12 panel-featured"
        action={
          <button className="primary-button compact" onClick={() => openQuick("expense")}>
            <Plus size={16} />
            {t.labels.addExpense}
          </button>
        }
      >
        <MonthlyExpenseSummary
          t={t}
          money={money}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          monthlyTotal={monthlyTotal}
          individualTotal={individualTotal}
          sharedTotal={sharedTotal}
          pendingBalance={pendingBalance}
          monthlyExpenses={monthlyExpenses}
          sharedExpenses={sharedExpenses}
          openQuick={openQuick}
        />
      </Panel>
      <Panel title={t.labels.summary} icon={WalletCards} className="span-4">
        <MetricRow label={t.labels.estimatedBalance} value={money.format(balance)} positive={balance >= 0} />
        <MetricRow label={t.labels.averageDailySpend} value={money.format(averageExpense)} />
        <MetricRow label={t.labels.savingsGoal} value={String(data.goals.length)} positive />
      </Panel>
      <Panel
        title={t.labels.budgets}
        icon={Target}
        className="span-8"
        action={
          <button className="ghost-button" onClick={() => openQuick("budget")}>
            <Plus size={16} />
            {t.addBudget}
          </button>
        }
      >
        <BudgetList t={t} budgets={data.budgets} movements={data.movements} selectedMonth={selectedMonth} money={money} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.charts} icon={CircleDollarSign} className="span-12">
        <FinanceCharts t={t} movements={data.movements} money={money} />
      </Panel>
      <Panel title={t.labels.recentMovements} icon={CircleDollarSign} className="span-12">
        <MovementFilters
          t={t}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          category={movementCategory}
          onCategoryChange={setMovementCategory}
          type={movementType}
          onTypeChange={setMovementType}
          categories={categories}
        />
        <MovementList t={t} movements={filteredMovements} money={money} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function MonthlyExpenseSummary({
  t,
  money,
  selectedMonth,
  onMonthChange,
  monthlyTotal,
  individualTotal,
  sharedTotal,
  pendingBalance,
  monthlyExpenses,
  sharedExpenses,
  openQuick,
}: {
  t: (typeof copy)[Lang];
  money: Intl.NumberFormat;
  selectedMonth: string;
  onMonthChange: Dispatch<SetStateAction<string>>;
  monthlyTotal: number;
  individualTotal: number;
  sharedTotal: number;
  pendingBalance: number;
  monthlyExpenses: Movement[];
  sharedExpenses: Movement[];
  openQuick: (type?: QuickType, id?: string) => void;
}) {
  const pendingByPerson = sharedExpenses.reduce<Record<string, number>>((totals, expense) => {
    const person = expense.sharedWith || t.labels.sharedPersonFallback;
    totals[person] = (totals[person] ?? 0) + sharedSettlementAmount(expense);
    return totals;
  }, {});

  return (
    <div className="monthly-expenses">
      <div className="finance-toolbar">
        <input type="month" value={selectedMonth} onChange={(event) => onMonthChange(event.target.value)} aria-label={t.labels.monthSelector} />
      </div>
      {monthlyExpenses.length ? (
        <>
          <div className="monthly-summary-grid">
            <MetricRow label={t.labels.netMonthlySpend} value={money.format(monthlyTotal)} />
            <MetricRow label={t.labels.totalIndividual} value={money.format(individualTotal)} />
            <MetricRow label={t.labels.sharedGross} value={money.format(sharedTotal)} />
            <MetricRow label={settlementLabel(t, pendingBalance)} value={money.format(Math.abs(pendingBalance))} positive={pendingBalance > 0} />
          </div>
          <div className="shared-balance-list">
            {Object.keys(pendingByPerson).length > 0 ? (
              Object.entries(pendingByPerson).map(([person, amount]) => (
                <button key={person} onClick={() => {
                  const expense = sharedExpenses.find((item) => (item.sharedWith || t.labels.sharedPersonFallback) === person);
                  if (expense) openQuick("expense", expense.id);
                }}>
                  <strong>{person}</strong>
                  <span>{amount >= 0 ? t.labels.owedToYou : t.labels.youOwe} {money.format(Math.abs(amount))}</span>
                </button>
              ))
            ) : (
              <span>{t.labels.settlementNeutral}</span>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          t={t}
          type="expense"
          openQuick={openQuick}
          title={t.labels.noMonthlyExpensesTitle}
          message={t.labels.noMonthlyExpensesBody}
          cta={t.labels.addExpense}
        />
      )}
    </div>
  );
}

function MovementFilters({
  t,
  selectedMonth,
  onMonthChange,
  category,
  onCategoryChange,
  type,
  onTypeChange,
  categories,
}: {
  t: (typeof copy)[Lang];
  selectedMonth: string;
  onMonthChange: Dispatch<SetStateAction<string>>;
  category: string;
  onCategoryChange: Dispatch<SetStateAction<string>>;
  type: "all" | "income" | "expense";
  onTypeChange: Dispatch<SetStateAction<"all" | "income" | "expense">>;
  categories: string[];
}) {
  return (
    <div className="movement-filters" aria-label={t.labels.movementFilters}>
      <label>
        <span>{t.labels.monthSelector}</span>
        <input type="month" value={selectedMonth} onChange={(event) => onMonthChange(event.target.value)} />
      </label>
      <label>
        <span>{t.labels.filterByCategory}</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="all">{t.labels.allCategories}</option>
          {categories.map((item) => (
            <option value={item} key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span>{t.labels.filterByType}</span>
        <select value={type} onChange={(event) => onTypeChange(event.target.value as "all" | "income" | "expense")}>
          <option value="all">{t.labels.allMovements}</option>
          <option value="income">{t.labels.income}</option>
          <option value="expense">{t.labels.expenses}</option>
        </select>
      </label>
    </div>
  );
}

function settlementLabel(t: (typeof copy)[Lang], value: number) {
  if (value > 0) return t.labels.owedToYou;
  if (value < 0) return t.labels.youOwe;
  return t.labels.settlementNeutral;
}

function ProjectsView({ t, data, money, setData, notify }: ViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(data.projects[0]?.id ?? "");
  const [projectDialog, setProjectDialog] = useState<{ id?: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState<"active" | "all" | "archived">("active");
  const [clientFilter, setClientFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | ProjectPaymentStatus>("all");
  const visibleProjects = data.projects.filter((project) => {
    const archiveMatch =
      projectFilter === "all" || (projectFilter === "archived" ? project.status === "archived" : project.status !== "archived");
    const clientMatch = clientFilter === "all" || project.client === clientFilter;
    const paymentMatch = paymentFilter === "all" || project.paymentStatus === paymentFilter;
    return archiveMatch && clientMatch && paymentMatch;
  });
  const clients = Array.from(new Set(data.projects.map((project) => project.client).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) ?? visibleProjects[0] ?? null;
  const selectedProjectTasks = selectedProject?.tasks ?? [];
  const activeProjects = data.projects.filter((project) => project.status !== "archived" && project.status !== "delivered").length;
  const blockedTasks = data.projects.reduce((sum, project) => sum + project.tasks.filter((task) => task.status === "blocked").length, 0);
  const pendingRevenue = data.projects
    .filter((project) => project.paymentStatus !== "paid")
    .reduce((sum, project) => sum + project.budget, 0);
  const upcomingItems = projectTimeline(data.projects);

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const existing = projectDialog?.id ? data.projects.find((project) => project.id === projectDialog.id) : null;
    const templateTasks = projectTemplates(t).find((template) => template.id === form.get("template"))?.tasks ?? [];
    const project: Project = {
      id: existing?.id ?? createId(),
      name: String(form.get("name") || t.projects.untitledProject),
      client: String(form.get("client") || ""),
      budget: Math.max(0, Number(form.get("budget")) || 0),
      deadline: String(form.get("deadline") || ""),
      priority: String(form.get("priority") || "medium") as PriorityKey,
      status: String(form.get("status") || "active") as ProjectLifecycleStatus,
      paymentStatus: String(form.get("paymentStatus") || "pending") as ProjectPaymentStatus,
      estimatedHours: Math.max(0, Number(form.get("estimatedHours")) || 0),
      actualHours: Math.max(0, Number(form.get("actualHours")) || 0),
      notes: String(form.get("notes") || ""),
      tasks: existing?.tasks ?? templateTasks.map((task) => ({ ...task, id: createId() })),
    };

    setData((current) => ({
      ...current,
      projects: existing
        ? current.projects.map((item) => (item.id === project.id ? project : item))
        : [project, ...current.projects],
      movements:
        project.paymentStatus === "paid" && project.budget > 0 && existing?.paymentStatus !== "paid"
          ? [
              {
                id: createId(),
                title: `${t.projects.incomeFromProject}: ${project.name}`,
                category: t.projects.title,
                amount: project.budget,
                type: "income",
                date: todayKey(),
                expenseKind: "individual",
              },
              ...current.movements,
            ]
          : current.movements,
    }));
    setSelectedProjectId(project.id);
    setProjectDialog(null);
    notify(existing ? t.savedChanges : t.projects.projectSaved);
  }

  function deleteProject(projectId: string) {
    if (!window.confirm(t.projects.deleteProjectBody)) return;
    setData((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== projectId) }));
    setSelectedProjectId("");
    notify(t.deletedItem, "info");
  }

  function addProjectTask(projectId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    const task: ProjectTask = {
      id: createId(),
      title,
      description: String(form.get("description") || ""),
      status: "todo",
      priority: String(form.get("priority") || "medium") as PriorityKey,
      dueDate: String(form.get("dueDate") || ""),
      checklist: String(form.get("checklist") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    setData((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, tasks: [task, ...project.tasks] } : project,
      ),
    }));
    event.currentTarget.reset();
    notify(t.projects.taskSaved);
  }

  function updateProjectTask(projectId: string, taskId: string, patch: Partial<ProjectTask>) {
    setData((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)) }
          : project,
      ),
    }));
  }

  function deleteProjectTask(projectId: string, taskId: string) {
    setData((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) } : project,
      ),
    }));
    notify(t.deletedItem, "info");
  }

  return (
    <>
      <Panel
        title={t.projects.title}
        icon={BriefcaseBusiness}
        className="span-4 project-sidebar-panel"
        action={
          <button className="primary-button compact" onClick={() => setProjectDialog({})}>
            <Plus size={16} />
            {t.projects.addProject}
          </button>
        }
      >
        <div className="project-summary-grid">
          <MetricRow label={t.projects.activeProjects} value={String(activeProjects)} positive />
          <MetricRow label={t.projects.blockedTasks} value={String(blockedTasks)} />
          <MetricRow label={t.projects.pendingRevenue} value={money.format(pendingRevenue)} positive={pendingRevenue > 0} />
        </div>
        <ProjectList
          t={t}
          projects={visibleProjects}
          selectedProjectId={selectedProject?.id ?? ""}
          onSelect={setSelectedProjectId}
          onEdit={(id) => setProjectDialog({ id })}
          onDelete={deleteProject}
        />
        <ProjectFilters
          t={t}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          clients={clients}
        />
      </Panel>

      <Panel
        title={selectedProject?.name ?? t.projects.board}
        icon={Target}
        className="span-8 project-board-panel"
        action={
          selectedProject ? (
            <button className="ghost-button" onClick={() => setProjectDialog({ id: selectedProject.id })}>
              {t.edit}
            </button>
          ) : undefined
        }
      >
        {selectedProject ? (
          <>
            <ProjectHeader t={t} project={selectedProject} money={money} />
            <ProjectTimeline t={t} items={upcomingItems} onSelectProject={setSelectedProjectId} />
            <form className="project-task-form" onSubmit={(event) => addProjectTask(selectedProject.id, event)}>
              <input name="title" required placeholder={t.projects.taskPlaceholder} />
              <input name="description" placeholder={t.projects.taskDescriptionPlaceholder} />
              <textarea name="checklist" placeholder={t.projects.checklistPlaceholder} />
              <input name="dueDate" type="date" aria-label={t.projects.dueDate} />
              <select name="priority" defaultValue="medium">
                <option value="high">{t.priorities.high}</option>
                <option value="medium">{t.priorities.medium}</option>
                <option value="low">{t.priorities.low}</option>
              </select>
              <button className="primary-button" type="submit">
                <Plus size={16} />
                {t.projects.addTask}
              </button>
            </form>
            <ProjectBoard
              t={t}
              project={selectedProject}
              tasks={selectedProjectTasks}
              onUpdateTask={(taskId, patch) => updateProjectTask(selectedProject.id, taskId, patch)}
              onDeleteTask={(taskId) => deleteProjectTask(selectedProject.id, taskId)}
            />
          </>
        ) : (
          <div className="project-empty">
            <strong>{t.projects.emptyTitle}</strong>
            <span>{t.projects.emptyBody}</span>
            <button className="primary-button" onClick={() => setProjectDialog({})}>
              <Plus size={16} />
              {t.projects.addProject}
            </button>
          </div>
        )}
      </Panel>

      {projectDialog && (
        <ProjectDialog
          t={t}
          project={projectDialog.id ? data.projects.find((project) => project.id === projectDialog.id) ?? null : null}
          onSubmit={saveProject}
          onClose={() => setProjectDialog(null)}
        />
      )}
    </>
  );
}

function ProjectList({
  t,
  projects,
  selectedProjectId,
  onSelect,
  onEdit,
  onDelete,
}: {
  t: (typeof copy)[Lang];
  projects: Project[];
  selectedProjectId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!projects.length) {
    return (
      <div className="project-list-empty">
        <span>{t.projects.noProjects}</span>
      </div>
    );
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <div className={`project-list-item ${project.id === selectedProjectId ? "active" : ""}`} key={project.id}>
          <button onClick={() => onSelect(project.id)}>
            <strong>{project.name}</strong>
            <span>{project.client || t.projects.noClient} · {projectProgress(project)}%</span>
          </button>
          <ItemActions editLabel={t.edit} deleteLabel={t.delete} onEdit={() => onEdit(project.id)} onDelete={() => onDelete(project.id)} />
        </div>
      ))}
    </div>
  );
}

function ProjectFilters({
  t,
  projectFilter,
  onProjectFilterChange,
  clientFilter,
  onClientFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  clients,
}: {
  t: (typeof copy)[Lang];
  projectFilter: "active" | "all" | "archived";
  onProjectFilterChange: Dispatch<SetStateAction<"active" | "all" | "archived">>;
  clientFilter: string;
  onClientFilterChange: Dispatch<SetStateAction<string>>;
  paymentFilter: "all" | ProjectPaymentStatus;
  onPaymentFilterChange: Dispatch<SetStateAction<"all" | ProjectPaymentStatus>>;
  clients: string[];
}) {
  return (
    <div className="project-filters">
      <select value={projectFilter} onChange={(event) => onProjectFilterChange(event.target.value as "active" | "all" | "archived")}>
        <option value="active">{t.projects.filters.active}</option>
        <option value="archived">{t.projects.filters.archived}</option>
        <option value="all">{t.projects.filters.all}</option>
      </select>
      <select value={clientFilter} onChange={(event) => onClientFilterChange(event.target.value)}>
        <option value="all">{t.projects.filters.allClients}</option>
        {clients.map((client) => (
          <option value={client} key={client}>{client}</option>
        ))}
      </select>
      <select value={paymentFilter} onChange={(event) => onPaymentFilterChange(event.target.value as "all" | ProjectPaymentStatus)}>
        <option value="all">{t.projects.filters.allPayments}</option>
        <option value="pending">{t.projects.paymentStatuses.pending}</option>
        <option value="partial">{t.projects.paymentStatuses.partial}</option>
        <option value="paid">{t.projects.paymentStatuses.paid}</option>
      </select>
    </div>
  );
}

function ProjectHeader({ t, project, money }: { t: (typeof copy)[Lang]; project: Project; money: Intl.NumberFormat }) {
  const hourlyRate = project.actualHours > 0 ? project.budget / project.actualHours : 0;
  return (
    <div className="project-header">
      <div>
        <span>{t.projects.client}</span>
        <strong>{project.client || t.projects.noClient}</strong>
      </div>
      <div>
        <span>{t.projects.deadline}</span>
        <strong>{project.deadline || t.noDate}</strong>
      </div>
      <div>
        <span>{t.projects.payment}</span>
        <strong>{t.projects.paymentStatuses[project.paymentStatus]}</strong>
      </div>
      <div>
        <span>{t.projects.status}</span>
        <strong>{t.projects.projectStatuses[project.status]}</strong>
      </div>
      <div>
        <span>{t.projects.budget}</span>
        <strong>{money.format(project.budget)}</strong>
      </div>
      <div>
        <span>{t.projects.hours}</span>
        <strong>{project.actualHours}/{project.estimatedHours || 0}h</strong>
      </div>
      <div>
        <span>{t.projects.effectiveRate}</span>
        <strong>{hourlyRate ? `${money.format(hourlyRate)}/h` : t.projects.notEnoughData}</strong>
      </div>
      <div>
        <span>{t.progress}</span>
        <strong>{projectProgress(project)}%</strong>
      </div>
    </div>
  );
}

function ProjectTimeline({
  t,
  items,
  onSelectProject,
}: {
  t: (typeof copy)[Lang];
  items: { projectId: string; projectName: string; title: string; date: string; tone: "late" | "soon" | "blocked" }[];
  onSelectProject: (id: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="project-timeline">
      <strong>{t.projects.timeline}</strong>
      <div>
        {items.slice(0, 6).map((item) => (
          <button className={item.tone} key={`${item.projectId}-${item.title}-${item.date}`} onClick={() => onSelectProject(item.projectId)}>
            <span>{item.title}</span>
            <small>{item.projectName} · {item.date || t.projects.blockedTasks}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectBoard({
  t,
  project,
  tasks,
  onUpdateTask,
  onDeleteTask,
}: {
  t: (typeof copy)[Lang];
  project: Project;
  tasks: ProjectTask[];
  onUpdateTask: (taskId: string, patch: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const columns: ProjectStatus[] = ["todo", "inProgress", "blocked", "done"];

  return (
    <div className="kanban-board">
      {columns.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            className="kanban-column"
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/plain");
              if (taskId) onUpdateTask(taskId, { status });
            }}
          >
            <header>
              <strong>{t.projects.statuses[status]}</strong>
              <span>{columnTasks.length}</span>
            </header>
            {columnTasks.length ? (
              columnTasks.map((task) => (
                <article
                  className="project-task-card"
                  key={task.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  {task.checklist.length > 0 && (
                    <ul className="project-checklist">
                      {task.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <div className="project-task-meta">
                    <PriorityPill label={t.priorities[task.priority]} value={task.priority} />
                    <span>{task.dueDate || t.noDate}</span>
                  </div>
                  <div className="project-task-actions">
                    <select value={task.status} onChange={(event) => onUpdateTask(task.id, { status: event.target.value as ProjectStatus })}>
                      {columns.map((item) => (
                        <option value={item} key={item}>{t.projects.statuses[item]}</option>
                      ))}
                    </select>
                    <button className="icon-button small danger" onClick={() => onDeleteTask(task.id)} aria-label={t.delete}>
                      <X size={15} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <span className="kanban-empty">{status === "todo" ? t.projects.dropFirstTask : t.projects.noTasksInColumn}</span>
            )}
          </section>
        );
      })}
      {!project.tasks.length && <span className="project-board-hint">{t.projects.noTasksYet}</span>}
    </div>
  );
}

function ProjectDialog({
  t,
  project,
  onSubmit,
  onClose,
}: {
  t: (typeof copy)[Lang];
  project: Project | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const [template, setTemplate] = useState("blank");
  const templates = projectTemplates(t);
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
      <div className="quick-modal context-modal">
        <header>
          <div className="modal-title-block">
            <span className="modal-icon">
              <BriefcaseBusiness size={18} />
            </span>
            <div>
              <h2 id="project-dialog-title">{project ? t.projects.editProject : t.projects.addProject}</h2>
              <p>{t.projects.projectModalBody}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t.closeMenu}>
            <X size={19} />
          </button>
        </header>
        <form className="quick-form context-form" onSubmit={onSubmit}>
          {!project && (
            <label>
              <span>{t.projects.template}</span>
              <select value={template} onChange={(event) => setTemplate(event.target.value)}>
                {templates.map((item) => (
                  <option value={item.id} key={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          )}
          <input type="hidden" name="template" value={template} />
          <label>
            <span>{t.projects.projectName}</span>
            <input name="name" required defaultValue={project?.name} placeholder={t.projects.projectNamePlaceholder} />
          </label>
          <label>
            <span>{t.projects.client}</span>
            <input name="client" defaultValue={project?.client} placeholder={t.projects.clientPlaceholder} />
          </label>
          <label>
            <span>{t.projects.budget}</span>
            <input name="budget" type="number" min="0" step="0.01" defaultValue={project?.budget ? String(project.budget) : ""} placeholder={t.placeholders.amount} />
          </label>
          <label>
            <span>{t.projects.deadline}</span>
            <input name="deadline" type="date" defaultValue={project?.deadline} />
          </label>
          <label>
            <span>{t.projects.status}</span>
            <select name="status" defaultValue={project?.status ?? "active"}>
              <option value="lead">{t.projects.projectStatuses.lead}</option>
              <option value="active">{t.projects.projectStatuses.active}</option>
              <option value="review">{t.projects.projectStatuses.review}</option>
              <option value="delivered">{t.projects.projectStatuses.delivered}</option>
              <option value="archived">{t.projects.projectStatuses.archived}</option>
            </select>
          </label>
          <label>
            <span>{t.progress}</span>
            <select name="priority" defaultValue={project?.priority ?? "medium"}>
              <option value="high">{t.priorities.high}</option>
              <option value="medium">{t.priorities.medium}</option>
              <option value="low">{t.priorities.low}</option>
            </select>
          </label>
          <label>
            <span>{t.projects.payment}</span>
            <select name="paymentStatus" defaultValue={project?.paymentStatus ?? "pending"}>
              <option value="pending">{t.projects.paymentStatuses.pending}</option>
              <option value="partial">{t.projects.paymentStatuses.partial}</option>
              <option value="paid">{t.projects.paymentStatuses.paid}</option>
            </select>
          </label>
          <label>
            <span>{t.projects.estimatedHours}</span>
            <input name="estimatedHours" type="number" min="0" step="0.25" defaultValue={project?.estimatedHours ? String(project.estimatedHours) : ""} />
          </label>
          <label>
            <span>{t.projects.actualHours}</span>
            <input name="actualHours" type="number" min="0" step="0.25" defaultValue={project?.actualHours ? String(project.actualHours) : ""} />
          </label>
          <label>
            <span>{t.projects.notes}</span>
            <textarea name="notes" defaultValue={project?.notes} placeholder={t.projects.notesPlaceholder} />
          </label>
          <div className="form-actions">
            <button type="button" className="ghost-button" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="primary-button">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function projectProgress(project: Project) {
  if (!project.tasks.length) return 0;
  return Math.round((project.tasks.filter((task) => task.status === "done").length / project.tasks.length) * 100);
}

function projectTimeline(projects: Project[]) {
  const today = new Date(`${todayKey()}T00:00:00`).getTime();
  const weekAhead = today + 7 * 24 * 60 * 60 * 1000;
  return projects
    .flatMap((project) => {
      const deadline = project.deadline ? new Date(`${project.deadline}T00:00:00`).getTime() : 0;
      const projectItem =
        deadline && project.status !== "archived" && project.status !== "delivered" && deadline <= weekAhead
          ? [{
              projectId: project.id,
              projectName: project.name,
              title: project.deadline < todayKey() ? `${project.name} · overdue` : `${project.name} · deadline`,
              date: project.deadline,
              tone: deadline < today ? "late" as const : "soon" as const,
            }]
          : [];
      const taskItems = project.tasks
        .filter((task) => task.status !== "done" && (task.status === "blocked" || (task.dueDate && new Date(`${task.dueDate}T00:00:00`).getTime() <= weekAhead)))
        .map((task) => ({
          projectId: project.id,
          projectName: project.name,
          title: task.title,
          date: task.status === "blocked" ? "" : task.dueDate,
          tone: task.status === "blocked" ? "blocked" as const : new Date(`${task.dueDate}T00:00:00`).getTime() < today ? "late" as const : "soon" as const,
        }));
      return [...projectItem, ...taskItems];
    })
    .sort((a, b) => {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return a.date.localeCompare(b.date);
    });
}

function projectTemplates(t: (typeof copy)[Lang]): { id: string; label: string; tasks: Omit<ProjectTask, "id">[] }[] {
  const base = { description: "", status: "todo" as ProjectStatus, priority: "medium" as PriorityKey, dueDate: "", checklist: [] };
  return [
    { id: "blank", label: t.projects.templates.blank, tasks: [] },
    {
      id: "website",
      label: t.projects.templates.website,
      tasks: [
        { ...base, title: t.projects.templateTasks.brief },
        { ...base, title: t.projects.templateTasks.structure },
        { ...base, title: t.projects.templateTasks.design },
        { ...base, title: t.projects.templateTasks.development },
        { ...base, title: t.projects.templateTasks.review },
        { ...base, title: t.projects.templateTasks.delivery },
      ],
    },
    {
      id: "branding",
      label: t.projects.templates.branding,
      tasks: [
        { ...base, title: t.projects.templateTasks.discovery },
        { ...base, title: t.projects.templateTasks.moodboard },
        { ...base, title: t.projects.templateTasks.logo },
        { ...base, title: t.projects.templateTasks.guidelines },
        { ...base, title: t.projects.templateTasks.delivery },
      ],
    },
    {
      id: "consulting",
      label: t.projects.templates.consulting,
      tasks: [
        { ...base, title: t.projects.templateTasks.audit },
        { ...base, title: t.projects.templateTasks.session },
        { ...base, title: t.projects.templateTasks.report },
        { ...base, title: t.projects.templateTasks.followup },
      ],
    },
  ];
}

function StudyView({ t, data, openQuick, deleteItem, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.subjects} icon={GraduationCap} className="span-5">
        <EmptyState t={t} type="studyTask" openQuick={openQuick} />
      </Panel>
      <Panel title={t.labels.academicTasks} icon={BookOpen} className="span-7" action={<button className="ghost-button" onClick={() => openQuick("studyTask")}><Plus size={16} />{t.quick.studyTask}</button>}>
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "estudios")} setData={setData} emptyType="studyTask" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function DayView({ t, data, openQuick, deleteItem, setData }: ViewProps) {
  return (
    <>
      <Panel title={t.labels.todayTasks} icon={ListTodo} className="span-7" action={<button className="ghost-button" onClick={() => openQuick("task")}><Plus size={16} />{t.quick.task}</button>}>
        <TaskList t={t} tasks={data.tasks.filter((task) => task.areaKey === "dia")} setData={setData} emptyType="task" openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
      <Panel title={t.labels.habits} icon={Flame} className="span-5" action={<button className="ghost-button" onClick={() => openQuick("habit")}><Plus size={16} />{t.quick.habit}</button>}>
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
      <Panel
        title={t.labels.todayAgenda}
        icon={Clock3}
        className="span-12"
        action={
          <button className="ghost-button" onClick={() => openQuick("event")}>
            <Plus size={16} />
            {t.addEvent}
          </button>
        }
      >
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
      <Panel title={t.labels.thisWeek} icon={CalendarDays} className="span-12">
        <EventList t={t} events={data.events} openQuick={openQuick} deleteItem={deleteItem} />
      </Panel>
    </>
  );
}

function GoalsView({ t, data, openQuick, deleteItem }: ViewProps) {
  if (!data.goals.length) {
    return (
      <Panel
        title={t.labels.goals}
        icon={Target}
        className="span-12"
        action={
          <button className="ghost-button" onClick={() => openQuick("goal")}>
            <Plus size={16} />
            {t.addGoal}
          </button>
        }
      >
        <EmptyState t={t} type="goal" openQuick={openQuick} title={t.labels.noGoalsTitle} message={t.labels.noGoalsBody} cta={t.addGoal} />
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title={t.labels.progressTracking}
        icon={Target}
        className="span-12"
        action={
          <button className="ghost-button" onClick={() => openQuick("goal")}>
            <Plus size={16} />
            {t.addGoal}
          </button>
        }
      >
        <BarChart
          title={t.labels.progressTracking}
          rows={data.goals.map((goal) => ({ label: goal.title, value: goal.progress }))}
          money={{ format: (value: number) => `${value}%` } as Intl.NumberFormat}
        />
      </Panel>
      {data.goals.map((goal) => (
        <Panel title={goal.area} icon={Target} className="span-4 goal-card-panel" key={goal.id}>
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
            <span className={`sync-pill ${syncTone(syncStatus)}`}>{syncLabel(t, syncStatus)}</span>
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
        <span className="sync-pill local">{t.syncDisabled}</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-card connected">
        <div className="auth-card-icon">
          <Cloud size={20} />
        </div>
        <div className="auth-card-copy">
          <strong>{t.authConnectedTitle}</strong>
          <span>{t.signedInAs} {user.email}</span>
        </div>
        <span className={`sync-pill ${syncTone(syncStatus)}`}>{syncLabel(t, syncStatus)}</span>
        <button className="ghost-button" onClick={onSignOut}>
          {t.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <div className="auth-card-icon">
          <ShieldCheck size={20} />
        </div>
        <div className="auth-card-copy">
          <strong>{mode === "signIn" ? t.authTitle : t.authSignupTitle}</strong>
          <span>{t.authBody}</span>
        </div>
        <span className={`sync-pill ${syncTone(syncStatus)}`}>{syncLabel(t, syncStatus)}</span>
      </div>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          <span>{t.email}</span>
          <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required autoComplete="email" />
        </label>
        <label>
          <span>{t.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          />
        </label>
        {message && (
          <span className={`auth-message ${message === t.checkEmail ? "success" : "error"}`}>
            {message === t.checkEmail ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message}
          </span>
        )}
        <span className="auth-note">
          <ShieldCheck size={15} />
          {t.authSecure}
        </span>
        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={() => onModeChange(mode === "signIn" ? "signUp" : "signIn")}>
            {mode === "signIn" ? t.createAccount : t.haveAccount}
          </button>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? t.authLoading : mode === "signIn" ? t.signIn : t.signUp}
          </button>
        </div>
      </form>
    </div>
  );
}

function syncLabel(t: (typeof copy)[Lang], status: SyncStatus) {
  if (status === "saving") return t.syncSaving;
  if (status === "synced") return t.syncReady;
  if (status === "loading") return t.syncLoading;
  if (status === "error") return t.syncError;
  return t.syncDisabled;
}

function syncTone(status: SyncStatus) {
  if (status === "synced") return "success";
  if (status === "saving" || status === "loading") return "loading";
  if (status === "error") return "error";
  return "local";
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
  if (!movements.length) {
    return <EmptyState t={t} type="expense" openQuick={openQuick} title={t.labels.noMovementsTitle} message={t.labels.noMovementsBody} cta={t.labels.addExpense} />;
  }

  return (
    <div className="movement-list">
      {movements.map((movement) => (
        <div className="movement" key={movement.id}>
          <span className={`dot ${movement.type === "income" ? "sage" : "amber"}`} />
          <div>
            <strong>{movement.title}</strong>
            <small>
              {movement.category} · {movement.date || t.noDate}
              {movement.type === "expense" && movement.expenseKind === "shared"
                ? ` · ${t.labels.sharedWith} ${movement.sharedWith || t.labels.sharedPersonFallback} · ${movement.paidBy === "other" ? t.labels.paidByOther : t.labels.paidByYou} · ${movement.ownerSharePercent ?? 50}/${100 - (movement.ownerSharePercent ?? 50)} · ${t.labels.yourShare} ${money.format(sharedOwnAmount(movement))} · ${t.labels.otherShare} ${money.format(sharedOtherAmount(movement))}`
                : ""}
            </small>
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
  selectedMonth,
  money,
  openQuick,
  deleteItem,
}: {
  t: (typeof copy)[Lang];
  budgets: Budget[];
  movements: Movement[];
  selectedMonth: string;
  money: Intl.NumberFormat;
  openQuick: (type?: QuickType, id?: string) => void;
  deleteItem: (type: QuickType, id: string) => void;
}) {
  if (!budgets.length) {
    return <EmptyState t={t} type="budget" openQuick={openQuick} title={t.labels.noBudgetsTitle} message={t.labels.noBudgetsBody} cta={t.addBudget} />;
  }

  return (
    <div className="budget-list">
      {budgets.map((budget) => {
        const spent = movements
          .filter((movement) => movement.type === "expense" && movement.date.startsWith(selectedMonth) && movement.category.toLowerCase() === budget.category.toLowerCase())
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
  if (!events.length) {
    return <EmptyState t={t} type="event" openQuick={openQuick} title={t.labels.noEventsTitle} message={emptyMessage ?? t.labels.noEventsBody} cta={t.addEvent} />;
  }

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

export default App;
