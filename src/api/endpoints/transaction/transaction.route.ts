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

        router.post('/transaction/:id/pair',
            this._policy.is(Role.authenticated),
            this._validator.pairTransaction,
            this._ctrl.pairTransaction.bind(this._ctrl)
        );

        router.post('/transaction/:id/message',
            this._policy.is(Role.authenticated),
            this._validator.sendMessage,
            this._ctrl.sendMessage.bind(this._ctrl)
        );

        router.post('/transaction/:id/cancel',
            this._policy.is(Role.authenticated),
            this._validator.cancelTransaction,
            this._ctrl.cancelTransaction.bind(this._ctrl)
        );

        router.post('/transaction/:id/not-responding',
            this._policy.is(Role.authenticated),
            this._validator.reportNotResponding,
            this._ctrl.reportNotResponding.bind(this._ctrl)
        );

        router.post('/transaction/:id/completed',
            this._policy.is(Role.authenticated),
            this._validator.reportCompleted,
            this._ctrl.reportCompleted.bind(this._ctrl)
        );
    }
}
