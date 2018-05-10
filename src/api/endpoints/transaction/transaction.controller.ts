import { injectable } from 'inversify';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { IMessage } from 'interfaces/message.interface';
import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';

import { Book } from 'models/book.model';
import { Message } from 'models/message.model';
import { Transaction } from 'models/transaction.model';
import { TransactionService } from 'services/transaction.service';

@injectable()
export class TransactionController {
    constructor(
        private _transactionService: TransactionService
    ) { }

    async createTransaction(req, res, next) {
        try {
            const book: IBook = await Book.findById(req.body.book);
            if (!book) throw new ApiError(ErrorCode.BookNotFound, { id: req.body.book });

            const transaction: ITransaction = await Transaction.findOne({
                book: req.body.book,
                user: req.user._id
            });

            if (transaction) throw new ApiError(ErrorCode.DuplicateTransaction, {
                transaction: (transaction as any)._id.toString()
            });

            const transactionData: any = {
                book: mongoose.Types.ObjectId(req.body.book),
                messages: [],
                status: TransactionStatus.free
            };

            if (req.body.mode === 'sell') {
                transactionData.seller = req.user._id;
                transactionData.bookStatus = req.body.bookStatus;
                transactionData.additionalMaterial = req.body.additionalMaterial;
            } else {
                transactionData.buyer = req.user._id;
            }

            const newTransaction: ITransaction = await new Transaction(transactionData).save();

            res.send({
                id: (newTransaction as any)._id.toString(),
                bookStatus: newTransaction.bookStatus,
                additionalMaterial: newTransaction.additionalMaterial
            });
        } catch (err) {
            next(err);
        }
    }

    async getPurchases(req, res, next) {
        // TODO: sort buyer transaction
        try {
            const purchases: ITransaction[] = await Transaction.find({
                buyer: req.user._id
            }).populate('book').exec();

            const out = [];

            for (const trans of purchases) {
                const tmpObj: any = {
                    id: (trans as any)._id.toString(),
                    status: trans.status,

                    book: {
                        author: trans.book.author,
                        isbn: trans.book.isbn,
                        title: trans.book.title,
                        subtitle: trans.book.subtitle
                    }
                };

                if (trans.status === TransactionStatus.free) {
                    const sales: ITransaction[] = await Transaction.find({
                        book: (trans.book as any)._id,
                        _id: {
                            $ne: (trans as any)._id
                        },
                        seller: {
                            $ne: null
                        }
                    }).populate('seller').exec();

                    // TODO: sort sales by points

                    tmpObj.sales = sales.map(sale => ({
                        id: (sale as any)._id.toString(),
                        status: sale.status,
                        bookStatus: sale.bookStatus,
                        additionalMaterial: sale.additionalMaterial || false,
                        seller: {
                            firstName: sale.seller.firstName,
                            lastName: sale.seller.lastName
                        }
                    }));
                }

                if (trans.status === TransactionStatus.pending || trans.status === TransactionStatus.notResponding) {
                    const paired: ITransaction = await Transaction.findById(trans.paired).populate({
                        path: 'seller',
                        populate: {
                            path: 'school',
                            model: 'School' // TODO: can I remove it?
                        }
                    }).exec();

                    if (!paired) throw new ApiError(ErrorCode.TransactionNotFound, { transaction: trans.paired });

                    if ((trans.messages as IMessage[]).length === 0 && moment().diff(moment(trans.pairingDate), 'd', true) > 1) {
                        tmpObj.notRespondingEnabled = true;
                    }

                    tmpObj.pairedUser = {
                        firstName: paired.seller.firstName,
                        lastName: paired.seller.lastName,
                        mail: paired.seller.mail,
                        address: paired.seller.address,
                        province: paired.seller.province,
                        city: paired.seller.city,
                        phone: paired.seller.phone,
                        schoolName: paired.seller.school.name
                    };

                    const messages: IMessage[] = await Message.find({
                        _id: { $in: trans.messages }
                    });

                    tmpObj.messages = messages.map((msg: IMessage) => ({
                        sent: (msg.from as any).equals(req.user._id),
                        content: msg.content,
                        date: msg.date
                    }));
                }

                out.push(tmpObj);
            }

            res.send(out);
        } catch (err) {
            next(err);
        }
    }

    async pairTransaction(req, res, next) {
        try {
            const buyerTrans = await Transaction.findById(req.params.id);
            if (!buyerTrans) throw new ApiError(ErrorCode.TransactionNotFound, { transaction: req.params.id });
            if (!req.user._id.equals(buyerTrans.buyer)) throw new ApiError(ErrorCode.TransactionNotRelatedToUser, { transaction: req.params.id });

            const sellerTrans = await Transaction.findById(req.body.transaction);
            if (!sellerTrans) throw new ApiError(ErrorCode.TransactionNotFound, { transaction: req.body.transaction });

            await this._transactionService.pairTransactions(buyerTrans, sellerTrans);
            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const trans: ITransaction = await Transaction.findById(req.params.id);

            if (!req.user._id.equals(trans.buyer) && !req.user._id.equals(trans.seller)) {
                throw new ApiError(ErrorCode.TransactionNotRelatedToUser, {
                    transaction: req.params.id
                });
            }

            // TODO: sanitization on message
            // TODO: set transaction status to pending if it's notResponding if the seller is responding

            await this._transactionService.sendMessage(trans, req.body.message);
            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async getSales(req, res, next) {
        res.sendStatus(418);
    }

    async cancelTransaction(req, res, next) {
        try {
            const trans: ITransaction = await Transaction.findOne({
                _id: req.params.id,
                $or: [{
                    seller: req.user._id
                }, {
                    buyer: req.user._id
                }]
            });

            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound, { id: req.params.id });

            if (trans.status === TransactionStatus.free) {
                await this._transactionService.deleteTransaction(trans);
            } else if (trans.status === TransactionStatus.pending) {
                await this._transactionService.cancelPendingTransaction(trans);
            } else {
                // TODO: throw wrong status error
            }

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async reportNotResponding(req, res, next) {
        try {
            const trans: ITransaction = await Transaction.findOne({
                _id: req.params.id,
                $or: [{
                    seller: req.user._id
                }, {
                    buyer: req.user._id
                }]
            });

            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound, { id: req.params.id });

            await this._transactionService.reportNotResponding(trans);
            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async completeTransaction(req, res, next) {
        res.sendStatus(418);
    }
}
