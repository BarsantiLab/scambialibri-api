import * as fs from 'fs';
import * as mk from 'mkdirp';
import * as rm from 'rimraf';

import { promisify } from 'util';

export let readdir = promisify(fs.readdir);
export let rename = promisify(fs.rename);
export let mkdirp = promisify(mk);
export let rimraf = promisify(rm);
export let createWriteStream = fs.createWriteStream;

export let readFile = (path: string) => {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

export let checkExist = (path: string) => {
    return new Promise((resolve, reject) => {
        fs.existsSync(path) ? resolve() : reject();
    });
};
