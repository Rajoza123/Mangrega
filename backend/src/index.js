const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const routes = require('./routes');
const { init } = require('./db');
const { startJobs } = require('./jobs');

const PORT = process.env.PORT || 4000;

async function start() {
  await init();
  app.use(cors());
  app.use(express.json());
  app.use('/api', routes);

  app.listen(PORT, () => {
    console.log('Server listening on', PORT);
  });

  // Start scheduled jobs
  startJobs();
}
start();
