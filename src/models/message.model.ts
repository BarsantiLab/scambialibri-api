import * as mongoose from 'mongoose';

import { IMessage, IMessageModel } from 'interfaces/message.interface';
import { ITransaction } from 'interfaces/transaction.interface';

export class MessageSchema extends mongoose.Schema implements IMessage {
    from: ITransaction;
    to: ITransaction;

    content: string;
    date: Date;

    constructor() {
        super({
            from: {
                ref: 'Transaction',
                type: mongoose.Schema.Types.ObjectId
            },

            to: {
                ref: 'Transaction',
                type: mongoose.Schema.Types.ObjectId
            },

            content: String,
            date: Date
        });
    }
}

// tslint:disable-next-line:variable-name
export const Message = mongoose.model<IMessageModel>('Message', new MessageSchema());
