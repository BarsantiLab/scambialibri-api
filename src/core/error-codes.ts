export enum ErrorCode {
    Unauthorized,
    UserInvalidPassword,
    DuplicateMail,
    OnboardingAlreadyCompleted,

    UserNotFound,
    SchoolNotFound,
    BookNotFound,
    GradeNotFound,
    TransactionNotFound,
    SpecializationNotRelatedToSchool,
    GradeNotRelatedToSpecializationOrSchool,

    EndpointNotFound,
    ValidationError,
    UnreachableExternalAPI,
    InternalServerError
}

export interface IErrorCodeObject {
    code?: number;
    label: ErrorCode;
    message?: string;
    status: 400 | 401 | 403 | 404 | 500;
}

export class ApiError extends Error {
    errorCodeObject: IErrorCodeObject;
    data: any;

    constructor(code: ErrorCode, data?: any) {
        if (!errorsMap.has(code)) {
            super('Invalid error code thrown');
        } else {
            const errorCodeObject = errorsMap.get(code);
            super(errorCodeObject.message);
            this.errorCodeObject = errorCodeObject;
            this.data = data;
        }

        // Restore prototype chain
        // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

const errorsMap: Map<ErrorCode, IErrorCodeObject> = new Map<ErrorCode, IErrorCodeObject>();

const errors: IErrorCodeObject[] = [{
    code: 1999,
    label: ErrorCode.ValidationError,
    message: 'Validation error',
    status: 400
}, {
    code: 1003,
    label: ErrorCode.UserNotFound,
    message: 'User not found',
    status: 401
}, {
    code: 1004,
    label: ErrorCode.UserInvalidPassword,
    message: 'Invalid password',
    status: 401
}, {
    code: 1005,
    label: ErrorCode.DuplicateMail,
    message: 'Duplicate e-mail address',
    status: 400
}, {
    code: 1006,
    label: ErrorCode.OnboardingAlreadyCompleted,
    message: 'Onboarding already completed',
    status: 400
}, {
    code: 2001,
    label: ErrorCode.SchoolNotFound,
    message: 'School not found',
    status: 404
}, {
    code: 9997,
    label: ErrorCode.EndpointNotFound,
    message: 'API endpoint not found',
    status: 404
}, {
    code: 9999,
    label: ErrorCode.InternalServerError,
    message: 'Internal server error',
    status: 500
}, {
    code: 9998,
    label: ErrorCode.Unauthorized,
    message: 'Unauthorized',
    status: 401
}, {
    code: 3001,
    label: ErrorCode.BookNotFound,
    message: 'Book not found',
    status: 404
}, {
    code: 3002,
    label: ErrorCode.TransactionNotFound,
    message: 'Transaction not found',
    status: 404
}, {
    code: 3003,
    label: ErrorCode.SpecializationNotRelatedToSchool,
    message: 'Specialization not related to school',
    status: 400
}, {
    code: 3004,
    label: ErrorCode.GradeNotRelatedToSpecializationOrSchool,
    message: 'Grade not related to specialization or school',
    status: 400
}, {
    code: 3005,
    label: ErrorCode.GradeNotFound,
    message: 'Grade not found',
    status: 404
}, {
    code: 9996,
    label: ErrorCode.UnreachableExternalAPI,
    message: 'Unreachable external API',
    status: 400
}];

for (const error of errors) {
    errorsMap.set(error.label, error);
}
