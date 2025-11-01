import React, {useState, useEffect} from 'react';
import DistrictSelector from './components/DistrictSelector';
import MetricCard from './components/MetricCard';
import TrendSparkline from './components/TrendSparkline';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

function App(){
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState('');
  const [year,setYear] = useState(new Date().getFullYear());
  const [month,setMonth] = useState(new Date().getMonth()+1);
  const [record, setRecord] = useState(null);
  const [lang, setLang] = useState('hi'); // default Hindi

  useEffect(() => {
    fetch(`${API_BASE}/districts`).then(r=>r.json()).then(d=>{
      setDistricts(d.districts);
      setDistrict(d.districts[0]);
    });
  },[]);

  async function load(){
    if(!district) return;
    const res = await fetch(`${API_BASE}/data?district=${encodeURIComponent(district)}&year=${year}&month=${month}`);
    const payload = await res.json();
    setRecord(payload);
  }

  // Try auto-detect district via browser geolocation
  async function detectLocation(){
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      // Reverse geocode via Nominatim (no key)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const json = await r.json();
        const districtName = json.address && (json.address.county || json.address.state_district || json.address.town || json.address.village || json.address.city_district);
        if(districtName){
          // best effort: find a match among districts
          const match = districts.find(d=>d.toLowerCase().includes(districtName.toLowerCase()));
          if(match) setDistrict(match);
        }
      } catch(e){}
    }, ()=>{}, { timeout: 10000 });
  }

  return (
    <div className="app">
      <header>
        <h1>{lang==='hi'?'हमारी आवाज, हमारे अधिकार':'Our Voice, Our Rights'}</h1>
        <button onClick={()=>setLang(lang==='hi'?'en':'hi')}>{lang==='hi'?'English':'हिंदी'}</button>
      </header>

      <div className="controls">
        <DistrictSelector districts={districts} value={district} onChange={setDistrict} detectLocation={detectLocation}/>
        <div>
          <label>{lang==='hi'?'वर्ष':'Year'}</label>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}/>
          <label>{lang==='hi'?'माह':'Month'}</label>
          <input type="number" min="1" max="12" value={month} onChange={e=>setMonth(Number(e.target.value))}/>
          <button onClick={load}>{lang==='hi'?'देखो':'View'}</button>
        </div>
      </div>

      {record && record.record && (
        <main>
          <div className="cards">
            <MetricCard title={lang==='hi'?'कुल रोजगार (व्यक्ति-दिन)':'Total person-days'} value={record.record.persondays_of_central_liability_so_far || record.record.total_persondays || '—'} help={lang==='hi'?'कितने व्यक्ति-दिन पैदा हुए':'How many person-days generated'}/>
            <MetricCard title={lang==='hi'?'कुल मजदूरी (लाख रु.)':'Wages (lakh Rs.)'} value={record.record.wages_rs__in_lakhs_ || record.record.wages || '—'}/>
            <MetricCard title={lang==='hi'?'महिला भागीदारी':'Women person-days'} value={record.record.women_persondays || '—'} />
          </div>

          <section className="trend">
            <h3>{lang==='hi'?'रुझान (पिछले 12 माह)':'Trend (last 12 months)'}</h3>
            <TrendSparkline data={[/* in production fetch last 12 months series */]} />
          </section>

          {record.warn && <div className="warn">{record.warn}</div>}
          <div className="meta">Source: {record.source}</div>
        </main>
      )}
    </div>
  );
}

export default App;
