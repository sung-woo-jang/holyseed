import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('prices', { schema: 'iv' })
export class IvPrice {
  @PrimaryColumn()
  ticker: string

  @PrimaryColumn({ name: 'price_date', type: 'date' })
  priceDate: string

  @Column({
    name: 'close_price',
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  closePrice: number

  @Column({ name: 'fetched_at', type: 'timestamptz', default: () => 'now()' })
  fetchedAt: Date
}
