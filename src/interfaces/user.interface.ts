import { Document } from 'mongoose';

import { UserRole } from 'models/user.model';

import { IGrade } from './grade.interface';
import { ISchool } from './school.interface';
import { ISpecialization } from './specialization.interface';
import { ITransaction } from './transaction.interface';

export interface IUser {
    mail: string;
    password: string;
    accessToken: string;
    confirmationToken: string;
    disabled: boolean;
    role: UserRole;
    onboardingCompleted: boolean;
    passwordResetToken?: string;

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
}

// TODO: move to book.interface
export enum BookStatus {
    new = 'new',
    pencilNotes = 'pencilNotes',
    penNotes = 'penNotes',
    badConditions = 'badConditions'
}

export interface IUserModel extends IUser, Document { }
