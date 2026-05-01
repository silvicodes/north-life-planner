import { X } from "lucide-react";
import type { FormEvent } from "react";
import type { Copy } from "../i18n/copy";
import type { Budget, EventItem, Goal, Habit, Movement, QuickType, Task } from "../types";

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
