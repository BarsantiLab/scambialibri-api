import * as mongoose from 'mongoose';

import { injectable } from 'inversify';

import { IBook } from 'interfaces/book.interface';
import { ITransaction } from 'interfaces/transaction.interface';

import { Book } from 'models/book.model';
import { Transaction } from 'models/transaction.model';

@injectable()
export class BookController {
    async getBooks(req, res, next) {
        const filterObj: any = {};
        if (req.query.grade) filterObj.grades = new mongoose.Types.ObjectId(req.query.grade);

        try {
            const books: IBook[] = await Book.find(filterObj);
            const booksOut: any[] = [];

            const queryObj: any = {};
            if (req.query.mode === 'sell') queryObj.seller = req.user._id;
            else queryObj.buyer = req.user._id;

            for (const book of books) {
                const outObj: any = {
                    id: (book as any)._id.toString(),

                    isbn: book.isbn,
                    price: book.price,
                    author: book.author,
                    title: book.title,
                    subtitle: book.subtitle,
                };

                const trans: ITransaction = await Transaction.findOne({
                    ...queryObj,
                    book: (book as any)._id
                });

                // Skip books with updated transactions
                // TODO: fix/remove
                // if (trans && trans.status !== TransactionStatus.) continue;

                if (trans) {
                    outObj.transaction = {
                        id: (trans as any)._id.toString(),
                        status: trans.status,
                        bookStatus: trans.bookStatus,
                        additionalMaterial: trans.additionalMaterial
                    };
                } else {
                    outObj.transaction = {};
                }

                booksOut.push(outObj);
            }

            res.send(booksOut);
        } catch (err) {
            next(err);
        }
    }
}
