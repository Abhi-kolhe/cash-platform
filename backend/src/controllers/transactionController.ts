import prisma from "../lib/prisma.js";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
      // add other user properties if needed
    }
    interface Request {
      user: User;
    }
  }
}

// POST /transactions/request
export async function createTransaction(req: Request, res: Response) {
  const { agentId, amount } = req.body;
  const userId = req.user.id; // <-- Assumes requireAuth middleware sets req.user

  // Ensure agent exists, is 
  // verified, and not banned
  const agent = await prisma.agentProfile.findFirst({ where: { userId: agentId } });
  if (!agent || !agent.isVerified || agent.isBanned) {
    return res.status(400).json({ error: "Agent not available" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const txn = await prisma.agentTransaction.create({
    data: {
      status: "pending",
      amount,
      userId,
      agentId,
      otp
    }
  });

  // TODO: Integrate SMS. For now, log OTP server-side
  console.log(`OTP for transaction ${txn.id}: ${otp}`);

  res.json({
    id: txn.id,
    status: txn.status,
    otp: "SENT" // Never send real OTP to client!
  });
  
}

export async function confirmTransaction(req: AuthRequest, res: Response) {
  const { transactionId, otp } = req.body;

  // Find the transaction
  const txn = await prisma.agentTransaction.findUnique({ where: { id: transactionId } });
  if (!txn) return res.status(404).json({ error: "Transaction not found" });

  if (txn.status !== "pending") {
    return res.status(400).json({ error: "Transaction already completed or cancelled" });
  }

  // Agent must match
  if (txn.agentId !== req.user.id) {
    return res.status(403).json({ error: "You are not the assigned agent" });
  }

  if (txn.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // Mark transaction as completed
  const updated = await prisma.agentTransaction.update({
    where: { id: transactionId },
    data: {
      status: "confirmed",
      completedAt: new Date(),
    }
  });

  res.json({
    id: updated.id,
    status: updated.status,
    completedAt: updated.completedAt,
  });
}