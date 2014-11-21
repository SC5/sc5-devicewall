"use strict";
var path = require('path'),
    extend = require('extend'),
    util = require('util'),
    gulp = require('gulp'),
    browsersync = require('browser-sync'),
    bowerFiles = require('main-bower-files'),
    $ = require('gulp-load-plugins')(),
    templateCache = require('gulp-angular-templatecache'),
    eventStream = require('event-stream'),
    packagejson = require('./package.json'),
    fs = require('fs'),
    scssLint = require('gulp-scss-lint'),
    server = require('gulp-develop-server'),
    find = require('find'),
    del = require('del');

var configLocalServer = './config/server';
var configLocalApp = './config/app';

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
  version: packagejson.version,
  debug: Boolean($.util.env.debug),
  browsersync: Boolean($.util.env.browsersync),
  server: {
    host:         process.env.npm_package_config_server_host || "localhost",
    maxSockets:   parseInt(process.env.npm_package_config_server_maxSockets) || 100,
    port:         parseInt(process.env.npm_package_config_server_port) || 8080
  }
};

// Package management
/* Install & update Bower dependencies */
gulp.task('install', ['config', 'bower'], function() {
  // Downloads the Selenium webdriver
  $.protractor.webdriver_update(function() {});
  gulp.start('integrate');
});

/* Bump version number for packagejson.json & bower.json */
// TODO Provide means for appending a patch id based on git commit id or md5 hash
gulp.task('bump', function() {
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = $.util.env,
      type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
});

// install will run this task _before_ bower install task
gulp.task('config', function() {
  var data; // just a tmp variable

  // Server config
  var serverConfig = JSON.parse(fs.readFileSync(configLocalServer+'/config.json'));
  serverConfig = extend(true, serverConfig, config.server);
  // read local config
  if (fs.existsSync(configLocalServer+'/config.local.json')) {
    data = JSON.parse(fs.readFileSync(configLocalServer+'/config.local.json'));
    serverConfig = extend(true, serverConfig, data);
  }
  fs.writeFileSync('./config.json', JSON.stringify(serverConfig, null, 2));

  // Server test config
  var serverTestConfig = JSON.parse(fs.readFileSync(configLocalServer + '/config.test.json'));
  // read local config
  if (fs.existsSync(configLocalServer + '/config.test.local.json')) {
    data = JSON.parse(fs.readFileSync(configLocalServer + '/config.test.local.json'));
    serverTestConfig = extend(true, serverTestConfig, data);
  }
  fs.writeFileSync('./config.test.json', JSON.stringify(serverTestConfig, null, 2));

  // Control panel app config
  var clientConfig = JSON.parse(fs.readFileSync(configLocalApp + '/config.json'));
  clientConfig.appConfig.socketServer = 'http://' + serverConfig.host + ':' + serverConfig.port + '/devicewall';
  // read local config
  if (fs.existsSync(configLocalApp+'/config.local.json')) {
    data = JSON.parse(fs.readFileSync(configLocalApp+'/config.local.json'));
    clientConfig = extend(true, clientConfig, data);
  }
  // Write angular configuration
  return gulp.src(configLocalApp + '/config.json')
    .pipe($.ngConstant({
       name: 'configuration',
       constants: clientConfig
    }))
    .pipe(gulp.dest('./src/app'));
});

// Cleanup
gulp.task('clean', function(cb) {
  del(['dist/**', 'temp/**'], cb);
});

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: config.server.controlPort
}));


gulp.task('preprocess', ['config'/*, 'scss-lint'*/], function() {
  gulp.src(['src/app/**/*.js', 'server*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('scss-lint', function() {
  var lintTask = gulp.src('src/css/**/*.scss')
    .pipe(scssLint());
  // without --force flag scss-lint fails the task
  if (!$.util.env.force) {
    lintTask.pipe(scssLint.failReporter());
  }
});

gulp.task('javascript', ['preprocess'], function() {

  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version);

  // Note: two pipes get combined together by first
  // combining components into one bundle, then adding
  // app sources, and reordering the items. Note that
  // we expect Angular to be the first item in bower.json
  // so that component concatenation works
  var components = gulp.src(['src/components/socket.io-client/socket.io.js'].concat(bowerFiles()))
    // Socket.io does not specify main file in the manifest; add it manually
    .pipe($.filter('**/*.js', '!jquery*', '!foundation*'))
    .pipe($.plumber())
    .pipe($.concat('components.js'));

  var templates = gulp.src('src/assets/**/*.html')
    .pipe(templateCache('templates.js', { standalone: true, root: 'assets' }));

  var app = gulp.src('src/app/**/*.js')
    .pipe($.concat('app.js'));

  return eventStream.merge(components, app, templates)
    .pipe($.order([
      '**/components.js',
      '**/templates.js',
      '**/app.js'
    ]))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.ngAnnotate()))
    .pipe($.if(!config.debug, $.uglify()))
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
    // Integrate (link, packagejson, concatenate)
    .pipe($.concat(bundleName))
    // Integrate
    .pipe(gulp.dest('dist/css'));
    // Integration test
    // oh why css lint for css generated by sass? .pipe($.csslint())
    //.pipe($.csslint.reporter());
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('favicon', function() {
  return gulp.src(['src/favicon.ico'])
    .pipe(gulp.dest('dist'));
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets', 'favicon'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe($.inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('livereload', function() {

  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.src('dist/**', { read: false })
    .pipe($.watch())
    .pipe($.livereload(parseInt(process.env.LIVERELOAD_PORT) || 35729));

});

/* Watch, live reload and serve the web site with browsersync */
gulp.task('browsersync', function() {

  var bs = browsersync.init('dist/*', {
    server: {
      baseDir: 'dist'
    }
  });

});

gulp.task('watch', ['build'], function() {
  $.nodemon({script: 'server/server.js', watch: 'server/**/*.js'})
  .on('restart', function () {
    console.log('express restarted!');
  });
  return gulp.watch([
    'server/**/*.js',
    'config/**/*.json',
    'src/css/**/*.scss',
    'src/app/**/*.js',
    'src/assets/**/*',
    'src/index.html',
    '!src/app/config.js', // do not listen files which are modified during build process
  ], ['build']);
});

// Tests
gulp.task('webdriver_manager_update', $.protractor.webdriver_update);

gulp.task('test:server', function(cb) {
  gulp.src(['server/**/*.js', '!server/test/**/*'])
    .pipe($.istanbul()) // Covering files
    .on('finish', function () {
      gulp.src('server/test/**/*.spec.js')
        .pipe($.jasmine())
        .pipe($.istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});

gulp.task('test:e2e', ['webdriver_manager_update'], function() {
  var testConfig = require('./config.test.json');
  var testDataDir = path.dirname(path.resolve(testConfig.devicesJson));
  var paths = find.fileSync(/selenium-server-standalone.*\.jar/, 'node_modules/protractor/selenium');
  var args = ['--seleniumServerJar', paths[0], '--baseUrl', 'http://' + testConfig.host + ':' + testConfig.port];
  var protractorConf = {
    configFile: './protractor.config.js',
    args: [args],
    debug: Boolean($.util.env.debug)
  };

  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir);
  }

  server.listen({path: './server/server.js', env: {"NODE_ENV": "test"}});
  gulp.src(['tests/e2e/**/*.js'], { read: false })
    .pipe($.protractor.protractor(protractorConf)).on('error', function(e) {
      server.kill();
    }).on('end', function() {
      server.kill();
    });
});


gulp.task('test:e2e:ci', function() {
  var testConfig = require('./config.test.json');
  var testDataDir = path.dirname(path.resolve(testConfig.devicesJson));
  var args = [
    '--baseUrl',
    'http://' + testConfig.host + ':' + testConfig.port
  ];
  var protractorConf = {
    configFile: './protractor.ci.config.js',
    args: [args]
  };

  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir);
  }

  server.listen({path: './server/server.js', env: {"NODE_ENV": "test"}});
  gulp.src(['tests/e2e/**/*.js'], { read: false })
    .pipe($.protractor.protractor(protractorConf)).on('error', function() {
      server.kill();
      throw new Error('Selenium e2e tests failed.');
    }).on('end', function() {
      server.kill();
    });
});






gulp.task('default', ['integrate']);
gulp.task('build', ['clean'], function() {
  gulp.start('integrate');
});
gulp.task('bower', function() {
  return $.bower();
});


