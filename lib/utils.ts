import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const EXPIRATION_DATE = new Date("2026-01-01T00:00:00+08:00");

export function isExpired() {
  return Date.now() > EXPIRATION_DATE.getTime();
}
