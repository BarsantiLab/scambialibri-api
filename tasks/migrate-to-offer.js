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
    
                        db.dest.collection('offers').insertMany([
                            getOffer(e, true),
                            getOffer(paired, true)
                        ], (err, offers) => {
                            if (err) return cb(err);
    
                            const sellOffer = offers.ops.find(e => e.type === 'sell');
                            const buyOffer = offers.ops.find(e => e.type === 'buy');
                            
                            db.dest.collection('transactions').insertOne({
                                status: e.status,
                                buyerOffer: buyOffer._id,
                                buyerUser: buyOffer.user,
                                sellerOffer: sellOffer._id,
                                sellerUser: sellOffer.user,
    
                                book: e.book,
                                bookStatus: sellOffer.bookStatus,
                                additionalMaterial: sellOffer.additionalMaterial,
    
                                messages: e.messages,
                                createdAt: e.pairingDate
                            }, err => cb(err));
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
