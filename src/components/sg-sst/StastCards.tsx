import type { SgSstStats } from '../../interfaces/SgSstInterface';
import styles from '../../styles/components/sg-sst/StatsCards.module.css';

interface StatsCardsProps {
  stats: SgSstStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const statCards = [
    {
      title: 'Total Formularios',
      value: stats.total,
      color: '#3B82F6',
      icon: '📊'
    },
    {
      title: 'Pendiente SST',
      value: stats.pendingSst,
      color: '#F59E0B',
      icon: '⏳'
    },
    {
      title: 'Completados',
      value: stats.completed,
      color: '#10B981',
      icon: '✅'
    }
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Resumen General</h2>
      <div className={styles.grid}>
        {statCards.map((stat) => (
          <div 
            key={stat.title} 
            className={styles.card}
            style={{ borderLeftColor: stat.color }}
          >
            <div className={styles.cardHeader}>
              <div 
                className={styles.icon}
                style={{ backgroundColor: `${stat.color}20` }}
              >
                {stat.icon}
              </div>
              <span className={styles.title}>{stat.title}</span>
            </div>
            <div className={styles.value} style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}