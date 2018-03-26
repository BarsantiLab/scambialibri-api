import * as mongoose from 'mongoose';

import { BookStatus, IBookInstance, IBookInstanceModel } from 'interfaces/book-instance.interface';
import { IBook } from 'interfaces/book.interface';
import { IUser } from 'interfaces/user.interface';

export class BookInstanceSchema extends mongoose.Schema implements IBookInstance {
    book: IBook;
    seller: IUser;
    buyer: IUser;

    status: BookStatus;
    additionalMaterial: boolean;

    constructor() {
        super({
            book: {
                ref: 'Book',
                type: mongoose.Schema.Types.ObjectId
            },

            seller: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            buyer: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            additionalMaterial: Boolean,
            status: String
        });
    }
}

// tslint:disable-next-line:variable-name
export const BookInstance = mongoose.model<IBookInstanceModel>('Book', new BookInstanceSchema());
