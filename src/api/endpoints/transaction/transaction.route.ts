import { Router } from 'express';
import { injectable } from 'inversify';

import { Policy, Role } from 'core/policy';

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
        router.post('/transaction',
            this._policy.is(Role.authenticated),
            this._validator.createTransaction,
            this._ctrl.createTransaction.bind(this._ctrl)
        );

        router.delete('/transaction/:id',
            this._policy.is(Role.authenticated),
            this._validator.cancelTransaction,
            this._ctrl.cancelTransaction.bind(this._ctrl)
        );

        router.get('/transaction/purchases',
            this._policy.is(Role.authenticated),
            this._ctrl.getPurchases.bind(this._ctrl)
        );

        router.get('/transaction/sales',
            this._policy.is(Role.authenticated),
            this._ctrl.getSales.bind(this._ctrl)
        );
    }
}
