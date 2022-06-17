const fs = require('fs-extra');

console.log('patching node_modules dependencies ...');
fs.copy('./patches/', './node_modules/', function (err) {
  if (err) {
    console.log('patch node_modules dependencies failed: ', err);
  }
});
