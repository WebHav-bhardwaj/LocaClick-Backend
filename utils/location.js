
// const API_KEY = something
//npm install --save axios

// const HttpError = require("../models/http-error");


const getCoordsForAddress = async (address) => {
  return {
    lat: 40.123123,
    lng: -70.87678,
  };

  // const response = await axios.get(copu the url from the geoAPI);
  //   const data = response.data;
  //   if (!data | (data.status === "ZERO_RESULTS")) {
  //     const error = new HttpError(
  //       "could not find location for the specific address.",
  //       422
  //     );
  //     throw error;
  //   }

  //   const coordinates = data.results[0].geometry.location;

  //   return coordinates;
};

module.exports = getCoordsForAddress;
