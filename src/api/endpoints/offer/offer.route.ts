import { Router } from 'express';
import { injectable } from 'inversify';

import { Policy, Role } from 'core/policy';

import { OfferController } from './offer.controller';
import { OfferValidator } from './offer.validator';

@injectable()
export class OfferRoute {
    constructor(
        private _ctrl: OfferController,
        private _validator: OfferValidator,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {
        router.post('/offer',
            this._policy.is(Role.authenticated),
            this._validator.createOffer,
            this._ctrl.createOffer.bind(this._ctrl)
        );

        router.get('/offer/sales',
            this._policy.is(Role.authenticated),
            this._ctrl.getSales.bind(this._ctrl)
        );

        router.get('/offer/purchases',
            this._policy.is(Role.authenticated),
            this._ctrl.getPurchases.bind(this._ctrl)
        );

        router.delete('/offer/:id',
            this._policy.is(Role.authenticated),
            this._validator.cancelOffer,
            this._ctrl.cancelOffer.bind(this)
        );
    }
}
