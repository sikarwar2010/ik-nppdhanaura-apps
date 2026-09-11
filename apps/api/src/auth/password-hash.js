import { scrypt } from "node:crypto";
import argon2 from "argon2";
import bcrypt from "bcryptjs";
const BCRYPT_PREFIX = "$2";
const ARGON2_PREFIX = "$argon2";
const LEGACY_SCRYPT = {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
};
function resolveArgon2Options() {
    const memoryCost = Number(process.env.ARGON2_MEMORY_KB ?? 19456);
    const timeCost = Number(process.env.ARGON2_TIME_COST ?? 2);
    const parallelism = Number(process.env.ARGON2_PARALLELISM ?? 1);
    return {
        type: argon2.argon2id,
        memoryCost,
        timeCost,
        parallelism,
    };
}
function isBcryptHash(hash) {
    return hash.startsWith(BCRYPT_PREFIX);
}
function isArgon2Hash(hash) {
    return hash.startsWith(ARGON2_PREFIX);
}
function isLegacyBetterAuthHash(hash) {
    const [salt, key] = hash.split(":");
    return Boolean(salt && key && /^[0-9a-f]+$/i.test(salt) && /^[0-9a-f]+$/i.test(key));
}
async function verifyLegacyBetterAuthHash(hash, password) {
    const [salt, keyHex] = hash.split(":");
    if (!salt || !keyHex)
        return false;
    const derived = await new Promise((resolve, reject) => {
        scrypt(password.normalize("NFKC"), salt, LEGACY_SCRYPT.dkLen, {
            N: LEGACY_SCRYPT.N,
            r: LEGACY_SCRYPT.r,
            p: LEGACY_SCRYPT.p,
            maxmem: LEGACY_SCRYPT.maxmem,
        }, (err, key) => {
            if (err)
                reject(err);
            else
                resolve(key);
        });
    });
    return derived.toString("hex") === keyHex;
}
export async function hashPassword(password) {
    return argon2.hash(password, resolveArgon2Options());
}
export async function verifyPassword(password, storedHash) {
    if (!storedHash)
        return false;
    if (isArgon2Hash(storedHash)) {
        try {
            return await argon2.verify(storedHash, password);
        }
        catch {
            return false;
        }
    }
    if (isBcryptHash(storedHash)) {
        return bcrypt.compare(password, storedHash);
    }
    if (isLegacyBetterAuthHash(storedHash)) {
        return verifyLegacyBetterAuthHash(storedHash, password);
    }
    return false;
}
/** Rehash legacy bcrypt/scrypt hashes to Argon2id after successful login. */
export function shouldUpgradePasswordHash(storedHash) {
    return isLegacyBetterAuthHash(storedHash) || isBcryptHash(storedHash);
}
