

import styles from './AttendanceStats.module.css';

interface AttendanceStatsProps {
  stats: {
    total: number;
    attending: number;
    notAttending: number;
    maybe: number;
    totalGuests: number;
  };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const statCards = [
    { label: '총 응답', value: stats.total, type: 'total' },
    { label: '참석', value: stats.attending, type: 'attending', subValue: `총 ${stats.totalGuests}명` },
    { label: '불참', value: stats.notAttending, type: 'not-attending' },
    { label: '미정', value: stats.maybe, type: 'maybe' },
  ];

  return (
    <div className={styles.container}>
      {statCards.map((stat, index) => (
        <div key={index} className={styles.statCard} data-stat-type={stat.type}>
          <p className={styles.label}>{stat.label}</p>
          <p className={styles.value}>{stat.value}</p>
          {stat.subValue && (
            <p className={styles.subValue}>{stat.subValue}</p>
          )}
        </div>
      ))}
    </div>
  );
}
