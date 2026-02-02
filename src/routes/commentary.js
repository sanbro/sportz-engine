import { Router } from 'express';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { eq, desc } from 'drizzle-orm';

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
  const paramParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramParsed.success) {
    return res.status(400).json({ error: 'Invalid match ID', details: paramParsed.error.format() });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: queryParsed.error.format() });
  }

  try {
    const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramParsed.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Failed to fetch commentary:', error);
    return res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramParsed.success) {
    return res.status(400).json({ error: 'Invalid match ID', details: paramParsed.error.format() });
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: bodyParsed.error.format() });
  }

  try {
    const { minutes, ...rest } = bodyParsed.data;
    const [inserted] = await db
      .insert(commentary)
      .values({
        matchId: paramParsed.data.id,
        minute: minutes,
        ...rest,
      })
      .returning();
    if(req.app.locals.broadCastCommentary){
      req.app.locals.broadCastCommentary(inserted.matchId, inserted)
    }
    return res.status(201).json({ data: inserted });
  } catch (error) {
    console.error('Failed to create commentary:', error);
    return res.status(500).json({ error: 'Failed to create commentary' });
  }
});