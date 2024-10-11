const fs = require('fs'); // pull in the file system module

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const data = JSON.parse(fs.readFileSync(`${__dirname}/../data/countries.json`));

// Gets the index html
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
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
  console.log(content);
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
    return respondJSON(request, response, 404, { message: 'All four parameters are required.', id: 'missingParams' });
  }

  // Convert query parameters to numbers
  const latmin = parseFloat(request.query.latmin);
  const latmax = parseFloat(request.query.latmax);
  const longmin = parseFloat(request.query.longmin);
  const longmax = parseFloat(request.query.longmax);

  // Check if the converted parameters are valid numbers
  if (Number.isNaN(latmin) || Number.isNaN(latmax)
      || Number.isNaN(longmin) || Number.isNaN(longmax)) {
    return respondJSON(request, response, 404, { message: 'One or more of the parameters were not numbers.', id: 'invalidParams' });
  }

  // Filter countries based on latitude and longitude ranges
  const filtered = data.filter((country) => parseFloat(country.latitude) >= latmin
        && parseFloat(country.latitude) <= latmax
        && parseFloat(country.longitude) >= longmin
        && parseFloat(country.longitude) <= longmax);

  // Return filtered results
  if (filtered.length > 0) {
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

  if (filtered) { return respondJSON(request, response, 200, filtered); }
  return respondJSON(request, response, 404, { message: 'Country not found' });
};

// http://127.0.0.1:3000/addCountry?name=e&capital=e&currency=e&
// currency_name=w&currency_symbol=3&region=3&subregion=23&nationality=djs&zoneName=3&
// gmtOffset=sss&gmtOffsetName=sss&abbreviation=e&tzName=sjsjs&latitude=1.000&longitude=1.999

// uses a POST to update or add a country

// console.log("Name: " + name);
// console.log("Capital: " + capital);
// console.log("Currency: " + currency);
// console.log("Currency Symbol:" + currencySymbol);
// console.log("Region: " + region);
// console.log("Subregion: " + subregion);
// console.log("Nationality: " + nationality);
// console.log("Zone Name: " + zoneName);
// console.log("GMT Offset: " + gmtOffset);
// console.log("GMT Offset Name: " + gmtOffsetName);
// console.log("Abbreviation: " + abbreviation);
// console.log("TZ Name: " + tzName);
// console.log("Latitude: " + latitude);
// console.log("Longitude: " + longitude);

const addCountry = (request, response) => {
  const responseJSON = {
    message: 'All parameters are required.',
  };

  // console.log(request.body);

  const {
    name,
    capital,
    finance,
    region,
    subregion,
    nationality,
    timezones,
    latitude,
    longitude,
  } = request.body;

  // Check if finance and timezones are provided
  if (!finance || !finance.currency || !finance.currency_name || !finance.currency_symbol
      || !timezones || timezones.length === 0) {
    responseJSON.id = 'missingParams';
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
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  const {
    zoneName,
    gmtOffset,
    gmtOffsetName,
    abbreviation,
    tzName,
  } = timezone;

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
      timezones: {
        zoneName,
        gmtOffset,
        gmtOffsetName,
        abbreviation,
        tzName,
      },
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
  country.timezones.zoneName = zoneName;
  country.timezones.gmtOffset = gmtOffset;
  country.timezones.gmtOffsetName = gmtOffsetName;
  country.timezones.abbreviation = abbreviation;
  country.timezones.tzName = tzName;
  country.latitude = latitude;
  country.longitude = longitude;

  data.sort();

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSON(request, response, responseCode, {});
};

const addReview = (request, response) => {
  // console.log(`Review: ${request.query.review}`);
  // console.log(`Name: ${request.query.name}`);
  // console.log(request.body.name);

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
  getCSS,
  getCountry,
  getCountries,
  getAllCountries,
  getRegion,
  addCountry,
  addReview,
  notFound,
};
