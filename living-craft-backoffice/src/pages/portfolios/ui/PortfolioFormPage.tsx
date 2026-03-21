import { Controller, FormProvider } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useFetchPortfolioDetail,
  useCreatePortfolio,
  useUpdatePortfolio,
} from '@/features/portfolios/api'
import {
  usePortfolioFormPage,
  PORTFOLIO_CATEGORY_OPTIONS,
  DURATION_OPTIONS,
  type PortfolioFormValues,
} from '@/features/portfolios/model'
import { ImageUploader } from '@/features/portfolios/ui/image-uploader'
import { TagInput } from '@/features/portfolios/ui/tag-input'
import { useFetchServicesList } from '@/features/services/api'
import styles from './PortfolioFormPage.module.scss'

export function PortfolioFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  // 수정 모드일 때 포트폴리오 상세 데이터 조회
  const { data: portfolioResponse, isLoading } = useFetchPortfolioDetail(id)
  const portfolioDetail = portfolioResponse?.data

  // 서비스 목록 조회 (드롭다운용)
  const { data: servicesResponse } = useFetchServicesList()
  const services = servicesResponse?.data

  // 폼 훅
  const form = usePortfolioFormPage({
    portfolioDetail,
    isLoading,
  })

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form

  // 뮤테이션 훅
  const createPortfolio = useCreatePortfolio()
  const updatePortfolio = useUpdatePortfolio()

  const onSubmit = async (data: PortfolioFormValues) => {
    try {
      // 이미지 검증: 생성 시에는 최소 1개 필요
      const totalImages =
        (data.existingImages?.length ?? 0) + (data.newImages?.length ?? 0)
      if (totalImages === 0) {
        form.setError('newImages', {
          type: 'manual',
          message: '최소 1개 이상의 이미지가 필요합니다.',
        })
        return
      }

      if (isEditMode && id) {
        await updatePortfolio.mutateAsync({
          id,
          data: {
            category: data.category,
            projectName: data.projectName,
            client: data.client || undefined,
            duration: data.duration,
            description: data.description,
            detailedDescription: data.detailedDescription,
            tags: data.tags,
            relatedServiceId: data.relatedServiceId,
            newImages: data.newImages,
          },
        })
      } else {
        await createPortfolio.mutateAsync({
          category: data.category,
          projectName: data.projectName,
          client: data.client || undefined,
          duration: data.duration,
          description: data.description,
          detailedDescription: data.detailedDescription,
          tags: data.tags,
          relatedServiceId: data.relatedServiceId,
          images: data.newImages || [],
        })
      }
      navigate('/portfolios')
    } catch {
      // 에러는 mutation hook에서 toast로 처리
    }
  }

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)()
  }

  const handleCancel = () => {
    navigate('/portfolios')
  }

  const isPending = createPortfolio.isPending || updatePortfolio.isPending

  // 로딩 상태
  if (isEditMode && isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>포트폴리오 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <FormProvider {...form}>
        {/* 페이지 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {isEditMode ? '포트폴리오 수정' : '새 포트폴리오 추가'}
            </h1>
            <p className={styles.description}>
              {isEditMode
                ? '포트폴리오 정보를 수정합니다.'
                : '새로운 포트폴리오를 추가합니다. 필수 항목(*)을 모두 입력해주세요.'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type='button'
              onClick={handleFormSubmit}
              disabled={isPending}
            >
              {isPending ? '저장 중...' : isEditMode ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </div>

        {/* 폼 본문 */}
        <div className={styles.formBody}>
          <div className={styles.form}>
            {/* 2단 레이아웃: 기본 정보 + 분류 */}
            <div className={styles.formGrid}>
              {/* 기본 정보 */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>기본 정보</h3>

                <FieldGroup>
                  <Controller
                    name='category'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='category'>
                          카테고리{' '}
                          <span className={styles.labelRequired}>*</span>
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id='category'>
                            <SelectValue placeholder='카테고리 선택' />
                          </SelectTrigger>
                          <SelectContent>
                            {PORTFOLIO_CATEGORY_OPTIONS.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name='projectName'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='projectName'>
                          프로젝트명{' '}
                          <span className={styles.labelRequired}>*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id='projectName'
                          placeholder='예: 강남 카페 인테리어'
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className={styles.fieldRow}>
                    <Controller
                      name='client'
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='client'>고객사</FieldLabel>
                          <Input
                            {...field}
                            id='client'
                            value={field.value ?? ''}
                            placeholder='예: 카페 이름'
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldDescription>선택사항</FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name='duration'
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='duration'>
                            작업 기간{' '}
                            <span className={styles.labelRequired}>*</span>
                          </FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id='duration'>
                              <SelectValue placeholder='작업 기간 선택' />
                            </SelectTrigger>
                            <SelectContent>
                              {DURATION_OPTIONS.map((dur) => (
                                <SelectItem key={dur} value={dur}>
                                  {dur}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </div>

              {/* 분류 */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>분류</h3>

                <FieldGroup>
                  <Controller
                    name='relatedServiceId'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='relatedServiceId'>
                          관련 서비스{' '}
                          <span className={styles.labelRequired}>*</span>
                        </FieldLabel>
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <SelectTrigger id='relatedServiceId'>
                            <SelectValue placeholder='서비스 선택' />
                          </SelectTrigger>
                          <SelectContent>
                            {services?.map((service) => (
                              <SelectItem
                                key={service.id}
                                value={String(service.id)}
                              >
                                {service.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name='tags'
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor='tags'>태그</FieldLabel>
                        <TagInput
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder='태그 입력 후 Enter'
                        />
                        <FieldDescription>
                          작업 유형, 재료 등을 태그로 추가하세요
                        </FieldDescription>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>
            </div>

            {/* 전체 너비: 설명 */}
            <div className={styles.formFullWidth}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>설명</h3>

                <FieldGroup>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='description'>
                          간단 설명{' '}
                          <span className={styles.labelRequired}>*</span>
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id='description'
                          rows={3}
                          placeholder='한 줄로 프로젝트를 설명해주세요'
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name='detailedDescription'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='detailedDescription'>
                          상세 설명{' '}
                          <span className={styles.labelRequired}>*</span>
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id='detailedDescription'
                          rows={6}
                          placeholder='프로젝트에 대한 상세 설명을 입력해주세요'
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>
            </div>

            {/* 전체 너비: 이미지 */}
            <div className={styles.formFullWidth}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  이미지 <span className={styles.labelRequired}>*</span>
                </h3>
                <ImageUploader
                  existingImages={watch('existingImages') ?? []}
                  newImages={watch('newImages') ?? []}
                  onExistingImagesChange={(images) =>
                    setValue('existingImages', images)
                  }
                  onNewImagesChange={(files) => setValue('newImages', files)}
                  maxImages={10}
                />
                {errors.newImages && (
                  <p className={styles.errorText}>
                    {errors.newImages.message ||
                      '최소 1개 이상의 이미지가 필요합니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className={styles.footer}>
          <Button
            type='button'
            variant='outline'
            onClick={handleCancel}
            disabled={isPending}
          >
            취소
          </Button>
          <Button type='button' onClick={handleFormSubmit} disabled={isPending}>
            {isPending ? '저장 중...' : isEditMode ? '수정하기' : '추가하기'}
          </Button>
        </div>
      </FormProvider>
    </div>
  )
}
