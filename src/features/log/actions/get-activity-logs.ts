"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { ACTIVITY_ACTIONS } from "../activity-log"

export interface ActivityLogItem {
  id: string
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  action: string
  entity: string
  entityId: string | null
  summary: string
  before: unknown
  after: unknown
  createdAt: Date
}

export interface GetActivityLogsResult {
  success: boolean
  data?: {
    logs: ActivityLogItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  error?: string
}

const querySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  actorId: z.string().uuid().nullable().optional(),
  action: z.enum(ACTIVITY_ACTIONS).nullable().optional(),
  entity: z.string().trim().min(1).nullable().optional(),
  from: z.coerce.date().nullable().optional(),
  to: z.coerce.date().nullable().optional(),
})

export async function getActivityLogs(input: {
  page?: number
  pageSize?: number
  actorId?: string | null
  action?: string | null
  entity?: string | null
  from?: Date | null
  to?: Date | null
}): Promise<GetActivityLogsResult> {
  const validation = querySchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: "Data filter tidak valid" }
  }

  const { page, pageSize, actorId, action, entity, from, to } = validation.data

  const where: Prisma.ActivityLogWhereInput = {}

  if (actorId) {
    where.actorId = actorId
  }
  if (action) {
    where.action = action
  }
  if (entity) {
    where.entity = entity
  }
  if (from ?? to) {
    where.createdAt = {}
    if (from) {
      where.createdAt.gte = from
    }
    if (to) {
      where.createdAt.lte = to
    }
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where }),
    ])

    return {
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          actorId: l.actorId,
          actorName: l.actorName,
          actorEmail: l.actorEmail,
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          summary: l.summary,
          before: l.before,
          after: l.after,
          createdAt: l.createdAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Failed to fetch activity logs:", error)
    return { success: false, error: "Gagal memuat log aktivitas" }
  }
}
