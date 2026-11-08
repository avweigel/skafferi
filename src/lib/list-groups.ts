import { DAY_LABELS } from "@/lib/dates";
import { formatQuantity } from "@/lib/format";
import { SECTION_LABELS, STORE_SECTIONS, type StoreSection } from "@/lib/types";

export type ListRow = {
  id: string;
  name: string;
  name_sv: string | null;
  section: StoreSection;
  quantity: number | null;
  unit: string | null;
  for_days: number[] | null;
  buy_day_of: boolean;
  checked: boolean;
  manual: boolean;
};

export type SectionGroup = { section: StoreSection; items: ListRow[] };

export function groupBySection(items: ListRow[]): SectionGroup[] {
  return STORE_SECTIONS.map((section) => ({
    section,
    items: items
      .filter((i) => i.section === section)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);
}

export function dayNames(forDays: number[] | null) {
  return (forDays ?? []).map((d) => DAY_LABELS[d] ?? "").filter((s) => s.length > 0);
}

export function itemLabel(item: ListRow) {
  return item.name_sv ? `${item.name} (${item.name_sv})` : item.name;
}

// the plain text version for pasting into a message
export function listAsText(items: ListRow[], heading: string) {
  const open = items.filter((i) => !i.checked);
  const lines: string[] = [heading, ""];
  const weekend = open.filter((i) => !i.buy_day_of);
  const dayOf = open.filter((i) => i.buy_day_of);

  const block = (title: string, rows: ListRow[]) => {
    if (rows.length === 0) return;
    lines.push(title.toUpperCase());
    for (const g of groupBySection(rows)) {
      lines.push(`  ${SECTION_LABELS[g.section]}`);
      for (const item of g.items) {
        const qty = formatQuantity(item.quantity, item.unit);
        const days = item.buy_day_of ? dayNames(item.for_days).join("/") : "";
        lines.push(`    - ${itemLabel(item)}${qty ? ` ${qty}` : ""}${days ? ` [${days}]` : ""}`);
      }
    }
    lines.push("");
  };

  block("Weekend shop", weekend);
  block("Buy day of", dayOf);
  return lines.join("\n").trimEnd();
}
