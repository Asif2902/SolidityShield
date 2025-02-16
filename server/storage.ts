import { type SecurityCheck, type InsertSecurityCheck } from "@shared/schema";

export interface IStorage {
  createSecurityCheck(check: InsertSecurityCheck): Promise<SecurityCheck>;
  getSecurityCheck(id: number): Promise<SecurityCheck | undefined>;
  getRecentChecks(): Promise<SecurityCheck[]>;
}

export class MemoryStorage implements IStorage {
  private checks: SecurityCheck[] = [];
  private currentId = 1;

  async createSecurityCheck(insertCheck: InsertSecurityCheck): Promise<SecurityCheck> {
    const check: SecurityCheck = {
      id: this.currentId++,
      ...insertCheck
    };
    this.checks.push(check);
    return check;
  }

  async getSecurityCheck(id: number): Promise<SecurityCheck | undefined> {
    return this.checks.find(check => check.id === id);
  }

  async getRecentChecks(): Promise<SecurityCheck[]> {
    return this.checks.slice(-10).reverse();
  }
}

export const storage = new MemoryStorage();