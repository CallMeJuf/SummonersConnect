const Gulp   = require('gulp');
const ESLint = require('gulp-eslint');
const GUtil  = require('gulp-util');
const LintDirs = [
    './index.js',
    './server.js',
    './database/*.js',
    './models/*.js',
    './utils/*.js'
];
Gulp.task('default', function(done) {
    GUtil.log(
        '\n\n',
        GUtil.colors.bold.red('Available Commands: \n'),
        '  gulp', GUtil.colors.green('eslint         '),
        GUtil.colors.grey('  - Run Linting.\n'),
        '  gulp', GUtil.colors.green('eslint-fix     '),
        GUtil.colors.grey('  - Run Linting with auto fixing.\n'),
        '\n'
    );
    done();
});

Gulp.task('eslint-fix', function () {
    return Gulp.src(LintDirs)
        // Covering files
        .pipe(ESLint({ fix: true }))
        // Force `require` to return covered files
        .pipe(ESLint.format())
        .pipe( Gulp.dest(file => file.base) );
});

Gulp.task('eslint', function () {
    return Gulp.src(LintDirs)
        // Covering files
        .pipe(ESLint({ }))
        // Force `require` to return covered files
        .pipe(ESLint.format());
});

