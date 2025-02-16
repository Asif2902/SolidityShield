import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const securityChecks = pgTable("security_checks", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  results: jsonb("results").$type<SecurityResult[]>().notNull(),
  score: integer("score").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertSecurityCheckSchema = createInsertSchema(securityChecks).pick({
  code: true,
  results: true,
  score: true,
  timestamp: true,
});

export type InsertSecurityCheck = z.infer<typeof insertSecurityCheckSchema>;
export type SecurityCheck = typeof securityChecks.$inferSelect;

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityResult {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  line?: number;
  recommendation: string;
}
