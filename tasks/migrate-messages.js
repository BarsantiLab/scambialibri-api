const MongoClient = require('mongodb').MongoClient;
const async = require('async');

const URL = 'mongodb://localhost:27017';
const DB_DEST = 'ScambialibriDev';
const DB_SRC = 'Scambialibri';

const db = {};

MongoClient.connect(URL, (err, client) => {
    if (err) throw err;
    db.source = client.db(DB_SRC);
    db.dest = client.db(DB_DEST);

    db.source.collection('messages').find({}).toArray((err, data) => {
        if (err) throw err;

        async.eachSeries(data, (e, cb) => {
            db.dest.collection('transactions').findOne({
                messages: e._id
            }, (err, trans) => {
                if (err) return cb(err);
                if (!trans) return cb();

                db.dest.collection('messages').insertOne({
                    from: e.from,
                    to: e.to,
                    content: e.content,
                    date: e.date,
                    transaction: trans._id
                }, err => cb(err));
            });
        }, err => {
            if (err) throw err;
            console.log('DONE!');
            client.close();
        });
    });
});
