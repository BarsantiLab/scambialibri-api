import { IUser } from 'interfaces/user.interface';
import { Document } from 'mongoose';

export enum TokenLevel {
    authenticate = 0,
    resetPassword = 1,
    activation = 2
}

export interface IToken {
    value?: string;
    expireAt?: Date;
    level?: TokenLevel;
    user?: IUser;
}

export interface ITokenModel extends IToken, Document { }
