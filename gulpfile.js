var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    browsersync = require('browser-sync'),
    $ = require('gulp-load-plugins')(),
    package = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
  version: package.version,
  debug: Boolean($.util.env.debug),
  browsersync: Boolean($.util.env.browsersync),
  appwallurl: 'http://appwall.sc5.io/',
};

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  $.bower();
  // Downloads the Selenium webdriver
  $.protractor.webdriver_update(function() {});
});

/* Bump version number for package.json & bower.json */
// TODO Provide means for appending a patch id based on git commit id or md5 hash
gulp.task('bump', function() {
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = $.util.env,
      type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
});

// Cleanup
gulp.task('clean', function() {
  gulp.src('dist', { read: false })
    .pipe($.clean());
});

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: 8080
}));

gulp.task('preprocess', function() {
  gulp.src('src/app/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('javascript', ['preprocess'], function() {

  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version),
      componentsPath = 'src/components',
      browserifyConfig = {
        debug: config.debug,
        shim: {
          jquery: {
            path: path.join(componentsPath, 'jquery/dist/jquery.js'),
            exports: 'jQuery'
          },
          moment: {
            path: path.join(componentsPath, 'moment/moment.js'),
            exports: 'moment'
          }
        }
      };

  return gulp.src('src/app/main.js', { read: false })
    // Compile
    // Unit test
    // Integrate (link, package, concatenate)
    .pipe($.plumber())
    .pipe($.browserify(browserifyConfig))
    .pipe($.concat(bundleName))
    .pipe($.if(config.debug, $.uglify()))
    // Integration test
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);
  
  return gulp.src('src/css/styles.scss')
    .pipe($.plumber())
    // Compile
    .pipe($.compass({
        project: path.join(__dirname, 'src'),
        sass: 'css',
        css: '../temp/css'
    }))
    // Unit test
    // Integrate (link, package, concatenate)
    .pipe($.concat(bundleName))
    // Integrate
    .pipe(gulp.dest('dist/css'))
    // Integration test
    .pipe($.csslint())
    .pipe($.csslint.reporter());
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('clean', function() {
  gulp.src(['dist', 'temp'], { read: false })
    .pipe($.clean());
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe($.inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

var dependencies = (config.browsersync) ? ['integrate', 'test', 'browsersync'] : ['integrate', 'test', 'serve', 'livereload'];

gulp.task('watch', dependencies, function() {
  
  // Watch the actual resources; Currently trigger a full rebuild
  gulp.watch([
    'src/css/**/*.scss', 
    'src/app/**/*.js', 
    'src/app/**/*.hbs', 
    'src/*.html',
    'tests/**/*.js'
  ], ['integrate', 'test']);

});
  
gulp.task('livereload', function() {

  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.src('dist/**', { read: false })
    .pipe($.watch())
    .pipe($.livereload());

});

/* Watch, live reload and serve the web site with browsersync */
gulp.task('browsersync', function() {

    var bs = browsersync.init('dist/*', {
      server: {
        baseDir: 'dist'
      }
    });

  bs.events.on('init', function(api) {

      var request = require('request');

      request(
        config.appwallurl + 'add',
        { method: 'POST', form: { address: api.options.url + '/' } },
        function(error, response, body) {
          console.log(body);
        }
      );

  });

});

gulp.task('webdriver', function(cb) {

  if (config.debug) {
    cb();
  } else {

    var phantom = require('phantomjs-server'),
        webdriver = require('selenium-webdriver');
 
    // Start PhantomJS
    phantom.start().done(function() {
      var driver = new webdriver.Builder()
        .usingServer(phantom.address())
        .build();
      cb();
    });

  }

});

gulp.task('test', ['webdriver'], function() {

  if (config.debug) {
    // Find the selenium server standalone jar file. Version number in the file name
    // is due to change
    var find = require('find'),
        paths = find.fileSync(/selenium-server-standalone.*\.jar/, 'node_modules/protractor/selenium'),
        args = ['--seleniumServerJar', paths[0]];
  } else {
    var args = ['--seleniumAddress', 'http://localhost:4444/'];
  }

  // Set baseUrl 
  args = args.concat(['--baseUrl', 'http://localhost:' + ((config.browsersync) ? 3002 : 8080) + '/']);

  // Run tests
  gulp.src('tests/**/*.js')
    .pipe($.protractor.protractor({
      configFile: 'protractor.config.js',
      args: args
    }))    
    .on('error', function(e) { throw e; });

});

gulp.task('default', ['integrate', 'test']);
