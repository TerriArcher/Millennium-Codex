import { handleRandomCard } from '../../src/server/apiHandlers';

export default async function handler(req: any, res: any) {
  return handleRandomCard(req, res);
}
