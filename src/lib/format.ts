export function formatQuantity(quantity: number | null, unit: string | null) {
  if (quantity === null) return unit ?? "";
  const rounded = Math.round(quantity * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "");
  return unit ? `${text} ${unit}` : text;
}

export function scaleQuantity(quantity: number | null, factor: number) {
  if (quantity === null) return null;
  return Math.round(quantity * factor * 100) / 100;
}
