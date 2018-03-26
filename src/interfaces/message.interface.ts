import { Document } from 'mongoose';

import { ITransaction } from './transaction.interface';
import { IUser } from './user.interface';

export interface IMessage {
    transaction: ITransaction;
    from: IUser;
    to: IUser;

    content: string;
    date: Date;
}

export interface IMessageModel extends IMessage, Document {}
