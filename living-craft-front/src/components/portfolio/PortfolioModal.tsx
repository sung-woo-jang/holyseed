import { Image } from '@granite-js/react-native';
import { colors } from '@toss/tds-colors';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PortfolioModalProps {
  visible: boolean;
  onClose: () => void;
  portfolio?: {
    id: string;
    title: string;
    category: string;
    description: string;
    imageUrl: string;
    details: string;
  };
}

/**
 * 포트폴리오 상세 모달
 * 포트폴리오 아이템의 상세 정보를 표시
 */
export const PortfolioModal = ({ visible, onClose, portfolio }: PortfolioModalProps) => {
  if (!portfolio) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>포트폴리오 상세</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <Image
            source={{ uri: portfolio.imageUrl }}
            style={styles.mainImage}
            onError={() => {
              console.warn(`Failed to load modal main image: ${portfolio.id}`);
            }}
          />

          <View style={styles.info}>
            <Text style={styles.category}>{portfolio.category}</Text>
            <Text style={styles.title}>{portfolio.title}</Text>
            <Text style={styles.description}>{portfolio.description}</Text>

            <View style={styles.divider} />

            <Text style={styles.detailsTitle}>프로젝트 상세</Text>
            <Text style={styles.details}>{portfolio.details}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.grey700,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey900,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.grey200,
  },
  info: {
    padding: 20,
  },
  category: {
    fontSize: 13,
    color: colors.blue500,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.grey700,
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey200,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 12,
  },
  details: {
    fontSize: 15,
    color: colors.grey700,
    lineHeight: 24,
  },
});
