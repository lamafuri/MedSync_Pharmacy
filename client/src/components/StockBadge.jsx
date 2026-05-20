function StockBadge({ status }) {
  const styles = {
    red: 'bg-red-light text-red',
    amber: 'bg-amber-light text-amber',
    green: 'bg-mint-light text-mint',
  };

  const labels = {
    red: 'Low Stock',
    amber: 'Refill Soon',
    green: 'In Stock',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.green}`}>
      {labels[status] || labels.green}
    </span>
  );
}

export default StockBadge;
