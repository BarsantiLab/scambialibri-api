import { Router } from 'express';
import { injectable } from 'inversify';

import { BookController } from './book.controller';
import { BookValidator } from './book.validator';

import { Policy, Roles } from 'core/policy';

@injectable()
export class BookRoute {
    constructor(
        private _ctrl: BookController,
        private _validator: BookValidator,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {
        router.get('/book',
            this._policy.is(Roles.authenticated),
            this._validator.getBooks,
            this._ctrl.getBooks.bind(this._ctrl)
        );

        router.get('/book/:id/instances',
            this._policy.is(Roles.authenticated),
            this._validator.getInstances,
            this._ctrl.getInstances.bind(this._ctrl)
        );
    }
}
