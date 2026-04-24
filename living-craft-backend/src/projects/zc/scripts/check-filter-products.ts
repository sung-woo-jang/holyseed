import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 쿠키 설정
  await page.setCookie({
    name: 'GD5SESSID',
    value: process.env.DASIS_COOKIE_GD5SESSID || '',
    domain: 'www.dasis.co.kr',
  });

  // 비데일체형 카테고리 페이지
  const url = 'https://www.dasis.co.kr/goods/goods_list.php?cateCd=002001';
  console.log(`\n페이지 접속: ${url}\n`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const html = await page.content();
  const $ = cheerio.load(html);

  console.log('=== 비데일체형 카테고리 제품 분석 ===\n');

  let count = 0;
  $('.item_basket_type li .item_cont').each((index, element) => {
    const $el = $(element);

    const detailLink = $el.find('a[href*="goodsNo="]').first().attr('href') || '';
    const goodsNoMatch = detailLink.match(/goodsNo=(\d+)/);
    const goodsNo = goodsNoMatch ? goodsNoMatch[1] : '';

    const name = $el.find('.item_name').text().trim();

    // 제품명 전체 분석
    console.log(`[${index + 1}] ${name}`);
    console.log(`    goodsNo: ${goodsNo}`);

    // 괄호 안 텍스트 확인
    const bracketMatches = name.match(/\(([^)]+)\)/g);
    if (bracketMatches) {
      console.log(`    괄호 안 텍스트: ${bracketMatches.join(', ')}`);
    }

    // 영문+숫자 조합 찾기
    const alphanumericMatches = name.match(/[A-Z]{1,}[-]?[0-9]{2,}[A-Z0-9]*/gi);
    if (alphanumericMatches) {
      console.log(`    영문+숫자 패턴: ${alphanumericMatches.join(', ')}`);
    }

    console.log('');
    count++;
  });

  console.log(`\n총 ${count}개 제품 발견`);

  await browser.close();
})();
