const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID; 
const async = require('async');
const _ = require('lodash');

const URL = 'mongodb://localhost:27017';
const DB_DEST = 'ScambialibriDev';
const DB_SRC = 'Scambialibri';

const db = {};

MongoClient.connect(URL, (err, client) => {
    if (err) throw err;
    db.source = client.db(DB_SRC);
    db.dest = client.db(DB_DEST);

    async.parallel({
        agendas: cb => db.dest.collection('agendas').remove({}, err => cb(err)),
        messages: cb => db.dest.collection('messages').remove({}, err => cb(err)),
        offers: cb => db.dest.collection('offers').remove({}, err => cb(err)),
        tokens: cb => db.dest.collection('tokens').remove({}, err => cb(err)),
        transactions: cb => db.dest.collection('transactions').remove({}, err => cb(err)),
    }, err => {
        if (err) throw err;
        
        db.source.collection('transactions').find({}).toArray((err, data) => {
            if (err) throw (err);
    
            const alreadyPaired = [];
            
            async.eachSeries(data, (e, cb) => {
                if (alreadyPaired.indexOf(e._id.toString()) > -1) return cb();
                else alreadyPaired.push(e._id.toString());
    
                console.log(`Offer => ID: ${e._id} - Status: ${e.status}`);
    
                if (e.status === 'free') {
                    db.dest.collection('offers').insertOne(getOffer(e, false), err => cb(err));
                } else {
                    db.source.collection('transactions').findOne({
                        _id: e.paired
                    }, (err, paired) => {
                        if (err) return cb(err);
                        alreadyPaired.push(paired._id.toString());

                        let offers = [];
                        let messages = [];

                        async.parallel({
                            offers: offerCb => {
                                db.dest.collection('offers').insertMany([
                                    getOffer(e, true),
                                    getOffer(paired, true)
                                ], (err, off) => {
                                    if (err) return offerCb(err);
                                    offers = off.ops;
                                    offerCb(); 
                                });
                            },

                            messages: messCb => {
                                db.source.collection('messages').find({
                                    _id: {
                                        $in: e.messages
                                    }
                                }).toArray((err, msg) => {
                                    if (err) return messCb(err);
                                    messages = msg;
                                    messCb();
                                });
                            }
                        }, err => {
                            if (err) return cb(err);

                            const sellOffer = offers.find(e => e.type === 'sell');
                            const buyOffer = offers.find(e => e.type === 'buy');

                            db.dest.collection('transactions').insertOne({
                                status: e.status,
                                buyerOffer: buyOffer._id,
                                buyerUser: buyOffer.user,
                                sellerOffer: sellOffer._id,
                                sellerUser: sellOffer.user,
    
                                book: e.book,
                                bookStatus: sellOffer.bookStatus,
                                additionalMaterial: sellOffer.additionalMaterial,
    
                                messages: [],
                                createdAt: e.pairingDate
                            }, (err, trans) => {
                                if (err) return cb(err);
                                console.log('   - Transaction ID: ' + trans.ops[0]._id);

                                const outMsg = messages.map(m => ({
                                    from: m.from,
                                    to: m.to,
                                    transaction: trans.ops[0]._id,
                                    content: m.content,
                                    date: m.date
                                }));

                                console.log('   - Messages: ' + outMsg.length);

                                if (outMsg.length > 0) {
                                    db.dest.collection('messages').insertMany(outMsg, (err, docs) => {
                                        if (err) return cb(err);
                                        const ids = docs.ops.map(d => d._id);

                                        db.dest.collection('transactions').updateOne({
                                            _id: trans.ops[0]._id
                                        }, {
                                            $set: {
                                                messages: ids
                                            }
                                        }, err => cb(err));
                                    });
                                } else {
                                    cb();
                                }
                            });
                        });
                    });
                }
            }, err => {
                if (err) throw(err);
                console.log('DONE!');
                client.close();
            });
        });
    });
});

function getOffer(e, pending) {
    const offerData = {
        type: e.buyer ? 'buy' : 'sell',
        user: e.buyer || e.seller,
        book: e.book,
        createdAt: e._id.getTimestamp()
    };

    if (pending !== undefined) offerData.isPending = pending;

    if (e.seller) {
        offerData.bookStatus = e.bookStatus;
        offerData.additionalMaterial = e.additionalMaterial || false;
    }

    return offerData;
}
