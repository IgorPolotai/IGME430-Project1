const http = require('http');
const query = require('querystring');

const responseHandler = require('./responses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
    '/': responseHandler.getIndex,
    '/style.css': responseHandler.getCSS,
    '/getCountry': responseHandler.getCountry, //Get #1 (search by country name)
    '/getCountries': responseHandler.getCountries, //Get #2, filtered by several filters
    '/getAllCountries': responseHandler.getAllCountries, //Get #3. Returns the whole JSON
    '/getRegion': responseHandler.getCountry, //Get #4 (search by region, return all countries from there)
    '/addCountry': responseHandler.addCountry, //Post #1 
    '/addReview': responseHandler.addReview, //Post #2
    '/updateCountry': responseHandler.updateCountry, //Post #3, bonus!
    notFound: responseHandler.notFound
}

// Takes all of the packets of data and builds out the body
const parseBody = (request, response, handler) => {
    const body = [];

    request.on('error', (err) => {
        console.dir(err);
        response.statusCode = 400;
        response.end();
    });

    request.on('data', (chunk) => {
        body.push(chunk);
    });

    request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();
        request.body = query.parse(bodyString);
        handler(request, response);
    });
};

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/addUser') {
        parseBody(request, response, responseHandler.addUser);
    }
};

// handle GET requests
const handleGet = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/') {
        responseHandler.getIndex(request, response);
    }
    else if (parsedUrl.pathname === '/style.css') {
        responseHandler.getCSS(request, response);
    } else if (parsedUrl.pathname === '/getUsers') {
        responseHandler.getUsers(request, response);
    } else if (parsedUrl.pathname === '/notReal') {
        responseHandler.notFound(request, response); 
    } else {
        responseHandler.notFound(request, response);
    }
};

// routes our requests to the correct endpoint
const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    if (urlStruct[parsedUrl.pathname]) {
        if (request.method === 'POST') {
            handlePost(request, response, parsedUrl);
        } else {
            handleGet(request, response, parsedUrl);
        }
    } else { // If the page does not exist
        urlStruct.notFound(request, response);
    }
}; 

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1: ${port}`);
});
