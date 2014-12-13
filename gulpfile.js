'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    config = require('./config.json'),
    runSequence = require('run-sequence');

// gulp --type prod

var watch = false;
var copytext = config.copyright;

var onError = function(err) {
    $.util.beep();
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

var patterns = [{
    pattern: /\.css/g,
    replacement: '\.css?' + getStamp()
}, {
    pattern: /\.js/g,
    replacement: '\.js?' + getStamp()
}, {
    pattern: /\.jpg/g,
    replacement: '\.jpg?' + getStamp()
}, {
    pattern: /\.ico/g,
    replacement: '\.ico?' + getStamp()
}, {
    pattern: /\.svg/g,
    replacement: '\.svg?' + getStamp()
}, {
    pattern: /\.png/g,
    replacement: '\.png?' + getStamp()
}, ];

gulp.task('browser-sync', function() {
    browserSync.init(null, {
        server: {
            baseDir: './build'
        }
    });
});

gulp.task('proxy', function() {
    gulp.src('/')
        .pipe($.run('./srvdir ' + config.glob.proxy + ':./build'));
});

gulp.task('clean-url', function(){
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
    gulp.src('build/**/*.html', {
            read: false
        })
        .pipe($.sitemap({
            siteUrl: config.glob.site
        }))
        .pipe(gulp.dest('build/'));
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
        .pipe(gulp.dest('build'))
        .pipe($.if(watch, reload({
            stream: true
        })));
});

gulp.task('jade-pre', function() {
    var filterUsemin = $.filter('**/*.+(js|css)');
    return gulp.src(['jade/_includes/_*.jade'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.jade({
            pretty: true,
        }))
        .pipe($.usemin({
            assetsDir: './',
            html: [$.if($.util.env.type === 'prod', $.htmlmin({
                collapseWhitespace: true,
                keepClosingSlash: true
            }))],
            css: [
                //($.if(env === 'production', $.uncss(config.uncss))),
                $.autoprefixer(config.autoprefixer),
                $.if($.util.env.type === 'prod', $.csso(), $.cssshrink())
            ],
            js: [
                $.if($.util.env.type === 'prod', $.uglify()),
                $.header(copytext)
            ]
        }))
        .pipe(filterUsemin)
        .pipe(gulp.dest('build'))
        .pipe(filterUsemin.restore())
        .pipe($.filter('**/*.+(html)'))
        .pipe(gulp.dest('jade/_includes/_html'));
});
gulp.task('jade-post', function() {
    return gulp.src(['jade/**/*.jade', '!jade/**/_*'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.jade({
            pretty: true,
            basedir: './jade'
        }))
        .pipe($.usemin({
            assetsDir: './',
            html: [$.if($.util.env.type === 'prod', $.htmlmin({
                collapseWhitespace: true,
                keepClosingSlash: true
            }))],
            css: [
                // ($.if(env === 'production', $.uncss(config.uncss))),
                $.autoprefixer(config.autoprefixer),
                $.if($.util.env.type === 'prod', $.csso(), $.cssshrink())
            ],
            js: [
                $.if($.util.env.type === 'prod', $.uglify()),
                $.header(copytext)
            ]
        }))
        .pipe(gulp.dest('build'))
        .pipe($.if(watch, reload({
            stream: true
        })));
});

gulp.task('sass', function() {
    return gulp.src('scss/**/*.scss')
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.rubySass({
            loadPath: 'bower_components/foundation/scss',
            style: 'compact',
            compass: true
        }))
        .pipe(gulp.dest('.tmp/css'));
});

gulp.task('images', function() {
    return gulp.src(['images/**/*', '!images/base64/**/*', '!images/base64'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('build/images'))
        .pipe($.filter('**/*.+(jpg|jpeg|png)'))
        .pipe($.webp())
        .pipe(gulp.dest('build/images'))
        .pipe($.if(watch, reload({
            stream: true
        })));
});
gulp.task('images-gen', function() {
    return gulp.src(['images/**/*'])
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest('images'));
});

gulp.task('cachebust', function() {
    return gulp.src('./build/**/*.+(html|css)')
        .pipe($.frep(patterns))
        .pipe(gulp.dest('build'))
});

gulp.task('jade', function(callback) {
    runSequence('jade-pre',
        'jade-post', ['sitemap', 'cachebust'],
        callback);
});

gulp.task('css', function(callback) {
    runSequence('sass',
        'jade',
        callback);
});

gulp.task('default', function(callback) {
    runSequence('clean', ['sass', 'images', 'files'],
        'jade',
        callback);
});

gulp.task('watch', ['default', 'browser-sync'], function() {
    gulp.watch(['scss/**/*.scss'], ['css']);
    gulp.watch(['jade/**/*.jade'], ['jade']);
    gulp.watch(['js/**/*.js'], ['jade']);
    gulp.watch(['images/**/*'], ['images']);
    watch = true;
});
