import { Document } from 'mongoose';

import { IBook } from './book.interface';
import { IMessage } from './message.interface';
import { IOffer } from './offer.interface';
import { BookStatus, IUserModel } from './user.interface';

export enum TransactionStatus {
    pending = 'pending',
    closed = 'closed',
    notResponding = 'notResponding',
    inCompletion = 'inCompletion',
    completed = 'completed'
}

export interface ITransaction {
    status: TransactionStatus;

    buyerOffer: IOffer;
    buyerUser: IUserModel;
    sellerOffer: IOffer;
    sellerUser: IUserModel;

    firstCompleteUser: IUserModel;

    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    messages: [IMessage];

    createdAt: Date;
}

export interface ITransactionModel extends ITransaction, Document {}
