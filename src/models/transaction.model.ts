import * as mongoose from 'mongoose';

import { IBook } from 'interfaces/book.interface';
import { IMessage } from 'interfaces/message.interface';
import { ITransaction, ITransactionModel, TransactionStatus } from 'interfaces/transaction.interface';
import { BookStatus, IUser } from 'interfaces/user.interface';

export class TransactionSchema extends mongoose.Schema implements ITransaction {
    status: TransactionStatus;
    seller: IUser;
    buyer: IUser;

    paired: ITransaction;
    pairingDate: Date;

    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    messages: [IMessage];

    constructor() {
        super({
            status: String,

            seller: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            buyer: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            book: {
                ref: 'Book',
                type: mongoose.Schema.Types.ObjectId
            },

            paired: {
                ref: 'Transaction',
                type: mongoose.Schema.Types.ObjectId,
                default: null
            },

            pairingDate: Date,

            additionalMaterial: Boolean,
            bookStatus: String,

            messages: [{
                ref: 'Message',
                type: mongoose.Schema.Types.ObjectId
            }]
        });
    }
}

// tslint:disable-next-line:variable-name
export const Transaction = mongoose.model<ITransactionModel>('Transaction', new TransactionSchema());
