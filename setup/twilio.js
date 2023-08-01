const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const number = process.env.TWILIO_NUMBER;
const client = require("twilio")(accountSid, authToken);
module.exports = {
  TWILIO_AUTH_TOKEN: accountSid,
  TWILIO_SID: authToken,
  TWILIO_NUMBER: number,
  twilioClient: client,
};
