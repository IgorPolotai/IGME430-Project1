const fs = require('fs'); // pull in the file system module

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const doc = fs.readFileSync(`${__dirname}/../client/doc.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const data = JSON.parse(fs.readFileSync(`${__dirname}/../data/countries.json`));

const favorites = [];

// Gets the index html
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

// Gets the doc html
const getDocumentation = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(doc);
  response.end();
};

// Gets the CSS file
const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

// Sends back a JSON response
const respondJSON = (request, response, status, object) => {
  const content = JSON.stringify(object);
  // console.log(content);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });

  if (request.method !== 'HEAD' && status !== 204) {
    response.write(content);
  }

  response.end();
};

const getCountry = (request, response) => {
  const name = (request.query.name).toLowerCase();
  const filtered = data.find((country) => country.name.toLowerCase() === name);

  if (filtered) { respondJSON(request, response, 200, filtered); } else { respondJSON(request, response, 404, { message: 'Country not found' }); }
};

// Returns all of the countries within the latitude and longitude ranges
const getCountries = (request, response) => {
  // Check for the existence of required parameters
  if (!request.query.latmin || !request.query.latmax
        || !request.query.longmin || !request.query.longmax) {
    return respondJSON(request, response, 400, { message: 'All four parameters are required.', id: 'missingParams' });
  }

  // Convert query parameters to numbers
  const latmin = parseFloat(request.query.latmin);
  const latmax = parseFloat(request.query.latmax);
  const longmin = parseFloat(request.query.longmin);
  const longmax = parseFloat(request.query.longmax);

  // Check if the converted parameters are valid numbers
  if (Number.isNaN(latmin) || Number.isNaN(latmax)
      || Number.isNaN(longmin) || Number.isNaN(longmax)) {
    return respondJSON(request, response, 400, { message: 'One or more of the parameters were not numbers.', id: 'invalidParams' });
  }

  if (latmax < latmin || longmax < longmin) {
    return respondJSON(request, response, 400, { message: 'Either the lat or long min range value is larger than its max range value.', id: 'invalidParams' });
  }

  // Filter countries based on latitude and longitude ranges
  const filtered = data.filter((country) => parseFloat(country.latitude) >= latmin
        && parseFloat(country.latitude) <= latmax
        && parseFloat(country.longitude) >= longmin
        && parseFloat(country.longitude) <= longmax);

  // Return filtered results
  if (filtered.length) {
    return respondJSON(request, response, 200, filtered);
  }
  return respondJSON(request, response, 404, { message: 'No countries found within the specified range.' });
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
    return respondJSON(request, response, 404, { message: 'Either a region or a subregion is allowed. Neither or both is forbidden.', id: 'invalidParams' });
  }

  let filtered = {};

  if (request.query.region) {
    const region = (request.query.region).toLowerCase();
    filtered = data.filter((country) => country.region.toLowerCase() === region);
  } else if (request.query.subregion) {
    const subregion = (request.query.subregion).toLowerCase();
    filtered = data.filter((country) => country.subregion.toLowerCase() === subregion);
  }

  if (!filtered.length) {
    return respondJSON(request, response, 400, { message: 'There are no countries in this region/subregion' });
  }

  if (filtered) { return respondJSON(request, response, 200, filtered); }
  return respondJSON(request, response, 404, { message: 'Country not found' });
};

// return JSON of all favorite data
const getFavorites = (request, response) => {
  const responseJSON = {
    favorites,
  };

  respondJSON(request, response, 200, responseJSON);
};

const addFavorites = (request, response) => {
  const name = (request.body.name).toLowerCase();
  const filtered = data.find((country) => country.name.toLowerCase() === name);

  if (filtered) {
    favorites.push(filtered);
    respondJSON(request, response, 200, { message: 'Country added to favorites' });
  } else { respondJSON(request, response, 404, { message: 'Country not found' }); }
};

const addCountry = (request, response) => {
  const responseJSON = {
    message: 'All parameters are required.',
  };

  // console.log(request.body);

  const {
    name,
    capital,
    finance: financeString,
    region,
    subregion,
    nationality,
    timezones: timezonesString,
    latitude,
    longitude,
  } = request.body;

  // Parse the finance and timezones from JSON strings to objects/arrays
  let finance;
  let timezones;

  try {
    finance = JSON.parse(financeString);
    timezones = JSON.parse(timezonesString);
  } catch (error) {
    responseJSON.id = 'invalidJSON';
    return respondJSON(request, response, 400, responseJSON);
  }

  // Check if finance and timezones are provided
  if (!finance || !finance.currency || !finance.currency_name || !finance.currency_symbol
      || !timezones || timezones.length === 0) {
    responseJSON.id = 'missingParamsFinance';
    return respondJSON(request, response, 400, responseJSON);
  }

  const {
    currency,
    currencyName,
    currencySymbol,
  } = finance;

  const timezone = timezones[0]; // Get the first timezone from the array

  if (!timezone || !timezone.zoneName || !timezone.gmtOffset || !timezone.gmtOffsetName
      || !timezone.abbreviation || !timezone.tzName) {
    responseJSON.id = 'missingParamsTimezones';
    return respondJSON(request, response, 400, responseJSON);
  }

  // Validate other required fields
  if (!name || !capital || !region || !subregion || !nationality || !latitude || !longitude) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  let responseCode = 204;

  let country = data.find((x) => x.name.toLowerCase() === name.toLowerCase());

  // If the country doesn't exist yet
  if (!country) {
    responseCode = 201;
    data.push({
      name,
      capital,
      finance: {
        currency,
        currency_name: currencyName,
        currency_symbol: currencySymbol,
      },
      region,
      subregion,
      nationality,
      timezones,
      latitude,
      longitude,
    });
  }

  country = data.find((x) => x.name.toLowerCase() === name.toLowerCase());

  // Update country details
  country.capital = capital;
  country.finance.currency = currency;
  country.finance.currency_name = currencyName;
  country.finance.currency_symbol = currencySymbol;
  country.region = region;
  country.subregion = subregion;
  country.nationality = nationality;
  country.timezones = timezones; // Update to use the parsed timezones
  country.latitude = latitude;
  country.longitude = longitude;

  // This array of objects sort algorithm was taken from here:
  // https://stackoverflow.com/questions/71456927/how-to-sort-an-array-of-objects-in-javascript
  data.sort((a, b) => a.name.localeCompare(b.name));

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSON(request, response, responseCode, {});
};

const addReview = (request, response) => {
  const responseJSON = {
    message: 'An error occurred.',
  };

  if (!request.body.name || !request.body.review) {
    return respondJSON(request, response, 400, { message: 'Both parameters are required.', id: 'missingParams' });
  }

  let { name } = request.body;
  name = name.toLowerCase();
  const country = data.find((x) => x.name.toLowerCase() === name);

  if (!country) {
    return respondJSON(request, response, 404, { message: 'Country not found' });
  }

  country.review = request.body.review;

  // console.log(data[request.body.name].review);

  responseJSON.message = 'Created successfully';

  return respondJSON(request, response, 200, responseJSON);
};

// Gets a not found error response
const notFound = (request, response) => respondJSON(
  request,
  response,
  404,
  { message: 'The page you are looking for was not found', id: 'notFound' },
);

module.exports = {
  getIndex,
  getDocumentation,
  getCSS,
  getCountry,
  getCountries,
  getAllCountries,
  getRegion,
  getFavorites,
  addCountry,
  addReview,
  addFavorites,
  notFound,
};
