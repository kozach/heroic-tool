'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    config = require('./config.json'),
    runSequence = require('run-sequence'),
    cssnano = require('gulp-cssnano'),
    beeper = require('beeper'),
    glob = require('glob');


// gulp --type prod

var onError = function(err) {
    beeper();
    console.log(err);
};

var getStamp = function() {
    var myDate = new Date();

    var myYear = myDate.getFullYear().toString();
    var myMonth = ('0' + (myDate.getMonth() + 1)).slice(-2);
    var myDay = ('0' + myDate.getDate()).slice(-2);
    var mySeconds = myDate.getSeconds().toString();

    var myFullDate = myYear + myMonth + myDay + mySeconds;

    return myFullDate;
};

var patternsHTML = [{
    pattern: /\.css(?=[',"])/g,
    replacement: '\.css?' + getStamp()
}, {
    pattern: /\.js(?=[',"])/g,
    replacement: '\.js?' + getStamp()
}, {
    pattern: /\.jpg(?=[',"])/g,
    replacement: '\.jpg?' + getStamp()
}, {
    pattern: /\.ico(?=[',"])/g,
    replacement: '\.ico?' + getStamp()
}, {
    pattern: /\.svg(?=[',"])/g,
    replacement: '\.svg?' + getStamp()
}, {
    pattern: /\.png(?=[',"])/g,
    replacement: '\.png?' + getStamp()
}, {
    pattern: /\.gif(?=[',"])/g,
    replacement: '\.gif?' + getStamp()
}, ];

var patternsCSS = [{
    pattern: /\.jpg(?=[',"])/g,
    replacement: '\.jpg?' + getStamp()
}, {
    pattern: /\.svg(?=[',"])/g,
    replacement: '\.svg?' + getStamp()
}, {
    pattern: /\.png(?=[',"])/g,
    replacement: '\.png?' + getStamp()
}, {
    pattern: /\.gif(?=[',"])/g,
    replacement: '\.gif?' + getStamp()
}, ];

gulp.task('browser-sync', function() {
    browserSync.init(null, {
        server: {
            baseDir: './build'
        }
    });
});

gulp.task('clean-url', function() {
    gulp.src('build/**/*.html')
        .pipe($.replace(/\.html/g, ''))
        .pipe(gulp.dest('build'));
});

gulp.task('chmod', function() {
    return gulp.src('build/**/*')
        .pipe($.chmod(644))
        .pipe(gulp.dest('build'));
});

gulp.task('sitemap', function() {
    // gulp.src('build/**/*.html', {
    //      read: false
    //  })
    //  .pipe($.sitemap({
    //      siteUrl: config.glob.site
    //  }))
    //  .pipe(gulp.dest('build/'));
});

gulp.task('clean', function() {
    return gulp.src(['./build/', '.sass-cache/', './.tmp', './jade/_includes/_html/'], {
            read: false
        })
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.rimraf());
});

gulp.task('files', function() {
    return gulp.src(['./files/**/*', './files/**/.*', '!./files/**/.DS_Store'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('jade-init', function() {
    return gulp.src(['jade/**/*.jade', '!jade/**/_*'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.jade({
            pretty: true,
            basedir: './jade'
        }))
        .pipe($.environment.if.production($.if('*.html', $.htmlmin({
            collapseWhitespace: true,
            keepClosingSlash: true
        }))))
        .pipe(gulp.dest('build'));
});

gulp.task('images', function() {
    return gulp.src(['img/**/*', '!img/base64/**/*', '!img/base64'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('build/img'))
    // .pipe($.filter('**/*.+(jpg|jpeg|png)'))
    // .pipe($.webp())
    // .pipe(gulp.dest('build/img'))
});
gulp.task('images-gen', function() {
    return gulp.src(['img/**/*'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest('img'));
});

gulp.task('cachebust:css', function() {
    return gulp.src('./build/**/*.css')
        .pipe($.frep(patternsCSS))
        .pipe(gulp.dest('build'))
});

gulp.task('cachebust:html', function() {
    return gulp.src('./build/**/*.html')
        .pipe($.frep(patternsHTML))
        .pipe(gulp.dest('build'))
});

gulp.task('cachebust', function(callback) {
    runSequence(
        ['cachebust:css', 'cachebust:html'],
        callback);
});

gulp.task('jade', function(callback) {
    runSequence(
        'jade-init',
        ['sitemap', 'cachebust'],
        callback);
});

gulp.task('default', function(callback) {
    runSequence(
        'clean',
        ['css', 'js', 'images', 'files',
        'jade'],
        callback);
});

gulp.task('js', function() {
    return gulp.src(config.js.include)
        .pipe($.concat('compiled.js'))
        .pipe($.environment.if.production($.uglify()))
        .pipe($.environment.if.production($.header(config.licenses.js)))
        .pipe(gulp.dest('build/js'));
});

gulp.task('css', function() {
    return $.rubySass('scss/**/*.scss', {
            loadPath: 'bower_components/foundation/scss',
            style: 'compact',
            compass: true
        })
        // .pipe($.plumber({
        //  errorHandler: onError
        // }))
        .pipe($.environment.if.production($.csso()))
        .pipe($.environment.if.production($.cssnano({
            autoprefixer: config.autoprefixer
        })))
        // .pipe($.concat('main.css'))
        .pipe($.environment.if.production($.header(config.licenses.css)))
        .pipe(gulp.dest('build/css'));
});

gulp.task('watch', ['default', 'browser-sync'], function() {
    gulp.watch(['scss/**/*.scss'], ['css', reload]);
    gulp.watch(['config.json'], ['js', reload]);
    gulp.watch(['jade/**/*.jade'], ['jade', reload]);
    gulp.watch(['js/**/*.js'], ['js', reload]);
    gulp.watch(['img/**/*'], ['images', reload]);
    gulp.watch(['./files/**/*', './files/**/.*', '!./files/**/.DS_Store'], ['default', reload]);
});