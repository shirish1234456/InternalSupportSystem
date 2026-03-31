'use client';
import { motion } from 'framer-motion';
import Counter from './Counter';

export default function DashboardStats({ stats }: { stats: any }) {
  const cards = [
    { label: 'Total Chats Today', value: stats.today || 0, suffix: '', color: 'text-primary-600 dark:text-primary-400', glow: 'shadow-primary-500/50' },
    { label: 'Open Issues', value: stats.open || 0, suffix: '', color: 'text-rose-600 dark:text-rose-400', glow: 'shadow-rose-500/50' },
    { label: 'Resolution Rate', value: stats.rate || 0, suffix: '%', color: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/50' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {cards.map((card) => (
        <motion.div 
          variants={item}
          key={card.label} 
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className={`p-6 rounded-2xl border glass-card transition-all duration-300 hover:shadow-lg hover:${card.glow} relative overflow-hidden group`}
        >
          {/* Animated background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-slate-800/40 dark:to-slate-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">{card.label}</p>
          <motion.p 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`text-4xl font-extrabold tracking-tight ${card.color} relative z-10`}
          >
            <Counter value={card.value} suffix={card.suffix} />
          </motion.p>
        </motion.div>
      ))}
    </motion.div>
  );
}