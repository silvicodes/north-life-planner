import { Edit3, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Copy } from "../i18n/copy";
import type { PriorityKey, QuickType } from "../types";

export function Panel({
  title,
  icon: Icon,
  viewLabel,
  className = "",
  children,
}: {
  title: string;
  icon: LucideIcon;
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

export function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MetricRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong className={positive ? "positive" : ""}>{value}</strong>
    </div>
  );
}

export function EmptyState({
  t,
  type,
  openQuick,
  message,
}: {
  t: Copy;
  type: QuickType;
  openQuick: (type?: QuickType, id?: string) => void;
  message?: string;
}) {
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

export function ItemActions({
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

export function ConfirmDialog({
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

export function PriorityPill({ value, label }: { value: PriorityKey; label: string }) {
  return <span className={`priority ${value}`}>{label}</span>;
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
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
