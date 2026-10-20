/**
 * Express Router wrapper for Supabase Admin API
 */

import { Router } from 'express';
import { handleSupabaseAdminApi } from './api-handler';

export const supabaseAdminRouter = Router();

supabaseAdminRouter.use(async (req, res, next) => {
  const url = req.originalUrl || req.url;
  const pathname = url.split('?')[0];
  const handled = await handleSupabaseAdminApi(req, res, pathname);
  if (!handled) {
    next();
  }
});
