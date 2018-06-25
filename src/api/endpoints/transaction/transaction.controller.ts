import { injectable } from 'inversify';
import * as sanitize from 'sanitize-html';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBookModel } from 'interfaces/book.interface';
import { IMessageModel } from 'interfaces/message.interface';
import { IOfferModel } from 'interfaces/offer.interface';
import { ITransactionModel, TransactionStatus} from 'interfaces/transaction.interface';
import { IUser, IUserModel } from 'interfaces/user.interface';

import { Message } from 'models/message.model';
import { Offer } from 'models/offer.model';
import { Transaction } from 'models/transaction.model';
import { User } from 'models/user.model';

import { AgendaService } from 'services/agenda.service';
import { MailService } from 'services/mail.service';
import { OfferController } from '../offer/offer.controller';

// TODO: rework on "not responding" feature: enabled if the transaction last message pushed is older than 24h
// TODO: add last message pushed date on transaction

@injectable()
export class TransactionController {
    constructor(
        private _offerCtrl: OfferController,
        private _agenda: AgendaService,
        private _mail: MailService
    ) {
        // TODO: move jobs declaration in dedicated class

        this._agenda.define('closeNotRespondingTransaction', async job => {
            const trans: ITransactionModel = await Transaction.findById(job.attrs.data.id).populate('buyerUser sellerUser book');
            if (!trans || trans.status !== TransactionStatus.notResponding) return;
            this._cancelTransaction(trans);
        });

        this._agenda.define('closeCompletedTransaction', async job => {
            const trans: ITransactionModel = await Transaction.findById(job.attrs.data.id).populate('buyerUser sellerUser book');
            if (!trans || trans.status !== TransactionStatus.inCompletion) return;
            this._completeTransaction(trans);

            // TODO: send report to administrator
        });
    }

    async createTransaction(req, res, next) {
        try {
            const buyer: IOfferModel = await Offer.findById(req.body.buyer);
            if (!buyer) throw new ApiError(ErrorCode.OfferNotFound, { id: req.body.buyer });
            if (!req.user._id.equals(buyer.user)) throw new ApiError(ErrorCode.OfferNotRelatedToUser, { id: req.body.buyer });

            const seller: IOfferModel = await Offer.findById(req.body.seller);
            if (!seller) throw new ApiError(ErrorCode.OfferNotFound, { id: req.body.seller });

            const oldTransaction = await Transaction.findOne({
                $or: [{
                    buyerOffer: buyer._id
                }, {
                    sellerOffer: seller._id
                }]
            });

            if (oldTransaction) throw new ApiError(ErrorCode.OfferIsAlreadyPaired);

            const newTrans: ITransactionModel = await new Transaction({
                status: TransactionStatus.pending,

                buyerOffer: buyer._id,
                buyerUser: buyer.user,
                sellerOffer: seller._id,
                sellerUser: seller.user,

                book: seller.book,
                bookStatus: seller.bookStatus,
                additionalMaterial: seller.additionalMaterial,

                messages: [],
                createdAt: new Date()
            }).save();

            await Offer.update({
                _id: {
                    $in: [buyer._id, seller._id]
                }
            }, {
                isPending: true
            });

            const sellerUser: IUser = await User.findById(seller.user).populate('school');

            res.send({
                status: 'ok',
                seller: {
                    firstName: sellerUser.firstName,
                    lastName: sellerUser.lastName,
                    mail: sellerUser.mail,
                    address: sellerUser.address,
                    province: sellerUser.province,
                    city: sellerUser.city,
                    phone: sellerUser.phone,
                    schoolName: sellerUser.school.name
                },
                transaction: {
                    id: newTrans._id
                }
            });
        } catch (err) {
            next(err);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const trans: ITransactionModel = await Transaction.findById(req.params.id).populate('buyerUser sellerUser book');
            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound);
            if (!req.user._id.equals(trans.sellerUser._id) && !req.user._id.equals(trans.buyerUser._id)) throw new ApiError(ErrorCode.TransactionNotRelatedToUser);

            // Create new message
            const content = sanitize(req.body.message);
            const newMessage: IMessageModel = new Message({
                from: req.user._id,
                to: req.user._id.equals(trans.buyerUser) ? trans.sellerUser : trans.buyerUser,
                content,
                date: new Date()
            });

            await newMessage.save();

            // Update transaction
            trans.messages.push(newMessage._id);

            let isBackToPending = false;
            if (trans.status === TransactionStatus.notResponding) {
                trans.status = TransactionStatus.pending;
                isBackToPending = true;
            }

            await trans.save();

            // Send mail
            const recipient: IUserModel = await User.findById(req.user._id.equals(trans.buyerUser) ? trans.sellerUser : trans.buyerUser);
            this._mail.send({
                template: 'new-message',
                to: recipient.mail,
                subject: 'Nuovo messaggio',
                data: {
                    book: trans.book.title,
                    message: content
                }
            });

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
            // TODO: move to middleware?
            const trans: ITransactionModel = await Transaction.findById(req.params.id).populate('buyerUser sellerUser book');
            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound);
            if (!req.user._id.equals(trans.sellerUser._id) && !req.user._id.equals(trans.buyerUser._id)) throw new ApiError(ErrorCode.TransactionNotRelatedToUser);
            if (trans.status !== TransactionStatus.pending) throw new ApiError(ErrorCode.BadTransactionStatus);

            await this._cancelTransaction(trans);

            res.send({
                sales: await this._offerCtrl.getSalesForBook(trans.book as IBookModel),
                status: 'ok'
            });
        } catch (err) {
            next(err);
        }
    }

    async reportNotResponding(req, res, next) {
        try {
            // TODO: move to middleware?
            const trans: ITransactionModel = await Transaction.findById(req.params.id).populate('sellerUser buyerUser book');
            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound);
            if (!req.user._id.equals(trans.sellerUser) && !req.user._id.equals(trans.buyerUser)) throw new ApiError(ErrorCode.TransactionNotRelatedToUser);
            if (trans.status !== TransactionStatus.pending) throw new ApiError(ErrorCode.BadTransactionStatus);

            trans.status = TransactionStatus.notResponding;
            await trans.save();

            this._agenda.schedule('in 1 day', 'closeNotRespondingTransaction', {
                id: trans._id
            });

            this._mail.send({
                template: 'not-responding-followup',
                to: req.user._id.equals(trans.sellerUser._id) ? trans.buyerUser._id : trans.sellerUser._id,
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
            // TODO: move to middleware?
            const trans: ITransactionModel = await Transaction.findById(req.params.id).populate('sellerUser buyerUser book');
            if (!trans) throw new ApiError(ErrorCode.TransactionNotFound);
            if (!req.user._id.equals(trans.sellerUser) && !req.user._id.equals(trans.buyerUser)) throw new ApiError(ErrorCode.TransactionNotRelatedToUser);

            if (trans.status === TransactionStatus.pending) {
                this._agenda.schedule('in 1 day', 'closeCompletedTransaction', {
                    id: trans._id
                });

                this._mail.send({
                    template: 'complete-transaction',
                    to: req.user._id.equals(trans.sellerUser._id) ? trans.buyerUser._id : trans.sellerUser._id,
                    subject: 'Completa transazione',
                    data: {
                        book: trans.book.title,
                        type: req.user._id.equals(trans.sellerUser._id) ? 'sales' : 'purchases'
                    }
                });

                trans.status = TransactionStatus.inCompletion;
                await trans.save();
            } else if (trans.status === TransactionStatus.inCompletion) {
                await this._completeTransaction(trans);
            } else {
                throw new ApiError(ErrorCode.BadTransactionStatus);
            }

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    private async _cancelTransaction(transaction: ITransactionModel) {
        await Message.remove({
            _id: {
                $in: transaction.messages
            }
        });

        await Offer.update({
            _id: {
                $in: [transaction.buyerOffer, transaction.sellerOffer]
            }
        }, {
            isPending: false
        }, {
            multi: true
        });

        await transaction.remove();

        this._mail.send({
            template: 'transaction-cancelled',
            to: transaction.sellerUser.mail,
            subject: 'Transazione cancellata',
            data: {
                type: 'la vendita',
                book: transaction.book.title
            }
        });

        this._mail.send({
            template: 'transaction-cancelled',
            to: transaction.buyerUser.mail,
            subject: 'Transazione cancellata',
            data: {
                type: 'l\'acquisto',
                book: transaction.book.title
            }
        });
    }

    private async _completeTransaction(transaction: ITransactionModel) {
        transaction.status = TransactionStatus.completed;
        transaction.save();

        this._mail.send({
            template: 'transaction-completed',
            to: transaction.sellerUser.mail,
            subject: 'Transazione completata',
            data: {
                type: 'la vendita',
                book: transaction.book.title
            }
        });

        this._mail.send({
            template: 'transaction-completed',
            to: transaction.buyerUser.mail,
            subject: 'Transazione completata',
            data: {
                type: 'l\'acquisto',
                book: transaction.book.title
            }
        });
    }
}
