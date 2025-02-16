import { securityChecks, type SecurityCheck, type InsertSecurityCheck } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createSecurityCheck(check: InsertSecurityCheck): Promise<SecurityCheck>;
  getSecurityCheck(id: number): Promise<SecurityCheck | undefined>;
  getRecentChecks(): Promise<SecurityCheck[]>;
}

export class DatabaseStorage implements IStorage {
  async createSecurityCheck(insertCheck: InsertSecurityCheck): Promise<SecurityCheck> {
    const [check] = await db
      .insert(securityChecks)
      .values([insertCheck])
      .returning();
    return check;
  }

  async getSecurityCheck(id: number): Promise<SecurityCheck | undefined> {
    const [check] = await db
      .select()
      .from(securityChecks)
      .where(eq(securityChecks.id, id));
    return check;
  }

  async getRecentChecks(): Promise<SecurityCheck[]> {
    return await db
      .select()
      .from(securityChecks)
      .orderBy(securityChecks.id)
      .limit(10);
  }
}

export const storage = new DatabaseStorage();