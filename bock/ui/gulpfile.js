var
  gulp = require('gulp'),
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
var SPATemplate = source + appName + '.pug';

var paths = {
  vendor: {
    styles: [
      source + 'styles/contrib/meyer.css',
      source + 'styles/contrib/code-highlight.css',
      source + 'styles/contrib/header-anchors.css',
      source + 'styles/contrib/ionicons.min.css',
      source + 'styles/contrib/critic.css',
      'bower_components/angular-loading-bar/build/loading-bar.min.css',
      'bower_components/diff2html/dist/diff2html.min.css'
    ],
    scripts: [
      'bower_components/highlightjs/highlight.pack.js',
      'bower_components/angular/angular.min.js',
      'bower_components/angular-animate/angular-animate.min.js',
      'bower_components/angular-modal-service/dst/angular-modal-service.min.js',
      'bower_components/angular-toastr/dist/angular-toastr.min.js',
      'bower_components/angular-ui-router/release/angular-ui-router.min.js',
      'bower_components/angular-loading-bar/build/loading-bar.min.js',
      'bower_components/angular-highlightjs/build/angular-highlightjs.min.js',
      'bower_components/moment/min/moment.min.js',
      'bower_components/diff2html/dist/diff2html.min.js'
    ]
  },
  app: {
      styles: [
        source + '**/' + appName + '.sass',
      ],
      scripts: [
        source + 'scripts/**/' + appName + '.module.js',
        source + 'scripts/**/*config.js',
        source + 'scripts/**/*run.js',
        source + 'scripts/**/*filters.js',
        source + 'scripts/**/*directives.js',
        source + 'scripts/**/*services.js',
        source + 'scripts/**/*controller*.js',
        source + 'scripts/**/*routes*.js'
      ],
      templates: [
        source + 'views/**/*.pug'
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
  '@version <%= pkg.version %>',
  '@built ' + date,
  '@link <%= pkg.homepage %>',
  '@author <%= pkg.author %>',
  '-->',
  ''
].join('\n');

// Images

gulp.task('images', [], function() {
  return gulp.src(paths.app.images)
             .pipe(gulp.dest(destination + '/images'));
});

// Fonts

gulp.task('fonts', [], function() {
  return gulp.src(paths.app.fonts)
             .pipe($.flatten())
             .pipe(gulp.dest(destination + '/fonts'));
});

// Scripts

function convertTemplateStream() {
  return gulp.src(paths.app.templates)
             .pipe($.debug())
             .pipe($.pug());
}

function prepareTemplatesForCaching() {
  return convertTemplateStream().pipe($.angularTemplatecache({module: appName}));
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

// Styles

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
             .pipe($.recess({
                noIDs: false,
                strictPropertyOrder: false,
                noOverqualifying: false,
                noUnderscores: false,
                noUniversalSelectors: false
              })) // Because it's 2AM and I don't care.
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

// Templates

/*  This is unused. Idea was to make a folder full of HTML files
    so that I could eliminate unused CSS with uncss or purifycss.
    Had issues with both, but keeping this here to mess with it
    in the future.
*/
gulp.task('build:spa:cache_templates', [], function() {
  return convertTemplateStream().pipe(gulp.dest(destination + '/template_cache'));
});

gulp.task('build:spa', ['build:scripts:app'], function() {
  return gulp.src(SPATemplate)
             .pipe($.debug())
             .pipe($.pug())
             .pipe($.rename('index.html'))
             .pipe($.header(banner, {pkg: pkg}))
             .pipe(gulp.dest(destination))
             .pipe(browserSync.stream());
});

// Other tasks

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
  gulp.watch(source + '**/*.css', ['build:styles']);
  gulp.watch(paths.app.scripts, ['build:scripts']);
  gulp.watch(paths.app.templates, ['build:scripts']);
  gulp.watch(SPATemplate, ['build:spa']);
});

// Main task

gulp.task('default', [], function() {
  return runSequence(['clean', 'fonts', 'build:styles', 'build:scripts', 'build:spa']);
});
