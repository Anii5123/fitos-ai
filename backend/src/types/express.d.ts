import { ITokenPayload } from '../utils/token.js';

declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}
export {};
