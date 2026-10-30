import { handleCardFilters } from '../../src/server/apiHandlers';

export default function handler(req: any, res: any) {
  return handleCardFilters(req, res);
}
