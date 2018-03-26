import { Logger } from 'core/log';
import { forIn } from 'lodash';

export function handleRejections(err, log: Logger) {
    const errors = [err];
    if (err.stack) errors.push(err.stack);

    if (err.name === 'ValidationError') {
        console.log(err.name + ': ' + err._message);

        forIn(err.errors, (v, k) => {
            console.log('    ' + k + ': ' + v.message);
        });
    } else {
        printErrors(errors, log);
    }

    process.exit(1);
}

export function printErrors(errors: any[], log: Logger) {
    errors.forEach(err => {
        log.error(err);
    });
}
