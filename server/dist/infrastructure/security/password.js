"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
// src/infrastructure/security/password.ts
const argon2_1 = __importDefault(require("argon2"));
/**
 * Argon2id hashing options tuned for backend authentication.
 * Adjust timeCost / memoryCost for your server hardware.
 */
const options = {
    type: argon2_1.default.argon2id,
    timeCost: 3, // iterations
    memoryCost: 64 * 1024, // 64 MiB
    parallelism: 1, // threads
};
/**
 * Hash a plaintext password using Argon2id.
 * This is one-way; there is no decrypting.
 *
 * @param plain - The user's plaintext password
 * @returns The Argon2id hash string containing salt + params
 */
async function hashPassword(plain) {
    return argon2_1.default.hash(plain, options);
}
/**
 * Verify a plaintext password against a stored Argon2id hash.
 * @param hash - The hash retrieved from the database
 * @param plain - The plaintext password to check
 * @returns true if match, false otherwise
 */
async function verifyPassword(hash, plain) {
    return argon2_1.default.verify(hash, plain);
}
