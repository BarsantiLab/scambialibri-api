import { Document } from 'mongoose';

import { IBook } from './book.interface';
import { IMessage } from './message.interface';
import { BookStatus, IUser } from './user.interface';

// TODO: is closed used?
export enum TransactionStatus {
    free = 'free',
    pending = 'pending',
    closed = 'closed',
    notResponding = 'notResponding',
    inCompletion = 'inCompletion',
    completed = 'completed'
}

export interface ITransaction {
    status: TransactionStatus;
    seller: IUser;
    buyer: IUser;

    paired: ITransaction;
    pairingDate: Date;

    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    messages: [IMessage];
}

export interface ITransactionModel extends ITransaction, Document {}
