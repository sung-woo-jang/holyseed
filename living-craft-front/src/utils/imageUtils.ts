/**
 * Base64 Data URI를 Blob으로 변환
 *
 * @note React Native 환경에서는 직접 사용하지 않고 FormData에 uri를 직접 전달합니다.
 * 이 함수는 웹 환경에서의 호환성을 위해 유지됩니다.
 */
export function dataUriToBlob(dataUri: string): any {
  const splitDataUri = dataUri.split(',');
  const mimeMatch = splitDataUri[0]?.match(/:(.*?);/);

  if (!mimeMatch) {
    throw new Error('Invalid Data URI format');
  }

  const mime = mimeMatch[1]!;
  const base64Data = splitDataUri[1]!;

  if (!base64Data) {
    throw new Error('No base64 data found in Data URI');
  }

  // Base64 디코드
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // React Native에서는 Blob이 다르게 동작할 수 있어 any로 반환
  return new Blob([bytes as any], { type: mime } as any);
}

/**
 * ImageState 배열을 FormData로 변환
 */
export function createPhotoFormData(
  photos: Array<{ id: string; previewUri: string }>,
): FormData {
  const formData = new FormData();

  photos.forEach((photo: { id: string; previewUri: string }, index: number) => {
    // React Native에서는 파일 객체 형식으로 전달
    formData.append('photos', {
      uri: photo.previewUri,
      type: 'image/jpeg',
      name: `photo_${index}.jpg`,
    } as any);
  });

  return formData;
}
