import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { formatWeekRange } from "@/lib/dates";
import { formatQuantity } from "@/lib/format";
import { dayNames, groupBySection, type ListRow } from "@/lib/list-groups";
import { SECTION_LABELS, type SharedListRow } from "@/lib/types";

export const metadata: Metadata = { title: "Shared list | Skafferi" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

// the shared page needs no session, so a plain anon client is enough.
// the rpc is the only thing anon may call.
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "skafferi" }, auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const safeToken = token.replace(/[^a-z0-9]/gi, "").slice(0, 32);
  const supabase = anonClient();
  const { data, error } = await supabase.rpc("shared_list", { p_token: safeToken });
  const rows = ((data ?? []) as SharedListRow[]).map<ListRow>((r, i) => ({
    id: String(i),
    name: r.name,
    name_sv: r.name_sv,
    section: r.section,
    quantity: r.quantity,
    unit: r.unit,
    for_days: r.for_days,
    buy_day_of: r.buy_day_of,
    checked: r.checked,
    manual: false,
  }));

  if (error || rows.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
        <div className="card space-y-2 p-5">
          <p className="display text-[22px]">Nothing here</p>
          <p className="text-[15px] text-(--muted)">
            {error ? "This link does not work." : "This list is empty or the link has expired."}
          </p>
        </div>
      </main>
    );
  }

  const weekStart = ((data as SharedListRow[])[0]).week_start;
  const open = rows.filter((r) => !r.checked);
  const done = rows.filter((r) => r.checked);
  const weekend = open.filter((r) => !r.buy_day_of);
  const dayOf = open.filter((r) => r.buy_day_of);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-6 pb-12">
      <header className="space-y-1 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <div className="label">Skafferi shopping list</div>
        <h1 className="display text-[34px]">{formatWeekRange(weekStart)}</h1>
        <p className="text-[14px] text-(--muted)">Read only. {open.length} to buy, {done.length} done.</p>
      </header>

      <SharedGroup title="Weekend shop" items={weekend} />
      <SharedGroup title="Buy day of" items={dayOf} showDays />

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="label px-1">Done ({done.length})</h2>
          <ul className="card divide-y divide-(--border)">
            {done.map((item) => (
              <SharedRow key={item.id} item={item} showDays={item.buy_day_of} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function SharedGroup({ title, items, showDays = false }: { title: string; items: ListRow[]; showDays?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="display px-1 text-[22px]">{title}</h2>
      {groupBySection(items).map((g) => (
        <div key={g.section} className="space-y-1.5">
          <h3 className="label px-1 uppercase tracking-wide">{SECTION_LABELS[g.section]}</h3>
          <ul className="card divide-y divide-(--border)">
            {g.items.map((item) => (
              <SharedRow key={item.id} item={item} showDays={showDays} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function SharedRow({ item, showDays }: { item: ListRow; showDays: boolean }) {
  const qty = formatQuantity(item.quantity, item.unit);
  const days = showDays ? dayNames(item.for_days) : [];
  return (
    <li className={`flex min-h-12 items-center gap-3 px-4 py-2 ${item.checked ? "text-(--muted) line-through" : ""}`}>
      <span className="min-w-0 flex-1 text-[16px] leading-tight">
        {item.name}
        {item.name_sv && <span className="text-(--muted)"> ({item.name_sv})</span>}
      </span>
      {days.map((d) => (
        <span key={d} className="chip chip-accent h-5 px-1.5 text-[11px]">
          {d}
        </span>
      ))}
      {qty && <span className="num shrink-0 text-[15px]">{qty}</span>}
    </li>
  );
}
