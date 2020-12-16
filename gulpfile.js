var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var sass = require('gulp-sass');
var minify = require('gulp-minify');
var browser = require('browser-sync').create();
var inject = require('gulp-inject');
var cacheBust = require('gulp-cache-bust');
var concat = require('gulp-concat');

gulp.task('js', function () {
    return gulp.src(['js/**/*.js', '!js/sim-worker.js'])
        .pipe(concat('warriorsim.js'))
        .pipe(minify({
            noSource: true,
            ext: {
                min: '.min.js'
            },
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('worker-js', function () {
    return gulp.src('js/sim-worker.js')
        .pipe(minify({
            noSource: true,
            ext: {
                min: '.min.js'
            },
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('worker-depends', function () {
    return gulp.src(['js/classes/*.js', 'js/data/*.js', 'js/globals.js', '!js/data/session.js'])
        .pipe(concat('worker-depends.js'))
        .pipe(minify({
            noSource: true,
            ext: {
                min: '.min.js'
            },
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task("sass", function () {
    return gulp
        .src("scss/style.scss")
        .pipe(sass())
        .pipe(cssnano())
        .pipe(gulp.dest("dist/css"));
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

gulp.task('watch', function (done) {
    gulp.watch('scss/*.scss', gulp.series('sass'));
    gulp.watch('js/**/*.js', gulp.series('js'));
    done()
});

gulp.task('browser', function (done) {
    browser.init({
        server: {
            baseDir: "./"
        }
    });
    done()
});

gulp.task("html", gulp.series("sass", "js", "libs", "theme", function () {
    let sources = gulp.src(["./dist/**/*.js", "./dist/css/style.css", "!./dist/js/sim-worker*.js", "!./dist/js/worker-depends*.js"], { read: false });

    return gulp.src("index.html")
        .pipe(inject(sources, { ignorePath: 'dist/', addRootSlash: false }))
        .pipe(inject(gulp.src('dist/css/theme.default.min.css'), { name: 'inject-theme', ignorePath: 'dist/', addRootSlash: false }))
        .pipe(cacheBust({ basePath: 'dist/' }))
        .pipe(gulp.dest("./dist"));
}));

gulp.task("dist", gulp.series("sass", "js", "worker-js", "worker-depends", "img", "libs", "theme", "html"));

gulp.task('default', gulp.series('dist', 'watch', 'browser'));