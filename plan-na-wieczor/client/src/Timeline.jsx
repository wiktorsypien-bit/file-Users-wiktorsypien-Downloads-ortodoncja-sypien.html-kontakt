// The signature visual element: an evening timeline of 4-5 stops.
export default function Timeline({ plan }) {
  return (
    <section className="plan" aria-label={`Plan wieczoru: ${plan.city}`}>
      <header className="plan-header">
        <p className="plan-city">{plan.city}</p>
        <h2 className="plan-title">{plan.title}</h2>
        {plan.summary && <p className="plan-summary">{plan.summary}</p>}
      </header>

      <ol className="timeline">
        {plan.stops.map((stop, i) => (
          <li className="stop" key={`${stop.time}-${i}`}>
            <div className="stop-marker" aria-hidden="true">
              <span className="stop-dot" />
            </div>
            <div className="stop-body">
              <div className="stop-top">
                <span className="stop-time">{stop.time}</span>
                <span className="stop-cost">{stop.cost}</span>
              </div>
              <h3 className="stop-name">{stop.name}</h3>
              {stop.area && <p className="stop-area">{stop.area}</p>}
              <p className="stop-what">{stop.what}</p>
              {stop.why && <p className="stop-why">{stop.why}</p>}
            </div>
          </li>
        ))}
      </ol>

      <footer className="plan-total">
        <span>Razem za wieczór</span>
        <strong>{plan.total_cost}</strong>
      </footer>
    </section>
  );
}
