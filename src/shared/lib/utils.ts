import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as an abbreviated Naira amount (₦12K / ₦3.4M / ₦1.2B). */
export function fmtNaira(n: number) {
  if (n >= 1_000_000_000) return "₦" + (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(0) + "K";
  return "₦" + n.toLocaleString();
}
