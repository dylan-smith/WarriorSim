var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var sass = require('gulp-sass');
var minify = require('gulp-minify');
var browser = require('browser-sync').create();
var inject = require('gulp-inject');
var cacheBust = require('gulp-cache-bust');
var concat = require('gulp-concat');
var webpack = require('webpack-stream');

gulp.task('js', function () {
    return gulp.src('js/**/*.js')
        .pipe(webpack({
            mode: 'production',
            output: {
                filename: 'warriorsim.min.js'
            }
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('bundle-tests', function () {
    return gulp.src(['js/classes/**/*.js', 'js/data/**/*.js', 'tests/**/*.js'])
        .pipe(webpack({
            mode: 'production',
            output: {
                filename: 'tests.min.js'
            }
        }))
        .pipe(gulp.dest('dist/tests'))
});

gulp.task('sass', function () {
    return gulp.src('scss/style.scss')
        .pipe(sass())
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('img', function () {
    return gulp.src('img/**')
        .pipe(gulp.dest('dist/img'));
});

gulp.task('libs', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js',
        'node_modules/tablesorter/dist/js/jquery.tablesorter.min.js',
        'node_modules/tablesorter/dist/js/jquery.tablesorter.widgets.min.js',
        'node_modules/chart.js/dist/Chart.min.js'])
        .pipe(concat('libs.min.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('theme', function () {
    return gulp.src('node_modules/tablesorter/dist/css/theme.default.min.css')
        .pipe(gulp.dest('dist/css'));
})

gulp.task('watch', function () {
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('js/**/*.js', ['js']);
});

gulp.task('browser', function () {
    browser.init({
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('browser-prod', function () {
    browser.init({
        server: {
            baseDir: "./dist/"
        }
    });
});

gulp.task("html", ["sass", "js", "libs", "theme"], function () {
    let sources = gulp.src(["./dist/js/**/*.js", "./dist/css/style.css"], { read: false });

    return gulp.src("index.html")
        .pipe(inject(sources, { ignorePath: 'dist/', addRootSlash: false }))
        .pipe(inject(gulp.src('dist/css/theme.default.min.css'), { name: 'inject-theme', ignorePath: 'dist/', addRootSlash: false }))
        .pipe(cacheBust({ basePath: 'dist/' }))
        .pipe(gulp.dest("./dist"));
});

gulp.task("build", ["sass", "js", "img", "libs", "theme", "html"]);

gulp.task('default', ['build', 'watch', 'browser']);

gulp.task('prod', ['build', 'watch', 'browser-prod']);