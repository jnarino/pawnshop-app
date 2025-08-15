// Minimal structured logger (console based)
import { config } from '../../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields { [k: string]: any; }

function ts() { return new Date().toISOString(); }

function base(fields: LogFields) {
  return { t: ts(), lvl: fields.level, msg: fields.msg, build: config.buildId, ...fields.ctx };
}

function write(obj: any) { console.log(JSON.stringify(obj)); }

export class Logger {
  constructor(private ctx: LogFields = {}) {}
  child(ctx: LogFields) { return new Logger({ ...this.ctx, ...ctx }); }
  private log(level: LogLevel, msg: string, extra?: LogFields) {
    write(base({ level, msg, ctx: { ...this.ctx, ...extra } }));
  }
  debug(msg: string, extra?: LogFields) { if (config.nodeEnv !== 'production') this.log('debug', msg, extra); }
  info(msg: string, extra?: LogFields) { this.log('info', msg, extra); }
  warn(msg: string, extra?: LogFields) { this.log('warn', msg, extra); }
  error(msg: string, extra?: LogFields) { this.log('error', msg, extra); }
}

export const logger = new Logger();
