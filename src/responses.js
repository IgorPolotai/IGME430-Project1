const fs = require('fs'); // pull in the file system module

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const users = JSON.parse(fs.readFileSync);

//Gets the index html
const getIndex = (request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(index);
    response.end();
};

//Gets the CSS file
const getCSS = (request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.write(css);
    response.end();
};

//Sends back a JSON response
const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8')
    });

    if (request.method !== 'HEAD' && status !== 204) {
        response.write(content);
    }

    response.end();
};

// return JSON of user data
const getUsers = (request, response) => {
    const responseJSON = {
        users,
    };

    respondJSON(request, response, 200, responseJSON);
};

// uses a POST to update or add a user
const addUser = (request, response) => {
    // default json message
    const responseJSON = {
        message: 'Name and age are both required.',
    };

    const { name, age } = request.body;

    if (!name || !age) {
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
    }

    let responseCode = 204;

    // If the user doesn't exist yet
    if (!users[name]) {
        responseCode = 201;
        users[name] = {
            name,
        };
    }

    users[name].age = age;

    if (responseCode === 201) {
        responseJSON.message = 'Created Successfully';
        return respondJSON(request, response, responseCode, responseJSON);
    }

    return respondJSON(request, response, responseCode, {});
};

//Gets a not found error response
const notFound = (request, response) => respondJSON(request, response, 404,
    { message: "The page you are looking for was not found", id: "notFound" });

module.exports = {
    getIndex,
    getCSS,
    getCountry,
    getCountries,
    getAllCountries,
    getRegion,
    addCountry,
    addReview,
    updateCountry,
    notFound
};
