// Shared helpers for rendering buy/sell signals consistently across pages.

/** Tailwind classes for a solid signal badge. */
export function getSignalColor(signal?: string): string {
  switch (signal) {
    case 'STRONG_BUY':
      return 'bg-green-600 text-white';
    case 'BUY':
      return 'bg-green-500 text-white';
    case 'HOLD':
      return 'bg-yellow-500 text-white';
    case 'SELL':
      return 'bg-red-500 text-white';
    case 'STRONG_SELL':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

/** Human-friendly signal label (e.g. "STRONG_BUY" -> "STRONG BUY"). */
export function signalLabel(signal?: string): string {
  if (!signal) return 'N/A';
  return signal.replace(/_/g, ' ');
}

/** True for signals that warrant the investor's attention in a portfolio. */
export function isWarningSignal(signal?: string): boolean {
  return signal === 'SELL' || signal === 'STRONG_SELL';
}
