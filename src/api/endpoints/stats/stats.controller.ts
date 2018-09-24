import { injectable } from 'inversify';

// TODO: implements offer when merged with new transaction/offer models
import { Message } from 'models/message.model';
import { Transaction } from 'models/transaction.model';
import { User } from 'models/user.model';

import { objectFromEntries, promiseAllObject } from 'utils/misc';

// 102 utenti totali, 24 non hanno completato l'onboarding, 78 sì
// 507 transazioni totali, 397 free, 75 completate e 35 pending
// 94 messaggi totali

@injectable()
export class StatsController {
    async getGeneralStats(req, res, next) {
        try {
            const statsPromise = {
                users: this._getUsersStats(),
                transactions: this._getTransactionsStats(),
                messages: this._getMessagesStats()
            };

            const stats: any = await promiseAllObject(statsPromise);

            stats.users = stats.users[0];
            stats.messages = stats.messages[0];
            stats.transactions = {
                totalTransactions: stats.transactions.map(e => e.count).reduce((a, b) => a + b, 0),
                statuses: objectFromEntries(stats.transactions, 'status', 'count')
            };

            res.send(stats);
        } catch (err) {
            next(err);
        }
    }

    private async _getUsersStats() {
        return User.aggregate([{
            $group: {
                _id: null,
                totalUsers: {
                    $sum: 1
                },
                onboardingCompleted: {
                    $sum: {
                        $cond: ['$onboardingCompleted', 1, 0]
                    }
                },
                onboardingNotCompleted: {
                    $sum: {
                        $cond: ['$onboardingCompleted', 0, 1]
                    }
                }
            }
        }, {
            $project: {
                _id: false
            }
        }]);
    }

    private async _getTransactionsStats() {
        return Transaction.aggregate([{
            $group: {
                _id: '$status',
                count: {
                    $sum: 1
                },
            }
        }, {
            $project: {
                _id: false,
                status: '$_id',
                count: '$count'
            }
        }]);
    }

    private async _getMessagesStats() {
        return Message.aggregate([{
            $group: {
                _id: null,
                count: {
                    $sum: 1
                }
            }
        }, {
            $project: {
                _id: false
            }
        }]);
    }
}
