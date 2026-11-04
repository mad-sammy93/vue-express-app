import { z } from 'zod'
import { sessionsSchema } from './session'

export const sessionPageSchema = z.object({
  data: sessionsSchema,
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(100),
    totalPages: z.number().int().positive(),
  }),
})

export type SessionPage = z.infer<typeof sessionPageSchema>

export interface SessionPageQuery {
  search?: string
  sort?: 'topic' | 'duration' | 'duration-asc'
  page?: number
  limit?: number
}
