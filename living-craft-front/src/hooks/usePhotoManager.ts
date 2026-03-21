import { fetchAlbumPhotos, ImageResponse, openCamera } from '@apps-in-toss/framework';

import { usePermissionGate } from './usePermissionGate';

export interface ImageState extends ImageResponse {
  previewUri: string;
}

interface UsePhotoManagerProps {
  photos: ImageState[];
  onChange: (photos: ImageState[]) => void;
  maxCount?: number;
  base64?: boolean;
}

interface UsePhotoManagerReturn {
  photos: ImageState[];
  capturePhoto: () => Promise<void>;
  selectFromAlbum: () => Promise<void>;
  deletePhoto: (id: string) => void;
  canAddMore: boolean;
  remainingCount: number;
}

export function usePhotoManager({
  photos,
  onChange,
  maxCount = 5,
  base64 = true,
}: UsePhotoManagerProps): UsePhotoManagerReturn {
  const cameraPermissionGate = usePermissionGate({
    getPermission: () => openCamera.getPermission(),
    openPermissionDialog: () => openCamera.openPermissionDialog(),
  });

  const albumPermissionGate = usePermissionGate({
    getPermission: () => fetchAlbumPhotos.getPermission(),
    openPermissionDialog: () => fetchAlbumPhotos.openPermissionDialog(),
  });

  const canAddMore = photos.length < maxCount;
  const remainingCount = maxCount - photos.length;

  const capturePhoto = async () => {
    if (!canAddMore) return;

    try {
      const response = await cameraPermissionGate.ensureAndRun(() => openCamera({ base64, maxWidth: 1080 }));

      if (!response) return;

      const newImage: ImageState = {
        ...response,
        previewUri: base64 ? `data:image/jpeg;base64,${response.dataUri}` : response.dataUri,
      };

      onChange([...photos, newImage]);
    } catch (error) {
      console.error('카메라를 불러오는 데 실패했어요:', error);
    }
  };

  const selectFromAlbum = async () => {
    if (!canAddMore) return;

    try {
      const response = await albumPermissionGate.ensureAndRun(() =>
        fetchAlbumPhotos({ maxCount: remainingCount, maxWidth: 1080, base64 })
      );

      if (!response || response.length === 0) return;

      const newImages: ImageState[] = response.map((img) => ({
        ...img,
        previewUri: base64 ? `data:image/jpeg;base64,${img.dataUri}` : img.dataUri,
      }));

      const combinedPhotos = [...photos, ...newImages].slice(0, maxCount);
      onChange(combinedPhotos);
    } catch (error) {
      console.error('앨범을 가져오는 데 실패했어요:', error);
    }
  };

  const deletePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
  };

  return {
    photos,
    capturePhoto,
    selectFromAlbum,
    deletePhoto,
    canAddMore,
    remainingCount,
  };
}
