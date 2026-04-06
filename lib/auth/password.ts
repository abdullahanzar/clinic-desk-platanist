import { compare, compareSync, hash, hashSync } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export function hashPasswordSync(password: string): string {
  return hashSync(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function verifyPasswordSync(
  password: string,
  hashedPassword: string
): boolean {
  return compareSync(password, hashedPassword);
}
