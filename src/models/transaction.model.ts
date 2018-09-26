import * as mongoose from 'mongoose';

import { IBook } from 'interfaces/book.interface';
import { IMessage } from 'interfaces/message.interface';
import { IOffer } from 'interfaces/offer.interface';
import { ITransaction, ITransactionModel, TransactionStatus } from 'interfaces/transaction.interface';
import { BookStatus, IUserModel } from 'interfaces/user.interface';

export class TransactionSchema extends mongoose.Schema implements ITransaction {
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

    constructor() {
        super({
            status: String,

            buyerOffer: {
                ref: 'Offer',
                type: mongoose.Schema.Types.ObjectId
            },
            buyerUser: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            sellerOffer: {
                ref: 'Offer',
                type: mongoose.Schema.Types.ObjectId
            },
            sellerUser: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            firstCompleteUser: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            book: {
                ref: 'Book',
                type: mongoose.Schema.Types.ObjectId
            },
            additionalMaterial: Boolean,
            bookStatus: String,

            messages: [{
                ref: 'Message',
                type: mongoose.Schema.Types.ObjectId
            }],

            createdAt: Date
        });
    }
}

// tslint:disable-next-line:variable-name
export const Transaction = mongoose.model<ITransactionModel>('Transaction', new TransactionSchema());
