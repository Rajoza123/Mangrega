const cron = require('node-cron');
const { pool } = require('./db');
const { fetchDistrictMonth } = require('./dataGovClient');

const popularDistricts = ['Lucknow','Prayagraj','Varanasi','Kanpur Nagar'];
const YEAR = new Date().getFullYear();
const MONTH = new Date().getMonth() + 1;

function startJobs() {
  // daily at 02:10 AM
  cron.schedule('10 2 * * *', async () => {
    console.log('Daily refresh job started');
    for(const district of popularDistricts) {
      try {
        const records = await fetchDistrictMonth(process.env.STATE, district, YEAR, MONTH);
        // naive: save as month/year record
        await pool.query(`
          INSERT INTO mgnrega_monthly (state, district, year, month, data, updated_at)
          VALUES ($1,$2,$3,$4,$5,now())
          ON CONFLICT (state,district,year,month) DO UPDATE SET data=$5, updated_at=now()
        `, [process.env.STATE, district, YEAR, MONTH, records]);
        console.log('refreshed', district);
      } catch (e) { console.error('refresh failed for', district, e.message); }
    }
    console.log('Daily refresh job finished');
  });
}

module.exports = { startJobs };
