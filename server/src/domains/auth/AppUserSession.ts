import crypto from 'crypto';

export class AppUserSession {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
  readonly refreshTokenHash: string;

  constructor(params: {
    id?: string;
    userId: string;
    createdAt?: Date;
    lastSeenAt?: Date;
    revokedAt?: Date | null;
    refreshTokenHash: string;
  }) {
    this.id = params.id ?? crypto.randomUUID();
    this.userId = params.userId;
    this.createdAt = params.createdAt ?? new Date();
    this.lastSeenAt = params.lastSeenAt ?? new Date();
    this.revokedAt = params.revokedAt ?? null;
    this.refreshTokenHash = params.refreshTokenHash;
  }

  get isActive(): boolean {
    return this.revokedAt == null;
  }

  touch() {
    this.lastSeenAt = new Date();
  }

  revoke() {
    this.revokedAt = new Date();
  }
}
