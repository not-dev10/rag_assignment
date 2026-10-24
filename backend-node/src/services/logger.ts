import pino from 'pino';
import { getConfig } from '../config.js';

const config = getConfig();

export const logger = pino({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    service: 'backend-node',
  },
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}