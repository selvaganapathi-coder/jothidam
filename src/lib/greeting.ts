import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required");

export function formatGreeting(name: string): string {
  const parsed = nameSchema.parse(name);
  return `Welcome, ${parsed}`;
}
