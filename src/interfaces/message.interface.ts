import { Document } from 'mongoose';

import { ITransaction } from './transaction.interface';

export interface IMessage {
    from: ITransaction;
    to: ITransaction;

    content: string;
    date: Date;
}

export interface IMessageModel extends IMessage, Document {}
