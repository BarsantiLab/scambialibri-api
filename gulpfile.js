const gulp = require('gulp');
const merge = require('merge2');
var runSeq = require('run-sequence');

const clean = require('gulp-clean');
const typescript = require('gulp-typescript');
const tslint = require('gulp-tslint');
const sourcemaps = require('gulp-sourcemaps');
const copy = require('gulp-copy');
const mocha = require('gulp-spawn-mocha');
const apidoc = require('gulp-apidoc');
const sass = require('gulp-sass');
const pug = require('gulp-pug');
const inlineCss = require('gulp-inline-css');

const tsProject = typescript.createProject('tsconfig.json', {
    declaration: true
});

gulp.task('clean', () => {
    return merge([
        gulp.src('release/definitions/*', { read: false }).pipe(clean()),
        gulp.src('release/js/bin/*', { read: false }).pipe(clean())
    ]);
});

gulp.task('mail-clean', () => {
    return gulp.src('release/js/mails/*', { read: false }).pipe(clean());
});

gulp.task('build', ['clean'], () => {
    const tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tslint({ configuration: 'tslint.json' }))
        .pipe(tslint.report({ emitError: true }))
        .pipe(tsProject());

    return merge([
        tsResult.js
            .pipe(sourcemaps.mapSources((sourcePath, file) => {
                return '../../../src/' + sourcePath;
            }))
            .pipe(sourcemaps.write('.', {
                includeContent: false
            }))
            .pipe(gulp.dest('release/js')),
        tsResult.dts.pipe(gulp.dest('release/definitions')),
        gulp.src('src/**/*.js').pipe(copy('release/js', { prefix: 1 }))
    ]);
});

gulp.task('test', () => {
    return gulp
        .src(['release/js/**/*.test.js'])
        .pipe(mocha({
            env: {
                NODE_ENV: 'test',
                PC_SILENT: true
            },
            timeout: 3000
        }));
});

gulp.task('docs', (done) => {
    apidoc({
        src: 'src/',
        dest: 'docs/api/',
        config: './'
    }, done);
});

gulp.task('mail-html', () => {
    return gulp
        .src('mails/templates/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('release/js/mails'));
});

gulp.task('mail-css', () => {
    return gulp
        .src('mails/style/mail.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(gulp.dest('release/js/mails/style'))
});

gulp.task('mail-inline', () => {
    return gulp
        .src('release/js/mails/*.html')
        .pipe(inlineCss({
            applyStyleTags: false,
            removeStyleTags: false
        }))
        .pipe(gulp.dest('release/js/mails'))
});

gulp.task('mail', (callback) => runSeq('mail-clean', ['mail-html', 'mail-css'], 'mail-inline', callback));
gulp.task('default', ['build']);