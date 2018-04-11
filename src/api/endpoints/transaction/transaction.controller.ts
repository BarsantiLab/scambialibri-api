import { injectable } from 'inversify';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';

import { Book } from 'models/book.model';
import { Transaction } from 'models/transaction.model';

@injectable()
export class TransactionController {
    async createTransaction(req, res, next) {
        try {
            const book: IBook = await Book.findById(req.body.book);
            if (!book) throw new ApiError(ErrorCode.BookNotFound, { id: req.body.book });

            const transaction: ITransaction = await Transaction.findOne({ book: req.body.book });
            if (transaction) throw new ApiError(ErrorCode.TransactionNotFound, { id: (transaction as any)._id.toString() });

            const transactionData: any = {
                book: mongoose.Types.ObjectId(req.body.book),
                messages: [],
                status: TransactionStatus.active
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

            await Transaction.findByIdAndRemove(req.params.id);
            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }
}
