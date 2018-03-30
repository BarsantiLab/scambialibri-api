import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export function uuid(byteLength: number): string {
    return crypto
        .randomBytes(byteLength)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function hashPassword(password: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}
