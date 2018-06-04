import { injectable } from 'inversify';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { IOffer } from 'interfaces/offer.interface';

import { Book } from 'models/book.model';
import { Offer } from 'models/offer.model';

@injectable()
export class OfferController {
    async createOffer(req, res, next) {
        try {
            const book: IBook = await Book.findById(req.body.book);
            if (!book) throw new ApiError(ErrorCode.BookNotFound, { book: req.body.book });

            const oldOffer: IOffer = await Offer.findOne({
                book: req.body.book,
                user: req.user._id
            });

            if (oldOffer) throw new ApiError(ErrorCode.DuplicateOffer, { offer: (oldOffer as any)._id });

            const offerData: any = {
                book: mongoose.Types.ObjectId(req.body.book),
                user: req.user._id,
                createdAt: new Date(),
                type: req.body.type
            };

            if (req.body.type === 'sell') {
                offerData.bookStatus = req.body.bookStatus;
                offerData.additionalMaterial = req.body.additionalMaterial;
            }

            const newOffer: IOffer = await new Offer(offerData).save();

            res.send({
                id: (newOffer as any)._id,
                bookStatus: newOffer.bookStatus,
                additionalMaterial: newOffer.additionalMaterial
            });
        } catch (err) {
            next(err);
        }
    }

    async getSales(req, res, next) {
        try {
            const sales: IOffer[] = await Offer.find({
                user: req.user._id
            }).populate('book');

            const out = [];

            for (const offer of sales) {
                const outOffer: any = {
                    id: (offer as any)._id,
                    type: offer.type
                };

                // TODO: populate transaction
                // TODO: populate messages

                out.push(outOffer);
            }

            res.send(out);
        } catch (err) {
            next(err);
        }
    }
}
