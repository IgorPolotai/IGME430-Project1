const fs = require('fs'); // pull in the file system module

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const data = JSON.parse(fs.readFileSync(`${__dirname}/../data/countries.json`));

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
    console.log(content);
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8')
    });

    if (request.method !== 'HEAD' && status !== 204) {
        response.write(content);
    }

    response.end();
};

const getCountry = (request, response) => {
    const name = (request.query.name).toLowerCase();
    const filtered = data.find((country) => country.name.toLowerCase() === name);
    
    if (filtered) { respondJSON(request, response, 200, filtered); } 
    else { respondJSON(request, response, 404, { message: "Country not found" }); }
};

const getCountries = (request, response) => {

};

// return JSON of all countries data
const getAllCountries = (request, response) => {
    const responseJSON = {
        data,
    };

    respondJSON(request, response, 200, responseJSON);
};

const getRegion = (request, response) => {

    if ((!request.query.subregion && !request.query.region)
        || (request.query.subregion && request.query.region)) {
        return respondJSON(request, response, 404, { message: "Either a region or a subregion is allowed. Neither or both is forbidden.", id: "invalidParams" });
    }

    let filtered = {};

    if(request.query.region) {
        const region = (request.query.region).toLowerCase();
        filtered = data.filter((country) => country.region.toLowerCase() === region);
    }
    else if (request.query.subregion) {
        const subregion = (request.query.subregion).toLowerCase();
        filtered = data.filter((country) => country.subregion.toLowerCase() === subregion);
    }
    
    if (filtered) { return respondJSON(request, response, 200, filtered); } 
    else { return respondJSON(request, response, 404, { message: "Country not found" }); }
};

// uses a POST to update or add a country
const addCountry = (request, response) => {
    // default json message
    const responseJSON = {
        message: 'All parameters are required.',
    };

    const { name, 
            capital, 
            currency, 
            currency_name, 
            currency_symbol,
            region,
            subregion,
            nationality,
            zoneName,
            gmtOffset,
            gmtOffsetName,
            abbreviation,
            tzName,
            latitude,
            longitude } = request.body;

    if (!name || !capital || !currency ||
        !currency_name || !currency_symbol ||
        !region || !subregion || 
        !nationality || !zoneName ||
        !gmtOffset || !gmtOffsetName || !abbreviation
        || !tzName || !latitude || !longitude
    ) {
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
    }

    let responseCode = 204;

    // If the country doesn't exist yet
    if (!data[name]) {
        responseCode = 201;
        data[name] = {
            name,
            capital,
            finance: {
                currency,
                currency_name,
                currency_symbol
            },
            region,
            subregion,
            nationality,
            timezones: {
                zoneName,
                gmtOffset,
                gmtOffsetName,
                abbreviation,
                tzName
            },
            latitude,
            longitude,
        }
    }

    data[name].capital = capital;
    data[name].finance.currency = currency;
    data[name].finance.currency_name = currency_name;
    data[name].finance.currency_symbol = currency_symbol;
    data[name].region = region;
    data[name].subregion = subregion;
    data[name].nationality = nationality;
    data[name].timezones.zoneName = zoneName;
    data[name].timezones.gmtOffset = gmtOffset;
    data[name].timezones.gmtOffsetName = gmtOffsetName;
    data[name].timezones.abbreviation = abbreviation;
    data[name].timezones.tzName = tzName;
    data[name].latitude = latitude;
    data[name].longitude = longitude;

    if (responseCode === 201) {
        responseJSON.message = 'Created Successfully';
        return respondJSON(request, response, responseCode, responseJSON);
    }

    return respondJSON(request, response, responseCode, {});
};

const addReview = (request, response) => {

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
    notFound
};
