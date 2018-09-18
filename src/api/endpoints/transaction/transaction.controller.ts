import { injectable } from 'inversify';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import * as sanitize from 'sanitize-html';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { IMessage } from 'interfaces/message.interface';
import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';
import { BookStatus } from 'interfaces/user.interface';

import { Book } from 'models/book.model';
import { Message } from 'models/message.model';
import { Transaction } from 'models/transaction.model';

import { AgendaService } from 'services/agenda.service';
import { MailService } from 'services/mail.service';
import { TransactionService } from 'services/transaction.service';

// TODO: rework on "not responding" feature: enabled if the transaction last message pushed is older than 24h
// TODO: add last message pushed date on transaction
// TODO: fix first report completing mail

@injectable()
export class TransactionController {
    constructor(
        private _agenda: AgendaService,
        private _mail: MailService,
        private _transactionService: TransactionService
    ) {
        // TODO: move jobs declaration in dedicated class

        this._agenda.define('closeNotRespondingTransaction', async job => {
            // TODO: send cancellation mails (to do in service?)
            const trans: ITransaction = await Transaction.findById(job.attrs.data.id).populate('buyer seller book');
            if (!trans || trans.status !== TransactionStatus.notResponding) return;
            this._transactionService.cancelPendingTransaction(trans);
        });

        this._agenda.define('closeCompletedTransaction', async job => {
            const trans: ITransaction = await Transaction.findById(job.attrs.data.id).populate('buyer seller book');
            if (!trans || trans.status !== TransactionStatus.inCompletion) return;
            this._transactionService.completeTransaction(trans);

            // TODO: send report to administrator
        });
    }

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

    async getSales(req, res, next) {
        try {
            const sales: ITransaction[] = await Transaction.find({
                seller: req.user._id
            }).populate('book').exec();

            const out = [];

            for (const trans of sales) {
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

                if (trans.status === TransactionStatus.pending || trans.status === TransactionStatus.notResponding || trans.status === TransactionStatus.inCompletion) {
                    const paired: ITransaction = await Transaction.findById(trans.paired).populate({
                        path: 'buyer',
                        populate: {
                            path: 'school',
                            model: 'School'
                        }
                    }).exec();

                    if (!paired) throw new ApiError(ErrorCode.TransactionNotFound, { transaction: trans.paired });

                    if ((trans.messages as IMessage[]).length === 0 && moment().diff(moment(trans.pairingDate), 'd', true) > 1) {
                        tmpObj.notRespondingEnabled = true;
                    }

                    tmpObj.pairedUser = {
                        firstName: paired.buyer.firstName,
                        lastName: paired.buyer.lastName,
                        mail: paired.buyer.mail,
                        address: paired.buyer.address,
                        province: paired.buyer.province,
                        city: paired.buyer.city,
                        phone: paired.buyer.phone,
                        schoolName: paired.buyer.school.name
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

    async getPurchases(req, res, next) {
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

                    tmpObj.sales = sales.map(sale => ({
                        id: (sale as any)._id.toString(),
                        status: sale.status,
                        bookStatus: sale.bookStatus,
                        additionalMaterial: sale.additionalMaterial || false,
                        seller: {
                            firstName: sale.seller.firstName,
                            lastName: sale.seller.lastName
                        },
                        points: this._getTransactionPoints(sale)
                    })).sort((a, b) => b.points - a.points);
                }

                if (trans.status === TransactionStatus.pending || trans.status === TransactionStatus.notResponding || trans.status === TransactionStatus.inCompletion) {
                    const paired: ITransaction = await Transaction.findById(trans.paired).populate({
                        path: 'seller',
                        populate: {
                            path: 'school',
                            model: 'School'
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

            const sellerTrans = await Transaction.findById(req.body.transaction).populate('seller');
            if (!sellerTrans) throw new ApiError(ErrorCode.TransactionNotFound, { transaction: req.body.transaction });

            await this._transactionService.pairTransactions(buyerTrans, sellerTrans);

            res.send({
                status: 'ok',
                pairedUser: {
                    firstName: sellerTrans.seller.firstName,
                    lastName: sellerTrans.seller.lastName,
                    mail: sellerTrans.seller.mail,
                    address: sellerTrans.seller.address,
                    province: sellerTrans.seller.province,
                    city: sellerTrans.seller.city,
                    phone: sellerTrans.seller.phone,
                    schoolName: sellerTrans.seller.school.name
                }
            });
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

            const isBackToPending = await this._transactionService.sendMessage(trans, sanitize(req.body.message));
            res.send({
                status: 'ok',
                isBackToPending
            });
        } catch (err) {
            next(err);
        }
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
            }).populate('seller buyer book');

            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound, { id: req.params.id });

            if (trans.status === TransactionStatus.free) {
                await this._transactionService.deleteTransaction(trans);
                res.send({ status: 'ok' });
            } else if (trans.status === TransactionStatus.pending || trans.status === TransactionStatus.notResponding) {
                await this._transactionService.cancelPendingTransaction(trans);

                const sales: ITransaction[] = await Transaction.find({
                    book: (trans.book as any)._id,
                    _id: {
                        $ne: (trans as any)._id
                    },
                    seller: {
                        $ne: null
                    }
                }).populate('seller').exec();

                // IMPROVE: extract to method
                res.send({
                    status: 'ok',
                    sales: sales.map(sale => ({
                        id: (sale as any)._id.toString(),
                        status: sale.status,
                        bookStatus: sale.bookStatus,
                        additionalMaterial: sale.additionalMaterial || false,
                        seller: {
                            firstName: sale.seller.firstName,
                            lastName: sale.seller.lastName
                        },
                        points: this._getTransactionPoints(sale)
                    })).sort((a, b) => b.points - a.points)
                });
            } else {
                throw new ApiError(ErrorCode.BadTransactionStatus, { id: req.params.id });
            }
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
            }).populate('book').exec();

            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound, { id: req.params.id });

            if (trans.status !== TransactionStatus.pending || !trans.paired) {
                throw new ApiError(ErrorCode.BadTransactionStatus, { id: (trans as any)._id });
            }

            const paired: ITransaction = await Transaction.findById(trans.paired).populate('buyer seller');

            await Transaction.update({
                _id: {
                    $in: [(trans as any)._id, (paired as any)._id]
                }
            }, {
                status: TransactionStatus.notResponding
            }, {
                multi: true
            });

            this._agenda.schedule('in 1 day', 'closeNotRespondingTransaction', {
                id: (trans as any)._id
            });

            this._mail.send({
                template: 'not-responding-followup',
                to: paired.seller ? paired.seller.mail : paired.buyer.mail,
                subject: 'Invito di risposta',
                data: {
                    book: trans.book.title
                }
            });

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async reportCompleted(req, res, next) {
        try {
            const trans: ITransaction = await Transaction.findOne({
                _id: req.params.id,
                $or: [{
                    seller: req.user._id
                }, {
                    buyer: req.user._id
                }]
            }).populate('buyer seller book');

            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound, { id: req.params.id });

            await Transaction.findByIdAndUpdate(req.params.id, {
                status: TransactionStatus.inCompletion
            });

            const paired: ITransaction = await Transaction.findById(trans.paired).populate('buyer seller');

            if (paired.status === TransactionStatus.inCompletion) {
                // Secondo click su completa, chiude la transazione
                trans.status = TransactionStatus.inCompletion;
                await this._transactionService.completeTransaction(trans);
            } else {
                // Primo click su completa
                this._agenda.schedule('in 1 day', 'closeCompletedTransaction', {
                    id: (trans as any)._id
                });

                this._mail.send({
                    template: 'complete-transaction',
                    to: paired.seller ? paired.seller.mail : paired.buyer.mail,
                    subject: 'Completa transazione',
                    data: {
                        book: trans.book.title,
                        type: paired.seller ? 'sales' : 'purchases'
                    }
                });
            }

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    private _getTransactionPoints(sale): number {
        let bookPoints = 0;

        switch (sale.bookStatus) {
            case BookStatus.new: bookPoints += 6; break;
            case BookStatus.pencilNotes: bookPoints += 4; break;
            case BookStatus.penNotes: bookPoints += 2; break;
        }

        return bookPoints + (sale.additionalMaterial ? 1 : 0);
    }
}
