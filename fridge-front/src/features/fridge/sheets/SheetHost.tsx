import type { FridgeState } from '@/api/types'
import { useUiStore } from '@/stores/ui.store'
import EventSheet from './EventSheet'
import FreqSheet from './FreqSheet'
import IngredientSheet from './IngredientSheet'
import ShopSheet from './ShopSheet'

export default function SheetHost({ state }: { state: FridgeState }) {
  const sheet = useUiStore((s) => s.sheet)
  if (!sheet) return null
  switch (sheet.kind) {
    case 'event':
      return <EventSheet key={sheet.event?.id ?? `new-${sheet.date}`} state={state} event={sheet.event} date={sheet.date} />
    case 'ingredient':
      return <IngredientSheet key={sheet.ingredient?.id ?? 'new'} state={state} ingredient={sheet.ingredient} />
    case 'freq':
      return <FreqSheet state={state} />
    case 'shop':
      return <ShopSheet state={state} />
  }
}
