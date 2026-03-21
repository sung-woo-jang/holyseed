import { COMPANY_INFO } from '@constants';
import { colors } from '@toss/tds-colors';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Footer: React.FC = () => {
  const handlePhonePress = () => {
    Linking.openURL(`tel:${COMPANY_INFO.contact.phone}`);
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${COMPANY_INFO.contact.email}`);
  };

  const handleSNSPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* 1. 회사 정보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
        <Text style={styles.infoText}>사업자등록번호: {COMPANY_INFO.businessNumber}</Text>
        <Text style={styles.infoText}>대표: {COMPANY_INFO.representative}</Text>
        <Text style={styles.infoText}>{COMPANY_INFO.address}</Text>
      </View>

      {/* 2. 연락처 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>연락처</Text>
        <TouchableOpacity onPress={handlePhonePress} accessibilityLabel="전화 걸기">
          <Text style={styles.linkText}>📞 {COMPANY_INFO.contact.phone}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEmailPress} accessibilityLabel="이메일 보내기">
          <Text style={styles.linkText}>✉️ {COMPANY_INFO.contact.email}</Text>
        </TouchableOpacity>
        <Text style={styles.infoText}>{COMPANY_INFO.contact.businessHours}</Text>
      </View>

      {/* 3. SNS 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>소셜 미디어</Text>
        <View style={styles.snsContainer}>
          <TouchableOpacity
            onPress={() => handleSNSPress(COMPANY_INFO.sns.instagram)}
            accessibilityLabel="인스타그램"
          >
            <Text style={styles.linkText}>📷 Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSNSPress(COMPANY_INFO.sns.blog)} accessibilityLabel="블로그">
            <Text style={styles.linkText}>📝 Blog</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSNSPress(COMPANY_INFO.sns.kakao)} accessibilityLabel="카카오톡">
            <Text style={styles.linkText}>💬 KakaoTalk</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. 법적 링크 섹션 */}
      <View style={styles.section}>
        <View style={styles.legalContainer}>
          <Text style={styles.legalLink}>개인정보 처리방침</Text>
          <Text style={styles.legalDivider}>|</Text>
          <Text style={styles.legalLink}>이용약관</Text>
        </View>
      </View>

      {/* 5. 저작권 섹션 */}
      <View style={styles.copyrightSection}>
        <Text style={styles.copyright}>{COMPANY_INFO.copyright}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grey900,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.grey100,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey300,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.grey400,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 13,
    color: colors.grey100,
    lineHeight: 28,
    minHeight: 44,
  },
  snsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLink: {
    fontSize: 13,
    color: colors.grey400,
  },
  legalDivider: {
    fontSize: 13,
    color: colors.grey600,
    marginHorizontal: 12,
  },
  copyrightSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 11,
    color: colors.grey500,
    textAlign: 'center',
  },
});
