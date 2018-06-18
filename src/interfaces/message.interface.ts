import { Document } from 'mongoose';

import { ITransaction } from 'interfaces/transaction.interface';
import { IUser } from 'interfaces/user.interface';

export interface IMessage {
    from: IUser;
    to: IUser;
    transaction: ITransaction;

    content: string;
    date: Date;
}

export interface IMessageModel extends IMessage, Document {}
