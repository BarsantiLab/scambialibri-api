import { injectable } from 'inversify';

import { ApiError, ErrorCode } from 'core/error-codes';

import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';

import { Message } from 'models/message.model';
import { Transaction } from 'models/transaction.model';

import { MailService } from 'services/mail.service';

@injectable()
export class TransactionService {

    constructor(
        private _mail: MailService
    ) { }

    async pairTransactions(trans1: ITransaction, trans2: ITransaction): Promise<void> {
        await Transaction.findByIdAndUpdate((trans1 as any)._id, {
            paired: (trans2 as any)._id,
            status: TransactionStatus.pending,
            pairingDate: new Date()
        });

        await Transaction.findByIdAndUpdate((trans2 as any)._id, {
            paired: (trans1 as any)._id,
            status: TransactionStatus.pending,
            pairingDate: new Date()
        });

        const sellerTrans = await Transaction.findById((trans2 as any)._id).populate('seller book');

        this._mail.send({
            template: 'new-transaction',
            to: sellerTrans.seller.mail,
            subject: 'Nuova transazione',
            data: {
                book: sellerTrans.book.title
            }
        });
    }

    async sendMessage(transaction: ITransaction, content: string): Promise<boolean> {
        const paired: ITransaction = await Transaction.findById(transaction.paired).populate('buyer seller book');

        const msg = new Message({
            from: transaction.buyer || transaction.seller,
            to: paired.buyer ? (paired.buyer as any)._id : (paired.seller as any)._id,
            content,
            date: new Date()
        });

        await msg.save();

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, (paired as any)._id]
            }
        }, {
            status: TransactionStatus.pending,
            $push: {
                messages: (msg as any)._id
            }
        }, {
            multi: true
        });

        this._mail.send({
            template: 'new-message',
            to: paired.buyer ? (paired.buyer as any).mail : (paired.seller as any).mail,
            subject: 'Nuovo messaggio',
            data: {
                book: paired.book.title,
                message: content
            }
        });

        return transaction.status === TransactionStatus.notResponding;
    }

    async deleteTransaction(transaction: ITransaction): Promise<void> {
        if (transaction.status !== TransactionStatus.free) {
            throw new ApiError(ErrorCode.BadTransactionStatus, { id: (transaction as any)._id });
        }

        await Message.remove({
            _id: {
                $in: transaction.messages
            }
        });

        await Transaction.findByIdAndRemove((transaction as any)._id);
    }

    async cancelPendingTransaction(transaction: ITransaction): Promise<void> {
        if ((transaction.status !== TransactionStatus.pending && transaction.status !== TransactionStatus.notResponding) || !transaction.paired) {
            throw new ApiError(ErrorCode.BadTransactionStatus, { id: (transaction as any)._id });
        }

        const paired: ITransaction = await Transaction.findById(transaction.paired).populate('buyer seller book');

        await Message.remove({
            _id: {
                $in: [...transaction.messages, ...paired.messages]
            }
        });

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, (paired as any)._id]
            }
        }, {
            status: TransactionStatus.free,
            messages: [],
            paired: null,
            pairingDate: null
        }, {
            multi: true
        });

        this._mail.send({
            template: 'transaction-cancelled',
            to: transaction.seller ? transaction.seller.mail : transaction.buyer.mail,
            subject: 'Transazione cancellata',
            data: {
                type: transaction.seller ? 'la vendita' : 'l\'acquisto',
                book: transaction.book.title
            }
        });

        this._mail.send({
            template: 'transaction-cancelled',
            to: paired.seller ? paired.seller.mail : paired.buyer.mail,
            subject: 'Transazione cancellata',
            data: {
                type: paired.seller ? 'la vendita' : 'l\'acquisto',
                book: paired.book.title
            }
        });
    }

    async completeTransaction(transaction: ITransaction): Promise<void> {
        if (transaction.status !== TransactionStatus.inCompletion) {
            throw new ApiError(ErrorCode.BadTransactionStatus, { id: (transaction as any)._id });
        }

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, transaction.paired]
            }
        }, {
            status: TransactionStatus.completed
        }, {
            multi: true
        });

        const paired = await Transaction.findById(transaction.paired).populate('seller buyer book');

        this._mail.send({
            template: 'transaction-completed',
            to: transaction.seller ? transaction.seller.mail : transaction.buyer.mail,
            subject: 'Transazione completata',
            data: {
                type: transaction.seller ? 'la vendita' : 'l\'acquisto',
                book: transaction.book.title
            }
        });

        this._mail.send({
            template: 'transaction-completed',
            to: paired.seller ? paired.seller.mail : paired.buyer.mail,
            subject: 'Transazione completata',
            data: {
                type: paired.seller ? 'la vendita' : 'l\'acquisto',
                book: paired.book.title
            }
        });
    }
}
