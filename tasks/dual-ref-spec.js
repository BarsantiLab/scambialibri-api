const MongoClient = require('mongodb').MongoClient;
const async = require('async');

const URL = 'mongodb://localhost:27017';
const DB_NAME = 'Scambialibri';

MongoClient.connect(URL, (err, client) => {
    if (err) throw err;
    const db = client.db(DB_NAME);

    db.collection('schools').find().toArray((err, data) => {
        if (err) throw err;

        async.eachSeries(data, (school, schoolCb) => {
            console.log(`Processing school '${school.name}'`);
            async.eachSeries(school.specializations, (spec, cb) => {
                console.log(`  Processing specialization '${spec}'`);

                db.collection('specializations').updateOne({
                    _id: spec
                }, {
                    $set: {
                        school: school._id
                    }
                }, cb);
            }, schoolCb);
        }, (err) => {
            if (err) throw err;

            console.log('DONE!');
            client.close();
        });
    });
});