/* You should implement your request handler function in this file.
 * And hey! This is already getting passed to http.createServer()
 * in basic-server.js. But it won't work as is.
 * You'll have to figure out a way to export this function from
 * this file and include it in basic-server.js so that it actually works.
 * *Hint* Check out the node module documentation at http://nodejs.org/api/modules.html. */

var jankyDatabase = [];
var fs = require('fs');
var page;
fs.readFile('./server/log', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  jankyDatabase = JSON.parse(data);
});

fs.readFile('./server/grandFile', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  page = data;
});

var handleRequest = function(request, response) {
  var statusCode = 200;
  var bodyData = '';
  if (request.url.slice(0,8) !== '/classes'){
    statusCode = 404;
    bodyData = '';
  }
  /* the 'request' argument comes from nodes http module. It includes info about the
  request - such as what URL the browser is requesting. */

  /* Documentation for both request and response can be found at
   * http://nodemanual.org/0.8.14/nodejs_ref_guide/http.html */
  console.log("Serving request type " + request.method + " for url " + request.url);
  if (request.method === "GET"){
    if (request.url.slice(0,19) === '/classes/chatterbox'){
      if(jankyDatabase.length < 100 && statusCode !== 404){
        bodyData = JSON.stringify(jankyDatabase);
      }
      else{
        bodyData = JSON.stringify(jankyDatabase).slice(jankyDatabase.length-100);
      }
    }else {
      var room = request.url.slice(9);
      for (var i = 0 ; i < jankyDatabase.length ; i++){
        if (jankyDatabase[i].room === room){
          bodyData.push(jankyDatabase[i]);
        }
      }
      bodyData = JSON.stringify(bodyData);
    }
  }if (request.method === "POST" && statusCode !== 404){
    statusCode = 201;
    request.on('data', function(chunk) {
      bodyData += chunk.toString();
    });

  }

  if (request.url === '/' || request.url.slice(0,8) === '/?userna') {
    statusCode = 200;
    bodyData = page;
    //response.end(page);
  }

  request.on('end', function(){
    console.log('inside request.on');
    if (request.method === "POST"){
      var message = JSON.parse(bodyData);
      message.createdAt = new Date();
      jankyDatabase.push(message);
      fs.writeFile("./server/log", JSON.stringify(jankyDatabase), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
      });
    }
    /* Without this line, this server wouldn't work. See the note
     * below about CORS. */
    var headers = defaultCorsHeaders;

    headers['Content-Type'] = "text/plain";
    if (request.url === '/' || request.url.slice(0,8) === '/?userna') {
      headers['Content-Type'] = 'text/html';
    }

    /* .writeHead() tells our server what HTTP status code to send back */
    response.writeHead(statusCode, headers);

    /* Make sure to always call response.end() - Node will not send
     * anything back to the client until you do. The string you pass to
     * response.end() will be the body of the response - i.e. what shows
     * up in the browser.*/
    response.end(bodyData);
  });

};

/* These headers will allow Cross-Origin Resource Sharing (CORS).
 * This CRUCIAL code allows this server to talk to websites that
 * are on different domains. (Your chat client is running from a url
 * like file://your/chat/client/index.html, which is considered a
 * different domain.) */
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};
exports.handleRequest = handleRequest;