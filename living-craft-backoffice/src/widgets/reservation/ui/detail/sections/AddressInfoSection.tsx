/**
 * 주소 정보 섹션
 */
import { formatFullAddress } from '@/shared/lib/format'
import styles from './section.module.scss'

interface AddressInfoSectionProps {
  address: string
  detailAddress: string
}

export function AddressInfoSection({
  address,
  detailAddress,
}: AddressInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>주소 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>주소</span>
          <span className={styles.infoValue}>
            {formatFullAddress(address, detailAddress)}
          </span>
        </div>
      </div>
    </div>
  )
}
