// TODO: define typings
export async function promiseAllObject(obj) {
    const keys = Object.keys(obj);
    const out = {};

    await Promise
        .all(keys.map(k => obj[k]))
        .then(res => {
            keys.forEach((k, i) => out[k] = res[i]);
        });

    return out;
}

// TODO: define typings
export function objectFromEntries(list, key: string, val: string) {
    const out = {};
    list.forEach(e => out[e[key]] = e[val]);
    return out;
}
