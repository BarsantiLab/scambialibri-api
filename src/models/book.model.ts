import * as mongoose from 'mongoose';

import { IBook, IBookModel } from 'interfaces/book.interface';
import { IGrade } from 'interfaces/grade.interface';

export class BookSchema extends mongoose.Schema implements IBook {
    isbn: string;
    author: string;
    title: string;
    subtitle: string;
    price: number;
    custom: boolean;
    grades: IGrade[];

    constructor() {
        super({
            isbn: String,
            price: Number,

            author: String,
            subtitle: String,
            title: String,

            custom: Boolean,

            grades: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grade'
            }]
        });
    }
}

// tslint:disable-next-line:variable-name
export const Book = mongoose.model<IBookModel>('Book', new BookSchema());
