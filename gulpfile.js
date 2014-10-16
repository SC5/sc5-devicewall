var path = require('path'),
    extend = require('extend'),
    util = require('util'),
    gulp = require('gulp'),
    shell = require('gulp-shell'),
    browsersync = require('browser-sync'),
    bowerFiles = require('main-bower-files'),
    $ = require('gulp-load-plugins')(),
    templateCache = require('gulp-angular-templatecache'),
    eventStream = require('event-stream'),
    package = require('./package.json'),
    fs = require('fs'),
    nodemon = require('gulp-nodemon');

var configLocalServer = './config/server';
var configLocalApp = './config/app';

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
  version: package.version,
  debug: Boolean($.util.env.debug),
  browsersync: Boolean($.util.env.browsersync),
  server: {
    host:         process.env.npm_package_config_server_host || "localhost",
    maxSockets:   parseInt(process.env.npm_package_config_server_maxSockets) || 100,
    socketPort:   parseInt(process.env.npm_package_config_server_socketPort) || 3000,
    controlPort:  parseInt(process.env.npm_package_config_server_controlPort) || 8888,
    clientPort:   parseInt(process.env.npm_package_config_server_clientPort) || 8080
  }
};

// Package management
/* Install & update Bower dependencies */
gulp.task('install', ['config'], function() {
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

// install will run this task _before_ bower install task
gulp.task('config', function() {
  // Server config
  var serverConfig = require('./config/server/config.json');
  serverConfig = extend(true, serverConfig, config.server);
  // read local config
  if (fs.existsSync(configLocalServer+'/config.local.json')) {
    serverConfig = extend(true, serverConfig, require(configLocalServer+'/config.local.json'))
  }
  serverConfig = extend(true, serverConfig, config.server);
  fs.writeFileSync('./config.json', JSON.stringify(serverConfig, null, 2));

  // Control panel app config
  var clientConfig = require('./config/app/config.json');
  clientConfig.appConfig.clientPort = serverConfig.clientPort;
  clientConfig.appConfig.socketServer = 'http://' + serverConfig.host + ':' + serverConfig.socketPort + '/devicewall';
  // read local config
  if (fs.existsSync(configLocalApp+'/config.local.json')) {
    clientConfig = extend(true, clientConfig, require(configLocalApp+'/config.local.json'))
  }
  // Write angular configuration
  return gulp.src('./config/app/config.json')
    .pipe($.ngConstant({
       name: 'configuration',
       constants: clientConfig
    }))
    .pipe(gulp.dest('./src/app'));
});

// Cleanup
gulp.task('clean', function() {
  gulp.src('dist', { read: false })
    .pipe($.clean());
});

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: config.server.controlPort
}));


gulp.task('preprocess', function() {
  gulp.src('src/app/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
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
    .pipe($.if(!config.debug, $.ngmin()))
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
    // Integrate (link, package, concatenate)
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

gulp.task('clean', function() {
  gulp.src(['dist', 'temp'], { read: false })
    .pipe($.clean());
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe($.inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe($.inject('src/favicon.ico', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

var dependencies = (config.browsersync) ? ['integrate', 'test', 'browsersync'] : ['integrate', 'livereload', 'develop'];

gulp.task('watch', dependencies, function() {

  // Watch the actual resources; Currently trigger a full rebuild

  gulp.watch([
    'src/css/**/*.scss',
    'src/app/**/*.js',
    'src/index.html',
    'tests/**/*.js'
  ], ['integrate']);

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

gulp.task('mywatch', ['integrate'], function() {
  nodemon({script: 'server.js', watch: 'dist/**/*'})
  .on('restart', function () {
    console.log('restarted!')
  });
  gulp.watch([
    'src/css/**/*.scss',
    'src/app/**/*.js',
    'src/assets/**/*',
    'src/index.html'
  ], ['integrate']);
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

gulp.task('default', ['integrate']);
