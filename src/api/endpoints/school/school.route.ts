import { Router } from 'express';
import { injectable } from 'inversify';

import { SchoolController } from './school.controller';
import { SchoolValidator } from './school.validator';

@injectable()
export class SchoolRoute {
    constructor(
        private _ctrl: SchoolController,
        private _validator: SchoolValidator
    ) { }

    setupRoutes(router: Router) {
        router.get('/school',
            this._ctrl.getSchools.bind(this._ctrl)
        );

        router.get('/school/:id/specialization',
            this._validator.getSpecializations,
            this._ctrl.getSpecialization.bind(this._ctrl)
        );

        router.get('/school/:school/specialization/:spec/grade',
            this._validator.getGrades,
            this._ctrl.getGrades.bind(this._ctrl)
        );

        router.get('/school/:school/grade/prepare',
            this._validator.prepareGradeFilter,
            this._ctrl.prepareGradeFilter.bind(this._ctrl)
        );
    }
}
