import { CalendarDays, PiggyBank, ReceiptText, Target, User, Users, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Copy } from "../i18n/copy";
import { todayKey } from "../lib/date";
import type { Budget, EventItem, ExpenseKind, Goal, Habit, Movement, QuickType, Task } from "../types";

type EditableItem = Budget | EventItem | Goal | Habit | Movement | Task | null;

export function QuickAdd({
  type,
  t,
  editingItem,
  isEditing,
  onSelect,
  onSave,
  onClose,
}: {
  type: QuickType;
  t: Copy;
  editingItem: EditableItem;
  isEditing: boolean;
  onSelect: (type: QuickType) => void;
  onSave: (type: QuickType, payload: Record<string, FormDataEntryValue>) => void;
  onClose: () => void;
}) {
  const typeLabels = t.quick;
  const values = formValuesFor(type, editingItem);
  const [expenseKind, setExpenseKind] = useState<ExpenseKind>((values.expenseKind as ExpenseKind) || "individual");
  const [amountValue, setAmountValue] = useState(values.amount || "");
  const [ownerShareValue, setOwnerShareValue] = useState(values.ownerSharePercent || "50");
  const [paidBy, setPaidBy] = useState(values.paidBy || "me");
  const [formError, setFormError] = useState("");
  const amountNumber = Number(amountValue) || 0;
  const ownerShareNumber = Number(ownerShareValue) || 0;
  const ownerAmount = amountNumber * (ownerShareNumber / 100);
  const otherAmount = Math.max(0, amountNumber - ownerAmount);
  const importantType = type === "expense" || type === "budget" || type === "event" || type === "goal";
  const showTypePicker = !isEditing && !importantType;
  const modalMeta = modalMetaFor(type, t, isEditing);
  const ModalIcon = modalMeta.icon;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData);
    const amount = Number(payload.amount);
    const title = String(payload.title || "").trim();
    const category = String(payload.category || "").trim();
    const date = String(payload.date || "").trim();

    if ((type === "income" || type === "expense") && (!title || !category || !date || !Number.isFinite(amount) || amount <= 0)) {
      setFormError(t.validation.expense);
      return;
    }

    if (type === "expense" && payload.expenseKind === "shared") {
      const sharedWith = String(payload.sharedWith || "").trim();
      const ownerSharePercent = Number(payload.ownerSharePercent);
      if (!sharedWith || !Number.isFinite(ownerSharePercent) || ownerSharePercent <= 0 || ownerSharePercent >= 100) {
        setFormError(t.validation.sharedExpense);
        return;
      }
    }

    onSave(type, payload);
    onClose();
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="quick-title">
      <div className={`quick-modal ${importantType ? "context-modal" : ""}`}>
        <header>
          <div className="modal-title-block">
            {importantType && (
              <span className="modal-icon">
                <ModalIcon size={18} />
              </span>
            )}
            <div>
              <h2 id="quick-title">{modalMeta.title}</h2>
              {importantType && <p>{modalMeta.body}</p>}
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t.closeMenu}>
            <X size={19} />
          </button>
        </header>
        {showTypePicker && (
          <div className="quick-grid type-picker">
            {(Object.keys(typeLabels) as QuickType[]).map((item) => (
              <button className={type === item ? "selected" : ""} key={item} onClick={() => onSelect(item)}>
                {typeLabels[item]}
              </button>
            ))}
          </div>
        )}
        <form className={`quick-form ${importantType ? "context-form" : ""}`} onSubmit={handleSubmit}>
          <label>
            <span>{t.title}</span>
            <input name="title" required placeholder={placeholderFor(type, t)} defaultValue={values.title} />
          </label>
          {(type === "income" || type === "expense") && (
            <>
              <label>
                <span>{t.amount}</span>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder={t.placeholders.amount}
                  value={amountValue}
                  onChange={(event) => setAmountValue(event.target.value)}
                />
              </label>
              <label>
                <span>{t.category}</span>
                <input name="category" required placeholder={t.placeholders.category} defaultValue={values.category} />
              </label>
              <label>
                <span>{t.dateLabel}</span>
                <input name="date" type="date" required defaultValue={values.date || todayKey()} />
              </label>
            </>
          )}
          {type === "expense" && (
            <>
              <input type="hidden" name="expenseKind" value={expenseKind} />
              <div className="expense-kind-picker" role="group" aria-label={t.expenseType}>
                <button type="button" className={expenseKind === "individual" ? "selected" : ""} onClick={() => setExpenseKind("individual")}>
                  <User size={18} />
                  <span>{t.expenseKinds.individual}</span>
                </button>
                <button type="button" className={expenseKind === "shared" ? "selected" : ""} onClick={() => setExpenseKind("shared")}>
                  <Users size={18} />
                  <span>{t.expenseKinds.shared}</span>
                </button>
              </div>
              {expenseKind === "shared" && (
                <section className="split-section">
                  <div className="split-section-header">
                    <strong>{t.splitSectionTitle}</strong>
                    <span>{t.splitHint}</span>
                  </div>
                  <label>
                    <span>{t.sharedWith}</span>
                    <input name="sharedWith" required placeholder={t.placeholders.sharedWith} defaultValue={values.sharedWith} />
                  </label>
                  <input type="hidden" name="paidBy" value={paidBy} />
                  <div className="paid-by-picker" role="group" aria-label={t.paidBy}>
                    <button type="button" className={paidBy === "me" ? "selected" : ""} onClick={() => setPaidBy("me")}>
                      {t.paidByMe}
                    </button>
                    <button type="button" className={paidBy === "other" ? "selected" : ""} onClick={() => setPaidBy("other")}>
                      {t.paidByOther}
                    </button>
                  </div>
                  <label>
                    <span>{t.ownerSharePercent}</span>
                    <input
                      name="ownerSharePercent"
                      type="number"
                      min="1"
                      max="99"
                      step="1"
                      required
                      value={ownerShareValue}
                      onChange={(event) => setOwnerShareValue(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t.otherSharePercent}</span>
                    <input value={`${Math.max(0, 100 - ownerShareNumber)}%`} readOnly />
                  </label>
                  <div className="split-preview">
                    <span>
                      {t.labels.yourShare}: {formatAmount(ownerAmount)}
                    </span>
                    <span>
                      {t.labels.otherShare}: {formatAmount(otherAmount)}
                    </span>
                  </div>
                </section>
              )}
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
          {formError && <p className="form-error">{formError}</p>}
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

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function modalMetaFor(type: QuickType, t: Copy, isEditing: boolean) {
  if (type === "expense") {
    return { title: isEditing ? t.editExpense : t.addExpense, body: t.expenseModalBody, icon: ReceiptText };
  }
  if (type === "budget") {
    return { title: isEditing ? t.editBudget : t.addBudget, body: t.budgetModalBody, icon: PiggyBank };
  }
  if (type === "event") {
    return { title: isEditing ? t.editEvent : t.addEvent, body: t.eventModalBody, icon: CalendarDays };
  }
  if (type === "goal") {
    return { title: isEditing ? t.editGoal : t.addGoal, body: t.goalModalBody, icon: Target };
  }
  return { title: t.addQuick, body: "", icon: ReceiptText };
}

function placeholderFor(type: QuickType, t: Copy) {
  if (type === "budget") return t.placeholders.budget;
  if (type === "habit") return t.placeholders.habit;
  if (type === "event") return t.placeholders.event;
  if (type === "goal") return t.placeholders.goal;
  return t.placeholders.task;
}

function formValuesFor(type: QuickType, item: EditableItem) {
  if (!item) return {};
  if (type === "income" || type === "expense") {
    const movement = item as Movement;
    return {
      title: movement.title,
      category: movement.category,
      amount: String(movement.amount),
      date: movement.date,
      expenseKind: movement.expenseKind || "individual",
      sharedWith: movement.sharedWith || "",
      ownerSharePercent: String(movement.ownerSharePercent ?? 50),
      paidBy: movement.paidBy || "me",
    };
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
