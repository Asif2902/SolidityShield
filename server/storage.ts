import { securityChecks, type SecurityCheck, type InsertSecurityCheck } from "@shared/schema";

export interface IStorage {
  createSecurityCheck(check: InsertSecurityCheck): Promise<SecurityCheck>;
  getSecurityCheck(id: number): Promise<SecurityCheck | undefined>;
  getRecentChecks(): Promise<SecurityCheck[]>;
}

export class MemStorage implements IStorage {
  private checks: Map<number, SecurityCheck>;
  private currentId: number;

  constructor() {
    this.checks = new Map();
    this.currentId = 1;
  }

  async createSecurityCheck(insertCheck: InsertSecurityCheck): Promise<SecurityCheck> {
    const id = this.currentId++;
    const check: SecurityCheck = { ...insertCheck, id };
    this.checks.set(id, check);
    return check;
  }

  async getSecurityCheck(id: number): Promise<SecurityCheck | undefined> {
    return this.checks.get(id);
  }

  async getRecentChecks(): Promise<SecurityCheck[]> {
    return Array.from(this.checks.values())
      .sort((a, b) => b.id - a.id)
      .slice(0, 10);
  }
}

export const storage = new MemStorage();
