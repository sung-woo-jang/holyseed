import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Plus } from 'lucide-react'
import { useFetchFilms } from '../../api'
import { useFilmCuttingForm } from '../../model'
import styles from './styles.module.scss'

/**
 * 필름 재단 폼 설정 섹션
 * - 프로젝트명
 * - 필름 선택
 * - 회전 허용
 */
export function FilmCuttingFormSettings() {
  const {
    projectName,
    setProjectName,
    selectedFilmId,
    setSelectedFilmId,
    allowRotation,
    setAllowRotation,
    setOpen,
  } = useFilmCuttingForm([
    'projectName',
    'setProjectName',
    'selectedFilmId',
    'setSelectedFilmId',
    'allowRotation',
    'setAllowRotation',
    'setOpen',
  ])

  const { data: filmsList } = useFetchFilms()

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>프로젝트 설정</h3>

      <div className={styles.formGroup}>
        <Label htmlFor='projectName'>프로젝트명 *</Label>
        <Input
          id='projectName'
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder='예: 거실 리모델링'
        />
      </div>

      <div className={styles.formGroup}>
        <Label htmlFor='film'>필름 선택 *</Label>
        <div className={styles.filmSelectRow}>
          <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
            <SelectTrigger className={styles.filmSelect}>
              <SelectValue placeholder='필름을 선택하세요' />
            </SelectTrigger>
            <SelectContent>
              {filmsList?.map((film) => (
                <SelectItem key={film.id} value={film.id.toString()}>
                  {film.name} ({film.width}mm × {film.length}mm)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setOpen('createFilm')}
            className={styles.addFilmButton}
          >
            <Plus className='h-4 w-4' />새 필름
          </Button>
        </div>
      </div>

      <div className={styles.switchGroup}>
        <div className={styles.switchInfo}>
          <Label htmlFor='allowRotation'>회전 허용</Label>
          <p className={styles.switchDescription}>
            조각을 90도 회전하여 배치할 수 있습니다
          </p>
        </div>
        <Switch
          id='allowRotation'
          checked={allowRotation}
          onCheckedChange={setAllowRotation}
        />
      </div>
    </div>
  )
}
