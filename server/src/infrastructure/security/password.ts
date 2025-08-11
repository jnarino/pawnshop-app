// src/infrastructure/security/password.ts
import argon2 from 'argon2';

/**
 * Argon2id hashing options tuned for backend authentication.
 * Adjust timeCost / memoryCost for your server hardware.
 */
const options: argon2.Options & { type: number } = {
    type: argon2.argon2id,
    timeCost: 3,           // iterations
    memoryCost: 64 * 1024, // 64 MiB
    parallelism: 1,        // threads
};

/**
 * Hash a plaintext password using Argon2id.
 * This is one-way; there is no decrypting.
 *
 * @param plain - The user's plaintext password
 * @returns The Argon2id hash string containing salt + params
 */
export async function hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, options);
}

/**
 * Verify a plaintext password against a stored Argon2id hash.
 * @param hash - The hash retrieved from the database
 * @param plain - The plaintext password to check
 * @returns true if match, false otherwise
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
}
