import { injectable } from 'inversify';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { IMessageModel } from 'interfaces/message.interface';
import { IOfferModel, OfferType } from 'interfaces/offer.interface';
import { ITransactionModel } from 'interfaces/transaction.interface';
import { BookStatus } from 'interfaces/user.interface';

import { Book } from 'models/book.model';
import { Offer } from 'models/offer.model';
import { Transaction } from 'models/transaction.model';

@injectable()
export class OfferController {
    async createOffer(req, res, next) {
        try {
            const book: IBook = await Book.findById(req.body.book);
            if (!book) throw new ApiError(ErrorCode.BookNotFound, { book: req.body.book });

            const oldOffer: IOfferModel = await Offer.findOne({
                book: req.body.book,
                user: req.user._id
            });

            if (oldOffer) throw new ApiError(ErrorCode.DuplicateOffer, { offer: oldOffer._id });

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

            const newOffer: IOfferModel = await new Offer(offerData).save();

            res.send({
                id: newOffer._id,
                bookStatus: newOffer.bookStatus,
                additionalMaterial: newOffer.additionalMaterial
            });
        } catch (err) {
            next(err);
        }
    }

    async getSales(req, res, next) {
        try {
            const sales: IOfferModel[] = await Offer.find({
                user: req.user._id,
                type: OfferType.sell
            }).populate('book');

            const out = [];

            for (const offer of sales) {
                const outOffer: any = {
                    id: offer._id,
                    type: offer.type
                };

                const transaction: ITransactionModel = await Transaction.findOne({
                    sellerOffer: offer._id
                }).populate([{
                    path: 'messages'
                }, {
                    path: 'buyerUser',
                    populate: {
                        path: 'school',
                        model: 'School'
                    }
                }]);

                if (transaction) {
                    // TODO: on last update?
                    if (moment().diff(moment(transaction.createdAt), 'd', true) > 1) {
                        outOffer.notRespondingEnabled = true;
                    }

                    outOffer.pairedUser = {
                        firstName: transaction.buyerUser.firstName,
                        lastName: transaction.buyerUser.lastName,
                        mail: transaction.buyerUser.mail,
                        address: transaction.buyerUser.address,
                        province: transaction.buyerUser.province,
                        city: transaction.buyerUser.city,
                        phone: transaction.buyerUser.phone,
                        schoolName: transaction.buyerUser.school.name
                    };

                    outOffer.messages = transaction.messages.map((msg: IMessageModel) => ({
                        send: (msg.from as any).equals(req.user._id),
                        content: msg.content,
                        date: msg.date
                    }));
                }

                out.push(outOffer);
            }

            res.send(out);
        } catch (err) {
            next(err);
        }
    }

    async getPurchases(req, res, next) {
        try {
            const purchases: IOfferModel[] = await Offer.find({
                user: req.user._id,
                type: OfferType.buy
            }).populate('book');

            const out = [];

            for (const offer of purchases) {
                const outOffer: any = {
                    id: offer._id,
                    type: offer.type
                };

                if (offer.isPending) {
                    const transaction: ITransactionModel = await Transaction.findOne({
                        buyerOffer: offer._id
                    }).populate([{
                        path: 'messages'
                    }, {
                        path: 'sellerUser',
                        populate: {
                            path: 'school',
                            model: 'School'
                        }
                    }]);

                    // TODO: on last update?
                    if (moment().diff(moment(transaction.createdAt), 'd', true) > 1) {
                        outOffer.notRespondingEnabled = true;
                    }

                    outOffer.pairedUser = {
                        firstName: transaction.sellerUser.firstName,
                        lastName: transaction.sellerUser.lastName,
                        mail: transaction.sellerUser.mail,
                        address: transaction.sellerUser.address,
                        province: transaction.sellerUser.province,
                        city: transaction.sellerUser.city,
                        phone: transaction.sellerUser.phone,
                        schoolName: transaction.sellerUser.school.name
                    };

                    outOffer.messages = transaction.messages.map((msg: IMessageModel) => ({
                        send: (msg.from as any).equals(req.user._id),
                        content: msg.content,
                        date: msg.date
                    }));
                } else {
                    const sales: IOfferModel[] = await Offer.find({
                        book: offer.book._id,
                        type: OfferType.sell,
                        isPending: false
                    }).populate('user');

                    // TODO: add status
                    outOffer.sales = sales.map(sale => ({
                        id: sale._id,
                        bookStatus: sale.bookStatus,
                        additionalMaterial: sale.additionalMaterial,
                        seller: {
                            firstName: sale.user.firstName,
                            lastName: sale.user.lastName
                        },
                        points: this._getOfferPoints(sale)
                    })).sort((a, b) => b.points - a.points);
                }

                out.push(outOffer);
            }

            res.send(out);
        } catch (err) {
            next(err);
        }
    }

    // TODO: add cancel offer

    private _getOfferPoints(offer: IOfferModel): number {
        let points = 0;

        switch (offer.bookStatus) {
            case BookStatus.new: points += 6; break;
            case BookStatus.pencilNotes: points += 4; break;
            case BookStatus.penNotes: points += 2; break;
        }

        return points + (offer.additionalMaterial ? 1 : 0);
    }
}
