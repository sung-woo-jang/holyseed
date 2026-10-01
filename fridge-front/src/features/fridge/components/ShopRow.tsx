import type { ShopItem } from '@/api/types'
import { Check } from '@/components/ui'

export default function ShopCheckRow({
  item,
  onToggle,
  compact = false,
}: {
  item: ShopItem
  onToggle: () => void
  compact?: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex shrink-0 items-center text-left ${compact ? 'min-h-[50px] gap-3.5' : 'min-h-16 flex-1 gap-[18px]'}`}
    >
      <Check done={item.done} size={compact ? 'sm' : 'md'} />
      <span
        className={`${compact ? 'text-[21px]' : 'text-[24px]'} ${item.done ? 'text-[#7d776a] line-through' : 'text-ink'}`}
      >
        {item.name}
      </span>
      {!compact && item.note && <span className="text-[17px] text-sub">{item.note}</span>}
    </button>
  )
}
