const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { fetchDistrictMonth } = require('./dataGovClient');
require('dotenv').config();

const CACHE_TTL_HOURS = Number(process.env.CACHE_TTL_HOURS || 24);

// Helper: get cached data
async function getCached(state, district, year, month) {
  const res = await pool.query(
    `SELECT data, updated_at FROM mgnrega_monthly WHERE state=$1 AND district=$2 AND year=$3 AND month=$4`,
    [state, district, year, month]
  );
  if(res.rows.length === 0) return null;
  return res.rows[0];
}

// Helper: save
async function saveCached(state, district, year, month, data) {
  await pool.query(`
    INSERT INTO mgnrega_monthly (state,district,year,month,data,updated_at)
    VALUES ($1,$2,$3,$4,$5,now())
    ON CONFLICT (state,district,year,month) DO UPDATE SET data=$5, updated_at=now()
  `, [state, district, year, month, data]);
}

router.get('/districts', async (req,res) => {
  // Minimal districts list for Uttar Pradesh — in production pull from authoritative source or DB
  const districts = [
    "Lucknow","Prayagraj","Varanasi","Kanpur Nagar","Allahabad","Agra","Gorakhpur","Meerut","Bareilly"
    // (you can expand to full list)
  ];
  res.json({ state: process.env.STATE || 'Uttar Pradesh', districts });
});

router.get('/data', async (req,res) => {
  try {
    const state = req.query.state || process.env.STATE || 'Uttar Pradesh';
    const district = req.query.district;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if(!district || !year || !month) return res.status(400).json({ error: 'district, year, month required' });

    const cached = await getCached(state, district, year, month);
    const now = new Date();

    // If cached and fresh, return
    if(cached) {
      const ageHours = (now - new Date(cached.updated_at)) / (1000*60*60);
      if(ageHours < CACHE_TTL_HOURS) {
        return res.json({ source: 'cache', record: cached.data });
      }
    }

    // Else fetch from data.gov.in
    try {
      const records = await fetchDistrictMonth(state, district, year, month);
      // records could be an array of monthly rows. We try to find exact year/month match.
      let found = null;
      for(const r of records) {
        // try common fields
        if((r.year && Number(r.year) === year) || (r.financial_year && r.financial_year.includes(String(year)))) {
          // Some datasets store month as number or text
          if(r.month && Number(r.month) === month) { found = r; break; }
          if(r.month_name && r.month_name.toLowerCase().includes(String(month))) { found = r; break;}
        }
      }
      // If none matches, pick the record that seems like aggregate and return whole array
      const payload = found || { records };
      // save to DB
      await saveCached(state, district, year, month, payload);
      return res.json({ source: 'api', record: payload });
    } catch (err) {
      console.error('API fetch failed, serving cache if available', err.message);
      if(cached) return res.json({ source: 'cache-stale', record: cached.data, warn: 'External API failed.' });
      return res.status(502).json({ error: 'External API failed and no cached data available.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
