import { fixupPluginRules } from '@eslint/compat'; // 플러그인 규칙 호환성 문제 해결용
import js from '@eslint/js'; // ESLint 기본 JS 룰셋
import tanstackPlugin from '@tanstack/eslint-plugin-query'; // TanStack Query 모범 사례 강제용
import tsPlugin from '@typescript-eslint/eslint-plugin'; // TS 특화 린팅 규칙 제공
import tsParser from '@typescript-eslint/parser'; // TS 코드 파싱 가능한 ESLint 파서를 가져옴
import eslintPluginImport from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier'; // Prettier랑 ESLint를 통합하는 플러그인
import reactPlugin from 'eslint-plugin-react'; // react 코드에 특화된 린팅
import reactHooksPlugin from 'eslint-plugin-react-hooks'; // react hooks 사용에 관한 규칙 제공
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort'; // import문 자동 정렬
import globals from 'globals'; // 전역 변수 목록 정의
import typescriptEslint from 'typescript-eslint';

// 플러그인 호환성 패치 적용
const patchedReactHooksPlugin = fixupPluginRules(reactHooksPlugin);
const patchedImportPlugin = fixupPluginRules(eslintPluginImport);

// 기본 ESLint 설정
const baseESLintConfig = {
  name: 'base', // 설정의 이름 지정. 디버깅 시 어떤 설정이 적용되었는지 식별용
  extends: [js.configs.recommended], // ESLint 권장 규칙 상속
  plugins: {
    'simple-import-sort': simpleImportSort, // import 정렬 플러그인
    prettier: prettierPlugin, // prettier xhdgkq vmffjrmdls
  },
  rules: {
    'no-unused-vars': 'off', // 사용하지 않는 변수 경고 (TypeScript에서 처리하기 위해 off 처리).
    'simple-import-sort/imports': 'error', // import 문 정렬 규칙을 강제
    'simple-import-sort/exports': 'error', // export 문 정렬 규칙을 강제
    // 추가한 규칙
    'no-await-in-loop': 'warn', // 루프 내에서의 await 사용에 대한 경고
    'require-atomic-updates': 'error', // 비동기 콜백에서 참조 변수 업데이트 시 원자성 보장
    'no-promise-executor-return': 'error', // Promise 생성자 내에서 값 반환 금지
    'no-constant-binary-expression': 'warn', // 항상 같은 결과가 나오는 이항 표현식 경고
    'no-self-compare': 'warn', // 자기 자신과의 비교 경고
    'no-template-curly-in-string': 'warn', // 일반 문자열에서 템플릿 리터럴 문법 사용 경고
  },
};

// TypeScript 설정
const typescriptConfig = {
  name: 'typescript',
  plugins: {
    '@typescript-eslint': tsPlugin, // TS 린팅 플러그인 활성화
    import: patchedImportPlugin,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error', // 사용하지 않는 변수 오류 처리
  },
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    globals: {
      ...globals.browser,
      ...globals.node,
      naver: 'readonly',
      __DEV__: 'readonly', // React Native 전역 변수
    },
  },
};

// React 설정
const reactConfig = {
  name: 'react',
  extends: [reactPlugin.configs.flat['jsx-runtime']], // React JSX Runtime 구성 상속
  plugins: {
    'react-hooks': patchedReactHooksPlugin,
    'react-refresh': eslintPluginReactRefresh,
    // import 순서 규칙 설정
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', ['parent', 'sibling'], 'index'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
  },
  rules: {
    ...patchedReactHooksPlugin.configs.recommended.rules,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
  },
  settings: {
    react: { version: '18.3.1' },
  },
};

// TanStack Query 설정
const tanstackQueryConfig = {
  name: 'tanstack-query',
  extends: [...tanstackPlugin.configs['flat/recommended']], // TanStack Query 플러그인의 권장 설정 상속
  rules: {
    '@tanstack/query/exhaustive-deps': 'error',
  },
};

// 공통 파일 패턴 및 무시할 파일 설정
const filePatterns = {
  files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], // ESLint가 검사할 파일의 패턴
};

// 디렉토리 무시 설정을 별도의 첫 번째 항목으로 추가
const ignorePatterns = {
  ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.js', '!**/eslint.config.js', '**/.granite/**'],
};

const eslintConfig = typescriptEslint.config(
  baseESLintConfig,
  typescriptConfig,
  tanstackQueryConfig,
  reactConfig,
  filePatterns,
  ignorePatterns,
);

// 최종 설정 내보내기
export default eslintConfig;
