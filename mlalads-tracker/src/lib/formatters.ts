export function formatRupee(amount: number, options: { compact?: boolean } = {}): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  if (options.compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}\u00A0Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}\u00A0L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}\u00A0K`;
    }
    return `₹${amount}`;
  }

  return '₹' + new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatPercentage(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${val.toFixed(1)}%`;
}
