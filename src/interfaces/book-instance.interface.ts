import { Document } from 'mongoose';

import { IBook } from './book.interface';
import { IUser } from './user.interface';

export enum BookStatus {
    new,
    pencilNotes,
    penNotes,
    badConditions
}

export interface IBookInstance {
    book: IBook;
    seller: IUser;
    buyer: IUser;

    status: BookStatus;
    additionalMaterial: boolean;
}

export interface IBookInstanceModel extends IBookInstance, Document {}
