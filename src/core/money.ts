const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIdr(amountIdr: number): string {
  return idrFormatter.format(amountIdr);
}

export function parseIdr(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) throw new Error("Nominal tidak valid");
  return Number(digits);
}
