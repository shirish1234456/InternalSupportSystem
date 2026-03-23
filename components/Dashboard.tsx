export default function DashboardStats({ stats }: { stats: any }) {
  const cards = [
    { label: 'Total Chats Today', value: stats.today, color: 'text-primary-600' },
    { label: 'Open Issues', value: stats.open, color: 'text-red-600' },
    { label: 'Resolution Rate', value: `${stats.rate}%`, color: 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.label} className="p-6 bg-white rounded-xl shadow-sm border">
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}