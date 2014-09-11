# Device Wall

## Installation

If you don't already have node.js 0.10.x or later, fetch it from
[nodejs.org](http://www.nodejs.org/). In addition we need a few dependencies
you may have.

    > npm install -g gulp

In addition, you will need [Ruby](https://www.ruby-lang.org/en/downloads/) to use
Compass framework for compiling SASS stylesheets into CSS and sprite sheets:

    > gem update --system
    > gem install sass
    > gem install compass

Note that you may need to first uninstall other SASS versions than (3.2.x).

Installing the project itself is easy. Both build system dependencies and app dependencies are
triggered by

    > npm install

It actually performs a release build, too (to verify that everything is ok).

## Configuration

config.json.template has to be copied to config.json and modified.

src/app/config.js.template has to be copied to src/app/config.js and modified.

gulp copies these by default if destination file doesn't exist.

## Building

The current build compiles JS and CSS monoliths for both the debug and release builds. The big
difference is that the debug build supports source maps and is not minified.

To first cleanup your distribution directory and trigger **release** build

    > gulp clean
    > gulp

To trigger **debug** build, run gulp with a debug flag

    > gulp --debug

To keep gulp running and watch for changes, use e.g.

    > gulp watch --debug

To update your package version, you eventually want to do one of the following:

    > gulp bump --patch
    > gulp bump --minor
    > gulp bump --major
    > gulp bump # defaults to minor

## Running the Service

Most likely the normal *gulp serve* task will not suffice, and you want to run your own test
server, instead. The task below, will default to 'gulp serve' by default until you change it:

    > npm start

### Live reloading the changes

Live reloading is enabled when running *gulp watch* in another window. Just change any of your
JavaScript or SASS files to trigger reload. The reload monitors 'dist' directory and pushes the
changes as needed.

## Testing

Run tests with PhantomJS:

    > gulp test

Or in debug mode with chromedriver in a browser:

    > gulp test --debug

## License

Copyright (c) 2014 [SC5](http://sc5.io/)
