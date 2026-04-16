import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TECHNICAL_PATTERNS = [/prisma/i, /internal server error/i, /unexpected error/i, /cannot read/i, /is not a function/i, /graphql error/i];

export function getErrorMessage(e: { message: string }): string {
  const msg = e.message?.trim();
  if (!msg || msg.length > 300 || TECHNICAL_PATTERNS.some((p) => p.test(msg))) {
    return "Ops! Something went wrong.";
  }
  return msg;
}
