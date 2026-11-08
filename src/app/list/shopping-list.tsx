"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Check, Copy, Link2, Plus, X } from "lucide-react";
import { addManualItem, getOrCreateShareToken, removeItem, toggleItemChecked } from "@/lib/actions/list";
import { formatWeekRange } from "@/lib/dates";
import { formatQuantity } from "@/lib/format";
import { dayNames, groupBySection, listAsText, type ListRow } from "@/lib/list-groups";
import { SECTION_LABELS, STORE_SECTIONS, type ShoppingItem, type StoreSection } from "@/lib/types";

type Props = {
  weekStart: string;
  items: ShoppingItem[];
  initialShareToken: string | null;
};

type OptimisticAction = { type: "toggle"; id: string; checked: boolean } | { type: "remove"; id: string };

export function ShoppingList({ weekStart, items, initialShareToken }: Props) {
  const [optimisticItems, apply] = useOptimistic<ShoppingItem[], OptimisticAction>(items, (current, action) => {
    if (action.type === "toggle") {
      return current.map((i) => (i.id === action.id ? { ...i, checked: action.checked } : i));
    }
    return current.filter((i) => i.id !== action.id);
  });
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const toggle = (item: ShoppingItem) => {
    start(async () => {
      apply({ type: "toggle", id: item.id, checked: !item.checked });
      const result = await toggleItemChecked(item.id, !item.checked);
      if (!result.ok) setError(result.error);
    });
  };

  const remove = (item: ShoppingItem) => {
    start(async () => {
      apply({ type: "remove", id: item.id });
      const result = await removeItem(item.id);
      if (!result.ok) setError(result.error);
    });
  };

  const open = optimisticItems.filter((i) => !i.checked);
  const done = optimisticItems.filter((i) => i.checked);
  const weekend = open.filter((i) => !i.buy_day_of);
  const dayOf = open.filter((i) => i.buy_day_of);

  return (
    <div className="space-y-6">
      <AddItemForm weekStart={weekStart} />

      <div className="flex gap-2">
        <CopyButton items={optimisticItems} heading={`Shopping list, ${formatWeekRange(weekStart)}`} />
        <ShareButton weekStart={weekStart} initialToken={initialShareToken} onUrl={setShareUrl} />
      </div>
      {shareUrl && <ShareUrl url={shareUrl} />}

      {error && <p className="px-1 text-[14px] text-(--danger)">{error}</p>}

      {optimisticItems.length === 0 && (
        <p className="px-1 text-[15px] text-(--muted)">
          The list is empty. Plan the week and build it, or add items by hand above.
        </p>
      )}

      <Group title="Weekend shop" items={weekend} onToggle={toggle} onRemove={remove} />
      <Group title="Buy day of" items={dayOf} onToggle={toggle} onRemove={remove} showDays />

      {done.length > 0 && (
        <details className="group">
          <summary className="label flex cursor-pointer list-none items-center gap-2 px-1 py-2 select-none">
            <Check size={16} aria-hidden />
            Done ({done.length})
            <span className="ml-auto text-[12px] text-(--faint) group-open:hidden">show</span>
            <span className="ml-auto hidden text-[12px] text-(--faint) group-open:inline">hide</span>
          </summary>
          <ul className="card divide-y divide-(--border)">
            {done.map((item) => (
              <Row key={item.id} item={item} onToggle={toggle} onRemove={remove} showDays={item.buy_day_of} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Group({
  title,
  items,
  onToggle,
  onRemove,
  showDays = false,
}: {
  title: string;
  items: ShoppingItem[];
  onToggle: (item: ShoppingItem) => void;
  onRemove: (item: ShoppingItem) => void;
  showDays?: boolean;
}) {
  if (items.length === 0) return null;
  const groups = groupBySection(items);
  return (
    <section className="space-y-3">
      <h2 className="display px-1 text-[22px]">{title}</h2>
      {groups.map((g) => (
        <div key={g.section} className="space-y-1.5">
          <h3 className="label px-1 uppercase tracking-wide">{SECTION_LABELS[g.section]}</h3>
          <ul className="card divide-y divide-(--border)">
            {g.items.map((item) => (
              <Row key={item.id} item={item as ShoppingItem} onToggle={onToggle} onRemove={onRemove} showDays={showDays} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Row({
  item,
  onToggle,
  onRemove,
  showDays,
}: {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onRemove: (item: ShoppingItem) => void;
  showDays: boolean;
}) {
  const qty = formatQuantity(item.quantity, item.unit);
  const days = showDays ? dayNames(item.for_days) : [];
  return (
    <li className="flex items-center gap-2 pr-2">
      <label className="flex min-h-14 flex-1 cursor-pointer items-center gap-3 py-2 pl-3">
        <input
          type="checkbox"
          className="check"
          checked={item.checked}
          onChange={() => onToggle(item)}
          aria-label={item.name}
        />
        <span className={`min-w-0 flex-1 ${item.checked ? "text-(--muted) line-through" : ""}`}>
          <span className="block text-[16px] leading-tight">
            {item.name}
            {item.name_sv && <span className="text-(--muted)"> ({item.name_sv})</span>}
          </span>
          {(qty || days.length > 0) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {qty && <span className="num text-[14px] text-(--muted)">{qty}</span>}
              {days.map((d) => (
                <span key={d} className="chip chip-accent h-5 px-1.5 text-[11px]">
                  {d}
                </span>
              ))}
              {item.manual && <span className="chip h-5 px-1.5 text-[11px]">added</span>}
            </span>
          )}
        </span>
      </label>
      {item.manual && (
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => onRemove(item)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-(--faint) hover:text-(--danger)"
        >
          <X size={18} aria-hidden />
        </button>
      )}
    </li>
  );
}

function AddItemForm({ weekStart }: { weekStart: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="card space-y-2 p-3"
      action={(formData) => {
        setError(null);
        start(async () => {
          const result = await addManualItem({
            weekStart,
            name: String(formData.get("name") ?? ""),
            quantity: String(formData.get("quantity") ?? ""),
            unit: String(formData.get("unit") ?? ""),
            section: (String(formData.get("section") ?? "other") || "other") as StoreSection,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
        });
      }}
    >
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder="Add an item"
          autoComplete="off"
          className="field"
          disabled={pending}
        />
        <button type="button" className="btn btn-secondary shrink-0 px-3" onClick={() => setMore((m) => !m)} aria-label="More fields">
          {more ? "Less" : "More"}
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary shrink-0 px-3" aria-label="Add item">
          <Plus size={20} aria-hidden />
        </button>
      </div>
      {more && (
        <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-2">
          <input name="quantity" type="text" inputMode="decimal" placeholder="Qty" className="field field-sm" disabled={pending} />
          <input name="unit" type="text" placeholder="Unit" className="field field-sm" disabled={pending} />
          <select name="section" defaultValue="other" className="field field-sm" disabled={pending}>
            {STORE_SECTIONS.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-[13px] text-(--danger)">{error}</p>}
    </form>
  );
}

function CopyButton({ items, heading }: { items: ListRow[]; heading: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-secondary flex-1"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(listAsText(items, heading));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? "Copied" : "Copy as text"}
    </button>
  );
}

function ShareButton({
  weekStart,
  initialToken,
  onUrl,
}: {
  weekStart: string;
  initialToken: string | null;
  onUrl: (url: string) => void;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reveal = (t: string) => onUrl(`${window.location.origin}/share/${t}`);

  return (
    <div className="flex-1">
      <button
        type="button"
        disabled={pending}
        className="btn btn-secondary btn-block"
        onClick={() => {
          if (token) {
            reveal(token);
            return;
          }
          start(async () => {
            const result = await getOrCreateShareToken(weekStart);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setToken(result.token);
            reveal(result.token);
          });
        }}
      >
        <Link2 size={16} aria-hidden />
        {pending ? "Creating" : "Share"}
      </button>
      {error && <p className="pt-1 text-[13px] text-(--danger)">{error}</p>}
    </div>
  );
}

function ShareUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card flex items-center gap-2 p-2 pl-3">
      <a href={url} className="min-w-0 flex-1 truncate text-[13px] text-(--accent)" target="_blank" rel="noreferrer">
        {url}
      </a>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
