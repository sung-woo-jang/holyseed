import { Image } from '@granite-js/react-native';
import { usePhotoManager } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset } from '@toss/tds-react-native';
import { ImageState } from '@types';
import { ImageStyle, Pressable, StyleSheet, Text, View } from 'react-native';

interface PhotoSectionProps {
  photos: ImageState[];
  onChange: (photos: ImageState[]) => void;
  maxCount?: number;
}

export function PhotoSection({ photos, onChange, maxCount = 5 }: PhotoSectionProps) {
  const { capturePhoto, selectFromAlbum, deletePhoto, canAddMore } = usePhotoManager({
    photos,
    onChange,
    maxCount,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진</Text>
        <Text style={styles.subtitle}>
          사진을 첨부해주세요 ({photos.length}/{maxCount})
        </Text>
      </View>

      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.previewUri }} style={styles.photo as any} />
              <Pressable style={styles.deleteButton} onPress={() => deletePhoto(photo.id)}>
                <Text style={styles.deleteButtonText}>X</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {canAddMore && (
        <View style={styles.buttonContainer}>
          <Pressable style={styles.actionButton} onPress={capturePhoto}>
            <Asset.Icon name="icon-camera" frameShape={Asset.frameShape.CleanW40} />
            <Text style={styles.actionButtonText}>촬영하기</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={selectFromAlbum}>
            <Asset.Icon name="icon-picture" frameShape={Asset.frameShape.CleanW40} />
            <Text style={styles.actionButtonText}>앨범에서 선택</Text>
          </Pressable>
        </View>
      )}

      {!canAddMore && (
        <View style={styles.maxCountNotice}>
          <Text style={styles.maxCountText}>최대 {maxCount}장까지 추가할 수 있어요</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey600,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.grey100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 100,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey700,
  },
  maxCountNotice: {
    paddingHorizontal: 8,
  },
  maxCountText: {
    fontSize: 13,
    color: colors.grey500,
    textAlign: 'center',
  },
});
