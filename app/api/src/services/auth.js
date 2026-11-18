import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export function tokenFor(user, secret) {
  return jwt.sign({}, secret, {
    subject: user.id,
    expiresIn: "7d",
    issuer: "alem-da-voz",
    audience: "mobile",
  });
}
export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
