import { Router } from 'express';
import { injectable } from 'inversify';

import { BookController } from './book.controller';
import { BookValidator } from './book.validator';

import { Policy, Role } from 'core/policy';

@injectable()
export class BookRoute {
    constructor(
        private _ctrl: BookController,
        private _validator: BookValidator,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {
        router.get('/book',
            this._policy.is(Role.authenticated),
            this._validator.getBooks,
            this._ctrl.getBooks.bind(this._ctrl)
        );
    }
}
