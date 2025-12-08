import { z } from 'zod';

export const loginRequestSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().max(100)
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;

export type LoginResponseDto = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    role: string | null;
  };
};
