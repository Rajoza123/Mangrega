const axios = require('axios');
require('dotenv').config();

const BASE = 'https://api.data.gov.in/resource';
const RESOURCE_ID = process.env.RESOURCE_ID;
const API_KEY = process.env.DATAGOV_API_KEY;
if(!API_KEY) console.warn('Warning: DATAGOV_API_KEY not set in env.');

async function fetchDistrictMonth(state, district, year, month) {
  // Filter pattern used on data.gov.in resources
  const filters = {
    state_name: state,
    district_name: district
  };
  // Build filter params
  const filterParams = Object.entries(filters).map(([k,v]) =>
    `filters[${encodeURIComponent(k)}]=${encodeURIComponent(v)}`
  ).join('&');

  // Try to fetch a chunk of recent records and then filter by year/month
  const url = `${BASE}/${RESOURCE_ID}?api-key=${API_KEY}&${filterParams}&limit=1000`;
  const resp = await axios.get(url, { timeout: 15000 });
  const records = resp.data.records || resp.data;
  // records may contain monthly aggregated fields; find best match
  // We'll return all records and let aggregator handle filtering by year/month
  return records;
}

module.exports = { fetchDistrictMonth };
