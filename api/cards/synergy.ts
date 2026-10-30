import { handleCardSynergy } from '../../src/server/apiHandlers';

export default async function handler(req: any, res: any) {
  return handleCardSynergy(req, res);
}
