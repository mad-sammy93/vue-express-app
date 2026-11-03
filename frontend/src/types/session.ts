import { z } from 'zod'

export const sessionSchema = z.object({
  id: z.number().int().positive(),
  topic: z
    .string()
    .trim()
    .min(1, 'Please enter a session topic')
    .max(20, 'Session topic is too long'),
  durationMinutes: z.number().int().positive(),
})

export const createSessionSchema = sessionSchema.pick({
  topic: true,
  durationMinutes: true,
})

export const sessionsSchema = z.array(sessionSchema)

export type Session = z.infer<typeof sessionSchema>

export type CreateSessionInput = z.infer<typeof createSessionSchema>

export type UpdateSessionDurationInput = Pick<Session, 'durationMinutes'>
