const MetricCard = ({ title, value, subtitle }) => {
  return (
    <article className="glass-card metric-card">
      <p className="metric-title">{title}</p>
      <h3 className="metric-value">{value}</h3>
      <p className="metric-subtitle">{subtitle}</p>
    </article>
  )
}

export default MetricCard
