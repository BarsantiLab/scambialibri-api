import * as mongoose from 'mongoose';

import { IBook } from 'interfaces/book.interface';
import { IOffer, IOfferModel, OfferType } from 'interfaces/offer.interface';
import { BookStatus, IUser  } from 'interfaces/user.interface';

export class OfferSchema extends mongoose.Schema implements IOffer {
    type: OfferType;
    user: IUser;
    book: IBook;
    bookStatus: BookStatus;
    additionalMaterial: boolean;

    createdAt: Date;

    constructor() {
        super({
            type: String,

            user: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },
            book: {
                ref: 'Book',
                type: mongoose.Schema.Types.ObjectId
            },
            bookStatus: String,
            additionalMaterial: Boolean,
            createdAt: Date
        });
    }
}

// tslint:disable-next-line:variable-name
export const Offer = mongoose.model<IOfferModel>('Offer', new OfferSchema());
