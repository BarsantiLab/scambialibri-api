import { Router } from 'express';
import { injectable } from 'inversify';

import { StatsController } from './stats.controller';

import { Policy, Role } from 'core/policy';

@injectable()
export class StatsRoute {
    constructor(
        private _ctrl: StatsController,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {
        router.get('/stats/general',
            this._policy.is(Role.administrator),
            this._ctrl.getGeneralStats.bind(this._ctrl)
        );
    }
}
