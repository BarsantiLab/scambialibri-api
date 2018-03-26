import { Document } from 'mongoose';

import { IBook } from './book.interface';
import { IMessage } from './message.interface';
import { BookStatus, IUser } from './user.interface';

export enum TransactionStatus {
    active,
    completed,
    cancelled
}

export interface ITransaction {
    status: TransactionStatus;
    seller: IUser;
    buyer: IUser;

    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    messages: [IMessage];
}

export interface ITransactionModel extends ITransaction, Document {}
