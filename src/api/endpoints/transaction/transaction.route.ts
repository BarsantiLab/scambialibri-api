import { Router } from 'express';
import { injectable } from 'inversify';

import { Policy, Roles } from 'core/policy';

import { TransactionController } from './transaction.controller';
import { TransactionValidator } from './transaction.validator';

@injectable()
export class TransactionRoute {
    constructor(
        private _ctrl: TransactionController,
        private _validator: TransactionValidator,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {
        router.post('/transition',
            this._policy.is(Roles.authenticated),
            this._validator.createTransaction,
            this._ctrl.createTransaction.bind(this._ctrl)
        );
    }
}
