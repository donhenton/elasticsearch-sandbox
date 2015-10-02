// protractor.conf.js

exports.config = {
  specs: ['test/e2e/*_test.js'],
  baseUrl: 'http://localhost:9001',

  // your filenames and paths may differ
  // seleniumAddress: 'http://localhost:4444/wd/hub',
  seleniumServerJar: 'node_modules/protractor/selenium/selenium-server-standalone-2.45.0.jar',
  chromeDriver: 'node_modules/protractor/selenium/chromedriver'
}