import * as mongoose from 'mongoose';

import { injectable } from 'inversify';

import { IBookModel } from 'interfaces/book.interface';
import { IOfferModel } from 'interfaces/offer.interface';

import { Book } from 'models/book.model';
import { Offer } from 'models/offer.model';

@injectable()
export class BookController {
    async getBooks(req, res, next) {
        const filterObj: any = {};
        if (req.query.grade) filterObj.grades = new mongoose.Types.ObjectId(req.query.grade);

        try {
            const books: IBookModel[] = await Book.find(filterObj);
            const booksOut: any[] = [];

            for (const book of books) {
                const outObj: any = {
                    id: book._id,

                    isbn: book.isbn,
                    price: book.price,
                    author: book.author,
                    title: book.title,
                    subtitle: book.subtitle,
                };

                const offer: IOfferModel = await Offer.findOne({
                    user: req.user._id,
                    book: book._id
                });

                if (offer && offer.type === req.query.type) {
                    outObj.offer = {
                        id: offer._id,
                        isPending: offer.isPending,
                        bookStatus: offer.bookStatus,
                        additionalMaterial: offer.additionalMaterial,
                    };
                } else if (offer && offer.type !== req.query.type) {
                    outObj.offer = {};
                    outObj.offerLocked = true;
                } else {
                    outObj.offer = {};
                }

                booksOut.push(outObj);
            }

            res.send(booksOut);
        } catch (err) {
            next(err);
        }
    }
}
