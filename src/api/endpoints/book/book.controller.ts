import * as mongoose from 'mongoose';

import { injectable } from 'inversify';

import { IBook } from 'interfaces/book.interface';
import { Book } from 'models/book.model';

@injectable()
export class BookController {
    async getBooks(req, res, next) {
        const filterObj: any = {};
        if (req.query.class) filterObj.classes = new mongoose.Types.ObjectId(req.query.class);

        try {
            const books: IBook[] = await Book.find(filterObj).exec();

            res.send(books.map((book: IBook) => {
                // TODO: add transaction data

                return {
                    id: (book as any)._id.toString(),

                    isbn: book.isbn,
                    price: book.price,
                    author: book.author,
                    title: book.title,
                    subtitle: book.subtitle
                };
            }));
        } catch (err) {
            next(err);
        }
    }

    async getInstances(req, res, next) {
        // const filterObj: any = {};

        // if (req.query.mode === 'buy') {

        // }
    }
}
