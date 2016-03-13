var read = require('node-readability');
var fs = require('fs');
var Handlebars = require('handlebars');
var cheerio = require('cheerio');


var args = process.argv.slice(2);
var url = args[0];

if (!url) {
  throw "please provide url";
}

var source = fs.readFileSync('./template.html');

var template = Handlebars.compile(source.toString());

var mime = require('mime');

var request = require('request');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename + '.' + mime.extension(res.headers['content-type'])));
    /*
     *.on('close', callback);
     */
  });
};


read(url, function(err, article, meta) {

  var result = template(article);

  var $ = cheerio.load(result);
  $('img').each(function(i){
    var src = $(this).attr('src');
    console.log(src);
    if (src.indexOf('http') ==0) {
      download(src, i, function(){ console.log('done'); });
    }
  });
  // Close article to clean up jsdom and prevent leaks
  article.close();
});
