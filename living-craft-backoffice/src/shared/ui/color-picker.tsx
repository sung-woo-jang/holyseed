'use client'

import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Slider from '@radix-ui/react-slider'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import Color from 'color'
import { PipetteIcon } from 'lucide-react'

interface ColorPickerContextValue {
  hue: number
  saturation: number
  lightness: number
  alpha: number
  mode: string
  setHue: (hue: number) => void
  setSaturation: (saturation: number) => void
  setLightness: (lightness: number) => void
  setAlpha: (alpha: number) => void
  setMode: (mode: string) => void
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined
)

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext)
  if (!context) {
    throw new Error('useColorPicker must be used within a ColorPickerProvider')
  }
  return context
}

export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
  value?: Parameters<typeof Color>[0]
  defaultValue?: Parameters<typeof Color>[0]
  onChange?: (value: string) => void
}

export const ColorPicker = ({
  value,
  defaultValue = '#000000',
  onChange,
  className,
  ...props
}: ColorPickerProps) => {
  const selectedColor = value ? Color(value) : Color(defaultValue)
  const defaultColorObj = Color(defaultValue)

  const [hue, setHue] = useState(
    selectedColor.hue() || defaultColorObj.hue() || 0
  )
  const [saturation, setSaturation] = useState(
    selectedColor.saturationl() || defaultColorObj.saturationl() || 100
  )
  const [lightness, setLightness] = useState(
    selectedColor.lightness() || defaultColorObj.lightness() || 50
  )
  const [alpha, setAlpha] = useState(
    selectedColor.alpha() * 100 || defaultColorObj.alpha() * 100
  )
  const [mode, setMode] = useState('hex')

  // onChange를 ref로 저장하여 무한 루프 방지
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // 외부 value 변경 시 내부 상태 업데이트 (무한 루프 방지를 위해 flag 사용)
  const isUpdatingFromProp = useRef(false)
  useEffect(() => {
    if (value) {
      isUpdatingFromProp.current = true
      const color = Color(value)
      const [h, s, l] = color.hsl().array()
      setHue(h)
      setSaturation(s)
      setLightness(l)
      setAlpha(color.alpha() * 100)
      // 다음 렌더링 사이클에서 flag 초기화
      setTimeout(() => {
        isUpdatingFromProp.current = false
      }, 0)
    }
  }, [value])

  // 내부 상태 변경 시 부모에게 알림 (외부에서 업데이트 중일 때는 제외)
  useEffect(() => {
    if (!isUpdatingFromProp.current && onChangeRef.current) {
      const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100)
      onChangeRef.current(color.hex())
    }
  }, [hue, saturation, lightness, alpha])

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        setMode,
      }}
    >
      <div
        className={cn('flex size-full flex-col gap-4', className)}
        {...(props as any)}
      />
    </ColorPickerContext.Provider>
  )
}

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>

export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [positionX, setPositionX] = useState(0)
    const [positionY, setPositionY] = useState(0)

    const { hue, saturation, lightness, alpha, setSaturation, setLightness } =
      useColorPicker()

    const backgroundGradient = useMemo(() => {
      return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`
    }, [hue])

    const currentColor = useMemo(() => {
      return Color.hsl(hue, saturation, lightness)
        .alpha(alpha / 100)
        .hex()
    }, [hue, saturation, lightness, alpha])

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!(isDragging && containerRef.current)) {
          return
        }

        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width)
        )
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - rect.top) / rect.height)
        )

        setPositionX(x)
        setPositionY(y)
        setSaturation(x * 100)

        const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x)
        const lightness = topLightness * (1 - y)
        setLightness(lightness)
      },
      [isDragging, setSaturation, setLightness]
    )

    useEffect(() => {
      const handlePointerUp = () => setIsDragging(false)

      if (isDragging) {
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
      }

      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }, [isDragging, handlePointerMove])

    return (
      <div
        className={cn('relative size-full cursor-crosshair rounded', className)}
        onPointerDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
          handlePointerMove(e.nativeEvent)
        }}
        ref={containerRef}
        style={{
          background: backgroundGradient,
        }}
        {...(props as any)}
      >
        {/* 왼쪽 상단 현재 색상 프리뷰 */}
        <div
          className='pointer-events-none absolute top-2.5 left-2.5 h-6 w-6 rounded-full border-2 border-white shadow-md'
          style={{ backgroundColor: currentColor }}
        />

        {/* 선택 인디케이터 */}
        <div
          className='pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white'
          style={{
            left: `${positionX * 100}%`,
            top: `${positionY * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    )
  }
)

ColorPickerSelection.displayName = 'ColorPickerSelection'

export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>

export const ColorPickerHue = ({
  className,
  ...props
}: ColorPickerHueProps) => {
  const { hue, setHue } = useColorPicker()

  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={360}
      onValueChange={([hue]) => setHue(hue)}
      step={1}
      value={[hue]}
      {...(props as any)}
    >
      <Slider.Track className='relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]'>
        <Slider.Range className='absolute h-full' />
      </Slider.Track>
      <Slider.Thumb className='border-primary/50 bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50' />
    </Slider.Root>
  )
}

export type ColorPickerAlphaProps = ComponentProps<typeof Slider.Root>

export const ColorPickerAlpha = ({
  className,
  ...props
}: ColorPickerAlphaProps) => {
  const { alpha, setAlpha } = useColorPicker()

  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={100}
      onValueChange={([alpha]) => setAlpha(alpha)}
      step={1}
      value={[alpha]}
      {...(props as any)}
    >
      <Slider.Track
        className='relative my-0.5 h-3 w-full grow rounded-full'
        style={{
          background:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==") left center',
        }}
      >
        <div className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-black/50' />
        <Slider.Range className='absolute h-full rounded-full bg-transparent' />
      </Slider.Track>
      <Slider.Thumb className='border-primary/50 bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50' />
    </Slider.Root>
  )
}

export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>

export const ColorPickerEyeDropper = ({
  className,
  ...props
}: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker()

  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      const color = Color(result.sRGBHex)
      const [h, s, l] = color.hsl().array()
      setHue(h)
      setSaturation(s)
      setLightness(l)
      setAlpha(100)
    } catch (error) {
      console.error('EyeDropper failed:', error)
    }
  }

  return (
    <Button
      className={cn('text-muted-foreground shrink-0', className)}
      onClick={handleEyeDropper}
      size='icon'
      variant='outline'
      type='button'
      {...(props as any)}
    >
      <PipetteIcon size={16} />
    </Button>
  )
}

export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>

const formats = ['hex', 'rgb', 'css', 'hsl']

export const ColorPickerOutput = ({
  className,
  ...props
}: ColorPickerOutputProps) => {
  const { mode, setMode } = useColorPicker()

  return (
    <Select onValueChange={setMode} value={mode}>
      <SelectTrigger className='h-8 w-20 shrink-0 text-xs' {...(props as any)}>
        <SelectValue placeholder='Mode' />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem className='text-xs' key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type PercentageInputProps = ComponentProps<typeof Input>

const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
  return (
    <div className='relative'>
      <Input
        readOnly
        type='text'
        {...(props as any)}
        className={cn(
          'bg-secondary h-8 w-[3.25rem] rounded-l-none px-2 text-xs shadow-none',
          className
        )}
      />
      <span className='text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
        %
      </span>
    </div>
  )
}

export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>

export const ColorPickerFormat = ({
  className,
  ...props
}: ColorPickerFormatProps) => {
  const {
    hue,
    saturation,
    lightness,
    alpha,
    mode,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
  } = useColorPicker()
  const color = Color.hsl(hue, saturation, lightness, alpha / 100)

  if (mode === 'hex') {
    const hex = color.hex()
    const [localHex, setLocalHex] = useState(hex)
    const [localAlpha, setLocalAlpha] = useState(Math.round(alpha).toString())

    // 외부에서 색상이 변경되면 로컬 상태 업데이트
    useEffect(() => {
      setLocalHex(hex)
    }, [hex])

    useEffect(() => {
      setLocalAlpha(Math.round(alpha).toString())
    }, [alpha])

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setLocalHex(value)
    }

    const handleHexBlur = () => {
      try {
        const parsedColor = Color(localHex)
        const [h, s, l] = parsedColor.hsl().array()
        setHue(h)
        setSaturation(s)
        setLightness(l)
      } catch {
        // 유효하지 않으면 원래 값으로 복원
        setLocalHex(hex)
      }
    }

    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalAlpha(e.target.value)
    }

    const handleAlphaBlur = () => {
      const value = parseFloat(localAlpha)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        setAlpha(value)
      } else {
        setLocalAlpha(Math.round(alpha).toString())
      }
    }

    return (
      <div
        className={cn(
          'relative flex w-full items-center -space-x-px rounded-md shadow-sm',
          className
        )}
        {...(props as any)}
      >
        <Input
          className='bg-secondary h-8 rounded-r-none px-2 text-xs shadow-none'
          type='text'
          value={localHex}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          placeholder='#000000'
        />
        <div className='relative'>
          <Input
            type='text'
            value={localAlpha}
            onChange={handleAlphaChange}
            onBlur={handleAlphaBlur}
            className={cn(
              'bg-secondary h-8 w-[3.25rem] rounded-l-none px-2 text-xs shadow-none'
            )}
          />
          <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
            %
          </span>
        </div>
      </div>
    )
  }

  if (mode === 'rgb') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value))

    const [localRgb, setLocalRgb] = useState(rgb.map(String))
    const [localAlpha, setLocalAlpha] = useState(Math.round(alpha).toString())

    useEffect(() => {
      setLocalRgb(rgb.map(String))
    }, [rgb[0], rgb[1], rgb[2]])

    useEffect(() => {
      setLocalAlpha(Math.round(alpha).toString())
    }, [alpha])

    const handleRgbChange = (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newLocalRgb = [...localRgb]
      newLocalRgb[index] = e.target.value
      setLocalRgb(newLocalRgb)
    }

    const handleRgbBlur = (index: number) => {
      const value = parseInt(localRgb[index], 10)
      if (isNaN(value) || value < 0 || value > 255) {
        // 유효하지 않으면 원래 값으로 복원
        const newLocalRgb = [...localRgb]
        newLocalRgb[index] = rgb[index].toString()
        setLocalRgb(newLocalRgb)
        return
      }

      const newRgb = localRgb.map(Number)
      try {
        const parsedColor = Color.rgb(newRgb)
        const [h, s, l] = parsedColor.hsl().array()
        setHue(h)
        setSaturation(s)
        setLightness(l)
      } catch {
        // 유효하지 않으면 원래 값으로 복원
        const newLocalRgb = [...localRgb]
        newLocalRgb[index] = rgb[index].toString()
        setLocalRgb(newLocalRgb)
      }
    }

    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalAlpha(e.target.value)
    }

    const handleAlphaBlur = () => {
      const value = parseFloat(localAlpha)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        setAlpha(value)
      } else {
        setLocalAlpha(Math.round(alpha).toString())
      }
    }

    return (
      <div
        className={cn(
          'flex items-center -space-x-px rounded-md shadow-sm',
          className
        )}
        {...(props as any)}
      >
        {localRgb.map((value, index) => (
          <Input
            className={cn(
              'bg-secondary h-8 rounded-r-none px-2 text-xs shadow-none',
              index && 'rounded-l-none',
              className
            )}
            key={index}
            type='text'
            value={value}
            onChange={(e) => handleRgbChange(index, e)}
            onBlur={() => handleRgbBlur(index)}
          />
        ))}
        <div className='relative'>
          <Input
            type='text'
            value={localAlpha}
            onChange={handleAlphaChange}
            onBlur={handleAlphaBlur}
            className={cn(
              'bg-secondary h-8 w-[3.25rem] rounded-l-none px-2 text-xs shadow-none'
            )}
          />
          <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
            %
          </span>
        </div>
      </div>
    )
  }

  if (mode === 'css') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value))
    return (
      <div
        className={cn('w-full rounded-md shadow-sm', className)}
        {...(props as any)}
      >
        <Input
          className='bg-secondary h-8 w-full px-2 text-xs shadow-none'
          readOnly
          type='text'
          value={`rgba(${rgb.join(', ')}, ${alpha}%)`}
          {...(props as any)}
        />
      </div>
    )
  }

  if (mode === 'hsl') {
    const hsl = color
      .hsl()
      .array()
      .map((value) => Math.round(value))

    const [localHsl, setLocalHsl] = useState(hsl.map(String))
    const [localAlpha, setLocalAlpha] = useState(Math.round(alpha).toString())

    useEffect(() => {
      setLocalHsl(hsl.map(String))
    }, [hsl[0], hsl[1], hsl[2]])

    useEffect(() => {
      setLocalAlpha(Math.round(alpha).toString())
    }, [alpha])

    const handleHslChange = (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newLocalHsl = [...localHsl]
      newLocalHsl[index] = e.target.value
      setLocalHsl(newLocalHsl)
    }

    const handleHslBlur = (index: number) => {
      const value = parseFloat(localHsl[index])

      // H: 0-360, S/L: 0-100
      const maxValue = index === 0 ? 360 : 100
      if (isNaN(value) || value < 0 || value > maxValue) {
        // 유효하지 않으면 원래 값으로 복원
        const newLocalHsl = [...localHsl]
        newLocalHsl[index] = hsl[index].toString()
        setLocalHsl(newLocalHsl)
        return
      }

      if (index === 0) setHue(value)
      if (index === 1) setSaturation(value)
      if (index === 2) setLightness(value)
    }

    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalAlpha(e.target.value)
    }

    const handleAlphaBlur = () => {
      const value = parseFloat(localAlpha)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        setAlpha(value)
      } else {
        setLocalAlpha(Math.round(alpha).toString())
      }
    }

    return (
      <div
        className={cn(
          'flex items-center -space-x-px rounded-md shadow-sm',
          className
        )}
        {...(props as any)}
      >
        {localHsl.map((value, index) => (
          <Input
            className={cn(
              'bg-secondary h-8 rounded-r-none px-2 text-xs shadow-none',
              index && 'rounded-l-none',
              className
            )}
            key={index}
            type='text'
            value={value}
            onChange={(e) => handleHslChange(index, e)}
            onBlur={() => handleHslBlur(index)}
          />
        ))}
        <div className='relative'>
          <Input
            type='text'
            value={localAlpha}
            onChange={handleAlphaChange}
            onBlur={handleAlphaBlur}
            className={cn(
              'bg-secondary h-8 w-[3.25rem] rounded-l-none px-2 text-xs shadow-none'
            )}
          />
          <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
            %
          </span>
        </div>
      </div>
    )
  }

  return null
}
