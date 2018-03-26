import { injectable } from 'inversify';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

import { IBook } from 'interfaces/book.interface';
import { ITransaction, TransactionStatus } from 'interfaces/transaction.interface';

import { Book } from 'models/book.model';
import { Transaction } from 'models/transaction.model';

// TODO: remove book-instance interface/model

@injectable()
export class TransactionController {
    async createTransaction(req, res, next) {
        try {
            const book: IBook = await Book.findById(req.body.book);
            // TODO: replace with right code
            if (!book) throw new ApiError(ErrorCode.InternalServerError, { id: req.body.book });

            const transaction: ITransaction = await Transaction.findOne({ book: req.body.book });
            // TODO: replace with right code
            if (transaction) throw new ApiError(ErrorCode.InternalServerError, { id: (transaction as any)._id.toString() });

            const transactionData: any = {
                book: mongoose.Types.ObjectId(req.body.book),
                messages: [],
                status: TransactionStatus.active
            };

            if (req.body.mode === 'sell') {
                transactionData.seller = req.user._id;
                transactionData.bookStatus = req.body.status;
                transactionData.additionalMaterial = req.body.additionalMaterial;
            } else {
                transactionData.buyer = req.user._id;
            }

            const newTransaction: ITransaction = await new Transaction(transactionData).save();

            // TODO: check property casing
            res.send({
                transactionId: (newTransaction as any)._id.toString()
            });
        } catch (err) {
            next(err);
        }
    }
}
