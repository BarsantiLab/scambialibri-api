import { Document } from 'mongoose';
import { IBook } from './book.interface';
import { BookStatus, IUser } from './user.interface';

export enum OfferType {
    buy, sell
}

export interface IOffer {
    type: OfferType;
    user: IUser;
    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    createdAt: Date;
}

export interface IOfferModel extends IOffer, Document {}
