import { z } from 'zod';

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(10)
});

export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;

export type RefreshTokenResponseDto = {
  access_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    role: string | null;
  };
};
