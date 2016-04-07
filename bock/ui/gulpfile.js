// npm install \
// add-stream \
// browser-sync \
// del \
// jshint \
// jshint-stylish \
// gulp \
// gulp-autoprefixer \
// gulp-concat \
// gulp-concat \
// gulp-flatten \
// gulp-cssmin \
// gulp-debug \
// gulp-jade \
// gulp-filter \
// gulp-rimraf \
// gulp-jshint \
// gulp-load-plugins \
// gulp-ng-annotate \
// gulp-recess \
// gulp-rename \
// gulp-sass \
// gulp-uglify \
// gulp-webserver \
// --save-dev

var gulp = require('gulp'),
    browserSync = require('browser-sync').create()
    addStream = require('add-stream'),
    runSequence = require('run-sequence'),
    $ = require('gulp-load-plugins')({pattern: ['gulp-*', 'gulp.*'], camelize: true}),
    del = require('del')
    ;

var development_host = '127.0.0.1';
var development_port = 5000;
var appName = 'Bock';
var source = 'src/';
var destination = 'cached_dist/';
var SPATemplate = source + appName + '.jade';

var paths = {
    vendor: {
        styles: [
            source + 'styles/contrib/meyer.css',
            source + 'styles/contrib/code-highlight.css',
            source + 'styles/contrib/ionicons.min.css',
            'bower_components/angular-loading-bar/build/loading-bar.min.css',
            'bower_components/diff2html/dist/diff2html.min.css'
        ],
        scripts: [
            'bower_components/angular/angular.min.js',
            'bower_components/angular-animate/angular-animate.min.js',
            'bower_components/angular-modal-service/dst/angular-modal-service.min.js',
            'bower_components/angular-toastr/dist/angular-toastr.min.js',
            'bower_components/angular-ui-router/release/angular-ui-router.min.js',
            'bower_components/angular-loading-bar/build/loading-bar.min.js',
            'bower_components/moment/min/moment.min.js',
            'bower_components/diff2html/dist/diff2html.min.js'
        ]
    },
    app: {
        styles: [
            source + '**/' + appName + '.sass',
        ],
        scripts: [
            source + '**/' + appName + '.module.js',
            source + '**/*config.js',
            source + '**/*run.js',
            source + '**/*filters.js',
            source + '**/*directives.js',
            source + '**/*services.js',
            source + '**/*controller*.js',
            source + '**/*routes*.js'
        ],
        templates: [
            source + 'views/**/*.jade'
        ],
        fonts: [
            source + 'fonts/**'
        ]
    }
}

var date = new Date();
var pkg = require('./package.json');
var banner = [
    '<!--',
    'Well aren\'t _you_ a curious little kitten?',
    '',
    '<%= pkg.name %> - <%= pkg.description %>',
    '@version v<%= pkg.version %>',
    '@built ' + date,
    '@link <%= pkg.homepage %>',
    '@author <%= pkg.author %>',
    '-->',
    ''].join('\n');

// ------ Images ------

gulp.task('images', [], function() {
    return gulp.src(paths.app.images)
               .pipe(gulp.dest(destination + '/images'));
});

// ------ Fonts ------

gulp.task('fonts', [], function() {
    return gulp.src(paths.app.fonts)
               .pipe($.flatten())
               .pipe(gulp.dest(destination + '/fonts'));
});

// ------ Scripts ------    

function prepareTemplatesForCaching() {

    return gulp.src(paths.app.templates)
               .pipe($.debug())
               .pipe($.jade())
               .pipe($.angularTemplatecache({module: appName}));
}

gulp.task('build:scripts:vendor', [], function() {
    return gulp.src(paths.vendor.scripts)
               .pipe($.debug())
               .pipe($.uglify())
               .pipe($.concat('vendor.js'))
               .pipe(gulp.dest(destination));
});

gulp.task('build:scripts:app', [], function() {
    return gulp.src(paths.app.scripts)
               .pipe($.debug())
               .pipe($.jshint())
               .pipe($.jshint.reporter('jshint-stylish'))
               .pipe($.ngAnnotate({single_quotes: true}))
               .pipe($.uglify())
               .pipe(addStream.obj(prepareTemplatesForCaching()))
               .pipe($.concat('app.js'))
               .pipe(gulp.dest(destination))
               .pipe(browserSync.reload({stream:true}));
});

gulp.task('build:scripts', ['build:scripts:vendor', 'build:scripts:app'], function() {
    var jsPaths = [destination + '/vendor.js', destination + '/app.js'];

    return gulp.src(jsPaths)
               .pipe($.debug())
               .pipe($.rimraf(jsPaths))
               .pipe($.concat(appName + '.js'))
               .pipe(gulp.dest(destination))
               .pipe(browserSync.stream());
});

// ------ Styles ------

gulp.task('build:styles:vendor', [], function() {
    return gulp.src(paths.vendor.styles)
               .pipe($.debug())
               .pipe($.cssmin())
               .pipe($.concat('vendor.css'))
               .pipe(gulp.dest(destination));
});

gulp.task('build:styles:app', [], function() {
    var sassFilter = $.filter('**/*.sass', {restore: true});
    var cssFilter = $.filter('**/*.css', {restore: true});

    return gulp.src(paths.app.styles)
               .pipe($.debug())
               .pipe(sassFilter)
               .pipe($.sass())
               .pipe(sassFilter.restore)
               .pipe($.rename('app.css'))
               .pipe($.recess({noIDs: false, strictPropertyOrder: false, noOverqualifying: false, noUnderscores: false, noUniversalSelectors: false})) // Because it's 2AM and I don't care.
               .pipe($.recess.reporter())
               .pipe($.autoprefixer())
               .pipe($.cssmin())
               .pipe(gulp.dest(destination))
               .pipe(browserSync.stream());
});

gulp.task('build:styles', ['build:styles:vendor', 'build:styles:app'], function() {
    var cssPaths = [destination + '/vendor.css', destination + '/app.css'];

    return gulp.src(cssPaths)
               .pipe($.debug())
               .pipe($.rimraf(cssPaths))
               .pipe($.concat(appName + '.css'))
               .pipe(gulp.dest(destination))
               .pipe(browserSync.stream());
});

// ------ Templates ------


gulp.task('build:spa', ['build:scripts:app'], function() {
    return gulp.src(SPATemplate)
               .pipe($.debug())
               .pipe($.jade())
               .pipe($.rename('index.html'))
               .pipe($.header(banner, {pkg: pkg}))
               .pipe(gulp.dest(destination))
               .pipe(browserSync.stream());
});

// ------ Other tasks ------

gulp.task('clean', [], function() {
    del(destination);
});

gulp.task('serve', [], function() {
    browserSync.init({
        proxy: "localhost:8000",
        open: false,
        notify: false
    });

    gulp.watch(source + '**/*.sass', ['build:styles']);
    gulp.watch(paths.app.scripts, ['build:scripts']);
    gulp.watch(paths.app.templates, ['build:scripts']);
    gulp.watch(SPATemplate, ['build:spa']);
});

// ------ Main task ------

gulp.task('default', [], function() {
    runSequence(['clean', 'fonts', 'build:styles', 'build:scripts', 'build:spa']);
});
