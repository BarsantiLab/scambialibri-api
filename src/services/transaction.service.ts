import { injectable } from 'inversify';

import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';

import { ApiError, ErrorCode } from 'core/error-codes';

import { Message } from 'models/message.model';
import { Transaction } from 'models/transaction.model';

import { AgendaService } from './agenda.service';

@injectable()
export class TransactionService {

    constructor(
        private _agenda: AgendaService
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

        // TODO: send mails
    }

    async sendMessage(transaction: ITransaction, content: string): Promise<void> {
        const paired: ITransaction = await Transaction.findById(transaction.paired);

        const msg = new Message({
            from: transaction.buyer || transaction.seller,
            to: paired.buyer || paired.seller,
            content,
            date: new Date()
        });

        await msg.save();

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, (paired as any)._id]
            }
        }, {
            $push: {
                messages: (msg as any)._id
            }
        }, {
            multi: true
        });

        // TODO: send mails
    }

    async deleteTransaction(transaction: ITransaction): Promise<void> {
        // TODO: move to ApiError
        if (transaction.status !== TransactionStatus.free) {
            throw new Error('Transaction is not free');
        }

        await Message.remove({
            _id: {
                $in: transaction.messages
            }
        });

        await Transaction.findByIdAndRemove((transaction as any)._id);
    }

    async cancelPendingTransaction(transaction: ITransaction): Promise<void> {
        // TODO: move to ApiError
        if ((transaction.status !== TransactionStatus.pending && transaction.status !== TransactionStatus.notResponding) || !transaction.paired) {
            throw new Error('Transaction is not pending or missing paired transaction');
        }

        const paired: ITransaction = await Transaction.findById(transaction.paired);

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

        // TODO: send mails
    }

    // TODO: move into controller?
    async reportNotResponding(transaction: ITransaction): Promise<void> {
        if (transaction.status !== TransactionStatus.pending || !transaction.paired) {
            throw new ApiError(ErrorCode.BadTransactionStatus, { id: (transaction as any)._id });
        }

        const paired: ITransaction = await Transaction.findById(transaction.paired);

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, (paired as any)._id]
            }
        }, {
            status: TransactionStatus.notResponding
        }, {
            multi: true
        });

        this._agenda.schedule('in 1 day', 'closeNotRespondingTransaction', {
            id: (transaction as any)._id
        });

        // TODO: send mails
    }

    // TODO: move into controller?
    async reportCompleted(transaction: ITransaction): Promise<void> {
        if (transaction.status !== TransactionStatus.pending || !transaction.paired) {
            throw new ApiError(ErrorCode.BadTransactionStatus, { id: (transaction as any)._id });
        }

        await Transaction.update({
            _id: {
                $in: [(transaction as any)._id, transaction.paired]
            }
        }, {
            status: TransactionStatus.inCompletion
        }, {
            multi: true
        });

        this._agenda.schedule('in 1 day', 'closeCompletedTransaction', {
            id: (transaction as any)._id
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

        // TODO: send mails
    }
}
