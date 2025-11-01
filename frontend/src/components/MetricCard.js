import React from 'react';
export default function MetricCard({title, value, help}){
  return (
    <div className="card" role="group" aria-label={title}>
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      {help && <div className="card-help">{help}</div>}
      <button onClick={()=>speechSynthesis.speak(new SpeechSynthesisUtterance(`${title} ${value}`))}>🔊</button>
    </div>
  );
}
