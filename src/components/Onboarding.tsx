import { CircleDollarSign, Flame, ListTodo } from "lucide-react";
import type { Copy } from "../i18n/copy";
import type { QuickType } from "../types";

const onboardingActions: { type: QuickType; icon: typeof ListTodo; key: keyof Copy["onboarding"]["actions"] }[] = [
  { type: "task", icon: ListTodo, key: "task" },
  { type: "expense", icon: CircleDollarSign, key: "expense" },
  { type: "habit", icon: Flame, key: "habit" },
];

export function Onboarding({ t, openQuick }: { t: Copy; openQuick: (type?: QuickType, id?: string) => void }) {
  return (
    <section className="onboarding-panel span-4" aria-labelledby="onboarding-title">
      <div>
        <p className="eyebrow">{t.onboarding.eyebrow}</p>
        <h2 id="onboarding-title">{t.onboarding.title}</h2>
      </div>
      <div className="onboarding-actions">
        {onboardingActions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.type} onClick={() => openQuick(action.type)}>
              <Icon size={18} />
              <span>{t.onboarding.actions[action.key]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
