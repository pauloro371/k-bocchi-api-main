const knex = require("knex")({
  client: "mysql",
  connection: {
    host: process.env.DATABASE_CONNECTION,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_KBOCCHI,
  },
  pool:{
    "min": 2,
    "max": 6,
    "createTimeoutMillis": 3000,
    "acquireTimeoutMillis": 30000,
    "idleTimeoutMillis": 30000,
    "reapIntervalMillis": 1000,
    "createRetryIntervalMillis": 100,
    "propagateCreateError": false // <- default is true, set to false
  }
});



module.exports = {
  knex
}


