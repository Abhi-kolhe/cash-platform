import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { Prisma, TransactionType } from "@prisma/client";

const router = Router();

/**
 * NOTE:
 * These routes are AGENT-ONLY.
 * Used for cash-in / cash-out operations handled by verified agents.
 */

const listTransactionsQuerySchema = z.object({
  accountId: z.string().uuid("accountId must be a UUID"),
  type: z.nativeEnum(TransactionType).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createTransactionSchema = z.object({
  accountId: z.string().uuid("accountId must be a UUID"),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive("amount must be > 0"),
  description: z.string().trim().min(1).max(500).optional(),
  occurredAt: z.string().datetime().optional(),
});

// 🔐 AGENT-ONLY: List handled transactions
router.get(
  "/",
  requireAuth,
  requireRole(["agent"]),
  validate(listTransactionsQuerySchema, "query"),
  async (req: AuthRequest, res) => {
    const { accountId, type, from, to, limit, offset } =
      req.query as unknown as z.infer<typeof listTransactionsQuerySchema>;

    const where: any = { accountId };
    if (type) where.type = type;
    if (from) where.occurredAt = { ...(where.occurredAt || {}), gte: new Date(from) };
    if (to) where.occurredAt = { ...(where.occurredAt || {}), lte: new Date(to) };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ total, items });
  }
);

// 🔐 AGENT-ONLY: Create cash-in / cash-out transaction
router.post(
  "/",
  requireAuth,
  requireRole(["agent"]),
  validate(createTransactionSchema, "body"),
  async (req: AuthRequest, res) => {
    const { accountId, type, amount, description, occurredAt } =
      req.body as z.infer<typeof createTransactionSchema>;

    const tx = await prisma.transaction.create({
      data: {
        accountId,
        type,
        amount: new Prisma.Decimal(amount),
        description,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
    });

    res.status(201).json(tx);
  }
);

export default router;
