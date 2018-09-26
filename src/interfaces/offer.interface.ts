import { Document } from 'mongoose';
import { IBookModel } from './book.interface';
import { BookStatus, IUser } from './user.interface';

export enum OfferType {
    buy = 'buy', sell = 'sell'
}

export interface IOffer {
    type: OfferType;
    user: IUser;
    book: IBookModel;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    isPending: boolean;

    createdAt: Date;
}

export interface IOfferModel extends IOffer, Document {}
