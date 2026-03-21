import * as fs from 'fs';
import * as path from 'path';
import { IconType } from '@modules/icons/enums/icon-type.enum';

/**
 * 파싱된 아이콘 데이터 인터페이스
 */
export interface ParsedIcon {
  name: string;
  type: IconType;
}

/**
 * 아이콘 파일(.md)을 파싱하여 아이콘 목록 추출
 * @param filePath 아이콘 .md 파일 경로
 * @param type 아이콘 타입 (FILL, MONO, COLOR)
 * @returns 파싱된 아이콘 배열
 */
export function parseIconFile(filePath: string, type: IconType): ParsedIcon[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // ```text ... ``` 블록 내용 추출
    const match = content.match(/```text\n([\s\S]*?)\n```/);
    if (!match) {
      console.warn(`⚠️  No icon data found in ${filePath}`);
      return [];
    }

    const iconNames = match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('//'));

    console.log(
      `   📋 Parsed ${iconNames.length} icons from ${path.basename(filePath)}`,
    );

    return iconNames.map((name) => ({ name, type }));
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

/**
 * 모든 아이콘 파일을 파싱
 * @param frontendDocsPath 프론트엔드 docs 디렉토리 경로
 * @returns 모든 아이콘 데이터 배열
 */
export function parseAllIcons(frontendDocsPath: string): ParsedIcon[] {
  console.log(`📂 Parsing icons from: ${frontendDocsPath}`);

  const fillIcons = parseIconFile(
    path.join(frontendDocsPath, 'icons/fill.md'),
    IconType.FILL,
  );

  const monoIcons = parseIconFile(
    path.join(frontendDocsPath, 'icons/mono.md'),
    IconType.MONO,
  );

  const colorIcons = parseIconFile(
    path.join(frontendDocsPath, 'icons/colors.md'),
    IconType.COLOR,
  );

  const allIcons = [...fillIcons, ...monoIcons, ...colorIcons];

  console.log(`\n✅ Total parsed icons: ${allIcons.length}`);
  console.log(`   - FILL: ${fillIcons.length}개`);
  console.log(`   - MONO: ${monoIcons.length}개`);
  console.log(`   - COLOR: ${colorIcons.length}개\n`);

  return allIcons;
}
