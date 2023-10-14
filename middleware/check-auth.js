const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
    //OPTIONS is a request send by the browser before sending any request to just check weather the server is responding or not (learn more)
  if (req.method === "OPTIONS") {
    next();
  }
  try {
    token = req.headers.authorization.split(" ")[1]; // authorization = 'barer token' its a string so split it to get the token
    if (!token) {
      throw new Error("Authentication Failed");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); //this also returns a string or object instead of boolen with the payload in it
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    const err = new HttpError("Authentication failed!", 403);
    return next(err);
  }
};
