const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID; 
const async = require('async');
const csv = require('fast-csv');
const _ = require('lodash');

const URL = 'mongodb://localhost:27017';
const DB_NAME = 'ScambialibriDev';
const FILE = 'tito-caro';
const SCHOOL_NAME = 'Liceo "Tito Lucrezio Caro"';

MongoClient.connect(URL, (err, client) => {
    if (err) throw err;
    const db = client.db(DB_NAME);

    let specs = [];
    let grades = [];
    let books = [];

    csv.fromPath(`import-data/${FILE}.csv`, {
        delimiter: ';'
    }).on('data', (data) => {
        grades.push({
            year: parseInt(data[0]),
            section: data[1],
            specialization: capitalize(data[3].trim().toLowerCase()),
            books: []
        });

        specs.push({
            name: capitalize(data[3].trim().toLowerCase()),
        });

        books.push({
            isbn: data[5],
            price: parseInt(data[11].trim().replace(',', '.')),
            author: data[6].trim().toLowerCase() === 'aa vv' ? 'AA. VV.' : capitalize(data[6].trim().toLowerCase()),
            subtitle: capitalize(data[8].trim().toLowerCase()),
            title: capitalize(data[7].trim().toLowerCase()),
            year: parseInt(data[0]),
            section: data[1],
            specialization: capitalize(data[3].trim().toLowerCase())
        });
    }).on('finish', () => {
        let schoolId = null;
        let specDocs = [];
        let gradeDocs = [];

        async.series({
            school: cb => {
                db.collection('schools').insertOne({
                    name: SCHOOL_NAME,
                    specializations: []
                }, (err, res) => {
                    if (err) return cb(err);
                    schoolId = res.insertedId;
                    cb();
                });
            },

            specs: cb => {
                specs = _.uniqBy(specs, 'name');
                db.collection('specializations').insertMany(specs.map(e => ({
                    name: e.name,
                    school: schoolId
                })), (err, res) => {
                    if (err) return cb(err);
                    specDocs = res.ops;

                    db.collection('schools').update({
                        _id: ObjectId(schoolId)
                    }, {
                        $set: {
                            specializations: specDocs.map(e => ObjectId(e._id))
                        }
                    }, cb);
                });
            },

            grades: cb => {
                grades = _.uniqBy(grades, e => e.year + e.section + e.specialization);
                db.collection('grades').insertMany(grades.map(e =>({
                    year: e.year,
                    section: e.section,
                    specialization: specDocs.find(k => k.name === e.specialization)._id,
                    school: schoolId,
                    books: []
                })), (err, res) => {
                    if (err) return cb(err);
                    gradeDocs = res.ops;
                    cb();
                });
            },

            books: cb => {
                const group = _.groupBy(books, 'isbn');
                const out = _.uniqBy(books, 'isbn').map(e => {
                    e.grades = group[e.isbn].map(k => _.pick(k, ['year', 'section', 'specialization']));
        
                    delete e.year;
                    delete e.section;
                    delete e.specialization;
        
                    if (e.grades.length === 0) {
                        console.log('WARN!');
                    }
        
                    return e;
                });
                
                db.collection('books').insertMany(out.map(e => _.pick(e, [
                    'isbn', 'author', 'title', 'subtitle', 'price'
                ])), (err, res) => {
                    if (err) return cb(err);
                    
                    async.eachSeries(out, (e, bookCb) => {
                        const gradeIds = [];

                        async.eachSeries(e.grades, (grade, gradeCb) => {
                            db.collection('grades').findOne({
                                specialization: specDocs.find(k => k.name === grade.specialization)._id,
                                year: grade.year,
                                section: grade.section
                            }, (err, data) => {
                                if (err) return gradeCb(err);

                                gradeIds.push(data._id);
                                
                                db.collection('grades').findOneAndUpdate({
                                    _id: data._id
                                }, {
                                    $push: {
                                        books: res.ops.find(k => k.isbn === e.isbn)._id
                                    }
                                }, gradeCb);
                            });
                        }, (err) => {
                            if (err) return bookCb(err);

                            db.collection('books').findOneAndUpdate({
                                _id: res.ops.find(k => k.isbn === e.isbn)._id
                            }, {
                                $set: {
                                    grades: gradeIds
                                }
                            }, bookCb);
                        });
                    }, cb);
                });
            }
        }, err => {
            if (err) return console.log(err);
            console.log('DONE!');
            client.close();
        });
    });
});

function capitalize(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}