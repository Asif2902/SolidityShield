import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertSecurityCheckSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    const body = insertSecurityCheckSchema.parse(req.body);
    const result = await storage.createSecurityCheck(body);
    res.json(result);
  });

  app.get("/api/checks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const check = await storage.getSecurityCheck(id);
    if (!check) {
      res.status(404).json({ message: "Check not found" });
      return;
    }
    res.json(check);
  });

  app.get("/api/recent", async (_req, res) => {
    const checks = await storage.getRecentChecks();
    res.json(checks);
  });

  return createServer(app);
}
