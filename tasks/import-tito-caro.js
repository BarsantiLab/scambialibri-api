const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID; 
const async = require('async');
const csv = require('fast-csv');
const _ = require('lodash');

const URL = 'mongodb://localhost:27017';
const DB_NAME = 'Scambialibri';
const FILE = 'tito-caro-2019-2';
const SCHOOL_NAME = 'Liceo "Tito Lucrezio Caro"';

MongoClient.connect(URL, (err, client) => {
    if (err) throw err;
    const db = client.db(DB_NAME);

    let specs = [];
    let grades = [];
    let books = [];

    csv.fromPath(`import-data/${FILE}.csv`, {
        delimiter: ','
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
                console.log('- Looking for school...');
                db.collection('schools').findOne({
                    name: SCHOOL_NAME
                }, (err, school) => {
                    if (err) return cb(err);
                    if (school) {
                        console.log('   - School found!')
                        schoolId = school._id;
                        cb();
                    } else {
                        console.log('   - School not found, creating new school...');
                        db.collection('schools').insertOne({
                            name: SCHOOL_NAME,
                            specializations: []
                        }, (err, res) => {
                            if (err) return cb(err);
                            console.log('   School created!');
                            schoolId = res.insertedId;
                            cb();
                        });
                    }
                });
            },

            specs: cb => {
                console.log('- Looking for specializations...');
                specs = _.uniqBy(specs, 'name');

                async.eachSeries(specs, (spec, specCb) => {
                    db.collection('specializations').findOne({
                        name: spec.name,
                        school: schoolId
                    }, (err, dbSpec) => {
                        if (err) return specCb(err);

                        if (dbSpec) {
                            console.log(`   - Specialization ${spec.name} found!`);
                            specDocs.push(dbSpec);
                            specCb();
                        } else {
                            console.log(`   - Specialization ${spec.name} not found, creating...`);
                            
                            db.collection('specializations').insert({
                                name: spec.name,
                                school: schoolId
                            }, (err, res) => {
                                if (err) return cb(err);
                                // TODO: test return value
                                specDocs.push(res.ops[0]);

                                db.collection('schools').update({
                                    _id: ObjectId(schoolId)
                                }, {
                                    $push: {
                                        specializations: ObjectId(schoolId)
                                    }
                                }, (err) => specCb(err));
                            });
                        }
                    });
                }, (err) => cb(err));
            },

            grades: cb => {
                console.log('- Looking for grades');

                grades = _.uniqBy(grades, e => e.year + e.section + e.specialization);

                async.eachSeries(grades, (grade, gradeCb) => {
                    db.collection('grades').findOne({
                        year: grade.year,
                        section: grade.section,
                        specialization: specDocs.find(k => k.name === grade.specialization)._id,
                        school: schoolId
                    }, (err, gradeDoc) => {
                        if (err) return gradeCb(err);

                        if (gradeDoc) {
                            console.log(`   - Grade ${grade.year}${grade.section} (${grade.specialization}) found!`);

                            gradeDocs.push(gradeDoc);
                            gradeCb();
                        } else {
                            console.log(`   - Grade ${grade.year}${grade.section} (${grade.specialization}) not found, creating...`);

                            db.collection('grades').insert({
                                year: grade.year,
                                section: grade.section,
                                specialization: specDocs.find(k => k.name === grade.specialization)._id,
                                school: schoolId,
                                books: []
                            }, (err, newGrade) => {
                                console.log('   - Grade created!');

                                // TODO: test return value
                                gradeDocs.push(newGrade.ops[0]);
                                gradeCb();
                            });
                        }
                    });
                }, err => cb(err));
            },

            books: cb => {
                console.log('- Looking for books');

                const bookDocs = [];

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

                async.eachSeries(out, (book, bookCb) => {
                    db.collection('books').findOne({
                        isbn: book.isbn
                    }, (err, bookDoc) => {
                        if (err) return bookCb(err);

                        if (bookDoc) {
                            console.log(`   - Book '${book.title}' found!`);

                            bookDocs.push(bookDoc);
                            bookCb();
                        } else {
                            console.log(`   - Book '${book.title}' not found, creating...`);

                            db.collection('books').insert(_.pick(book, [
                                'isbn', 'author', 'title', 'subtitle', 'price'
                            ]), (err, bookDoc) => {
                                if (err) return bookCb(err);
                                bookDocs.push(bookDoc.ops[0]);
                                bookCb();
                            });
                        }
                    });
                }, err => {
                    console.log('- Associating books with grades');
                    if (err) return cb(err);

                    async.eachSeries(books, (book, bookCb) => {
                        const gradeIds = [];
                        const bookDoc = bookDocs.find(k => k.isbn === book.isbn);

                        async.eachSeries(book.grades, (grade, gradeCb) => {
                            db.collection('grades').findOne({
                                specialization: specDocs.find(k => k.name === grade.specialization)._id,
                                year: grade.year,
                                section: grade.section
                            }, (err, gradeDoc) => {
                                if (err) return gradeCb(err);

                                gradeIds.push(gradeDoc._id);
                                const gradeBookId = gradeDoc.books.find(k => k.toString() === bookDoc._id.toString());

                                if (gradeBookId) {
                                    console.log(`   - Book '${book.title}' found in ${gradeDoc.year}${gradeDoc.section} (${grade.specialization})!`);
                                    gradeCb();
                                } else {
                                    console.log(`   - Book '${book.title}' not found in ${gradeDoc.year}${gradeDoc.section} (${grade.specialization}), adding...`);

                                    db.collection('grades').findOneAndUpdate({
                                        _id: gradeDoc._id
                                    }, {
                                        $push: {
                                            books: bookDoc._id
                                        }
                                    }, (err) => {
                                        console.log('   - Book added!');
                                        gradeCb(err);
                                    });
                                }
                            });
                        }, (err) => {
                            if (err) return bookCb(err);

                            db.collection('books').findOneAndUpdate({
                                _id: bookDoc._id
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