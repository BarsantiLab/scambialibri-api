import { injectable } from 'inversify';

import { BookRoute } from 'api/endpoints/book/book.route';
import { OfferRoute } from 'api/endpoints/offer/offer.route';
import { SchoolRoute } from 'api/endpoints/school/school.route';
import { TransactionRoute } from 'api/endpoints/transaction/transaction.route';
import { UserRoute } from 'api/endpoints/user/user.route';

import * as express from 'express';

import { ApiError, ErrorCode } from 'core/error-codes';

@injectable()
export class RouterFactory {
    public router: express.Router;

    constructor(
        private _bookRoute: BookRoute,
        private _offerRoute: OfferRoute,
        private _schoolRoute: SchoolRoute,
        private _transactionRoute: TransactionRoute,
        private _userRoute: UserRoute
    ) {
        this.router = express.Router();

        this._bookRoute.setupRoutes(this.router);
        this._offerRoute.setupRoutes(this.router);
        this._schoolRoute.setupRoutes(this.router);
        this._transactionRoute.setupRoutes(this.router);
        this._userRoute.setupRoutes(this.router);

        this.router.all('*', (req, res, next) => {
            next(new ApiError(ErrorCode.EndpointNotFound));
        });
    }
}
