import React from 'react';
export default function DistrictSelector({districts,value,onChange,detectLocation}){
  return (
    <div className="selector">
      <label>District</label>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        {districts.map(d=> <option key={d} value={d}>{d}</option>)}
      </select>
      <button onClick={detectLocation}>Detect my location</button>
    </div>
  );
}
