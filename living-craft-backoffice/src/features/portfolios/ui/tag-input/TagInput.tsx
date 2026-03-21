import { useState, useCallback, type KeyboardEvent } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { X } from 'lucide-react'
import styles from './styles.module.scss'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagInput({
  value,
  onChange,
  placeholder = '태그 입력 후 Enter',
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault()
        const newTag = inputValue.trim()
        if (!value.includes(newTag) && value.length < maxTags) {
          onChange([...value, newTag])
          setInputValue('')
        }
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        onChange(value.slice(0, -1))
      }
    },
    [inputValue, value, onChange, maxTags]
  )

  const handleRemove = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove))
    },
    [value, onChange]
  )

  return (
    <div className={styles.container}>
      {value.length > 0 && (
        <div className={styles.tagList}>
          {value.map((tag) => (
            <Badge key={tag} variant='secondary' className={styles.tag}>
              {tag}
              <button
                type='button'
                className={styles.removeButton}
                onClick={() => handleRemove(tag)}
                aria-label={`${tag} 태그 삭제`}
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {value.length < maxTags && (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.input}
        />
      )}
      <p className={styles.hint}>
        {value.length}/{maxTags}개 태그 (Enter로 추가, Backspace로 삭제)
      </p>
    </div>
  )
}
