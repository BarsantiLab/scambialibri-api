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

    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    province: string;

    school: ISchool;
    specialization: ISpecialization;
    currentClass: IGrade;
    futureClass: IGrade;

    // TODO: move to proper interface
    coords: number[];

    transactions: ITransaction[];
}

export enum BookStatus {
    new, pencilNotes, penNotes, badConditions
}

export interface IUserModel extends IUser, Document { }
