import { handleResources } from '../src/server/apiHandlers';

export default function handler(req: any, res: any) {
  return handleResources(req, res);
}
