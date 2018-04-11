import * as mongoose from 'mongoose';

import { IGrade } from 'interfaces/grade.interface';
import { ISchool } from 'interfaces/school.interface';
import { ISpecialization } from 'interfaces/specialization.interface';
import { ITransaction } from 'interfaces/transaction.interface';
import { IUser, IUserModel } from 'interfaces/user.interface';

export enum UserRole {
    administrator = 0,
    user = 1
}

export class UserSchema extends mongoose.Schema implements IUser {
    mail: string;
    password: string;
    accessToken: string;
    confirmationToken: string;
    disabled: boolean;
    role: UserRole;
    onboardingCompleted: boolean;

    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    province: string;

    school: ISchool;
    specialization: ISpecialization;
    currentGrade: IGrade;
    futureGrade: IGrade;

    coords: number[];

    transactions: ITransaction[];

    constructor() {
        super({
            // ===== BASIC INFO ===========================================================================
            accessToken: {
                type: String,
                unique: true
            },

            confirmationToken: {
                type: String,
                unique: true
            },

            password: String,
            salt: String,

            mail: {
                type: String,
                unique: true
            },

            disabled: {
                type: Boolean,
                default: false
            },

            administrator: {
                type: Boolean,
                default: false
            },

            onboardingCompleted: {
                type: Boolean,
                default: false
            },

            // ===== PERSONAL DATA ========================================================================

            firstName: String,
            lastName: String,
            phone: String,
            address: String,
            city: String,
            zipCode: String,
            province: String,

            school: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'School'
            },

            specialization: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Specialization'
            },

            currentGrade: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grade'
            },

            futureGrade: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grade'
            },

            coords: {
                type: [Number],
                index: '2dsphere'
            },

            transactions: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Transaction'
            }]
        });

        this.index({
            coords: '2dsphere'
        });
    }
}

// tslint:disable-next-line:variable-name
export const User = mongoose.model<IUserModel>('User', new UserSchema());
