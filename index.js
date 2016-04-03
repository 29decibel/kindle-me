'use strict';

var read = require('node-readability');
var fs = require('fs');
var Handlebars = require('handlebars');
var cheerio = require('cheerio');
var mime = require('mime');
var Promise = require('bluebird');
var request = require('request');
var crypto = require('crypto');
var _ = require('lodash');


var args = process.argv.slice(2);
var url = args[0];

if (!url) {
  throw "please provide url";
}

var source = fs.readFileSync('./template.html');
var template = Handlebars.compile(source.toString());

/**
 * @method downloadImage
 * @param {String} image uri
 * @param {String} optional output directory
 * @return {Promise} a promise which will resolve an uri map object: {local: xxx, original: xxx}
 */
function downloadImage(uri, outputDir){
  return new Promise(function(resolve, reject) {
    request.head(uri, function(err, res, body){
      var filename = crypto.createHash('md5').update(uri).digest("hex");
      var savedImageFile = filename + '.' + mime.extension(res.headers['content-type']);

      request(uri)
        .pipe(fs.createWriteStream(savedImageFile))
        .on('close', function(){
          resolve({original: uri, local: savedImageFile});
        });
    });
  });
};


/**
 * @method localizeImageSrc
 * @param {String} htmlString html string
 * @param {Array.<Object>} array of map object {local: xxx, original: xxx}
 */
function localizeImageSrc(htmlString, imageUrlFilePathMap) {
  var $ = cheerio.load(htmlString);
  $('img').each(function(){
    var img = $(this),
        src = img.attr('src');
    _.filter(imageUrlFilePathMap, function(obj) {
      return obj.original === src;
    }).forEach(function(obj) {
      // do it local
      img.attr('src', obj.local);
      // do it data uri
      const Datauri = require('datauri');
      let datauri = new Datauri(obj.local);
      img.attr('src', datauri.content);
    });
  });

  return $.html();
}

var sendEmail = require('./sendEmail');
var slug = require('slug')


read(url, function(err, article, meta) {
  var result = template(article);
  var title = article.title;
  // Close article to clean up jsdom and prevent leaks
  article.close();

  var $ = cheerio.load(result);
  var Url = require('url');

  // download all images into local
  var allImages = $('img').map(function(){
    var src = $(this).attr('src');
    console.log(src);
    if (src.indexOf('http') < 0) {
      src = Url.resolve(url, src);
    }
    return downloadImage(src);
  }).get();

  // transform the html into a localized image html string
  Promise.all(allImages).then(function(savedImagesMap){
    var localizedResult = localizeImageSrc(result, savedImagesMap);
    var filePath = slug(title) + '.html';
    fs.writeFileSync(filePath, localizedResult);
    /*
     *sendEmail(some@kindle.com, filePath);
     */
  });

});
