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

  // 일반헤드 카테고리 페이지
  const url = 'https://www.dasis.co.kr/goods/goods_list.php?cateCd=001001';
  console.log(`\n페이지 접속: ${url}\n`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const html = await page.content();
  const $ = cheerio.load(html);

  console.log('=== 제품 리스트 분석 ===\n');

  let count = 0;
  $('.item_basket_type li .item_cont').each((index, element) => {
    const $el = $(element);

    const detailLink = $el.find('a[href*="goodsNo="]').first().attr('href') || '';
    const goodsNoMatch = detailLink.match(/goodsNo=(\d+)/);
    const goodsNo = goodsNoMatch ? goodsNoMatch[1] : '';

    const name = $el.find('.item_name').text().trim();
    const brandName = $el.find('.item_brand strong').text().trim();

    const priceElement = $el.find('.item_price');
    const priceText = priceElement.text().trim();
    const delPrice = priceElement.find('del').text().replace(/[^0-9]/g, '');
    const currentPriceText = priceElement.text().replace(/[^0-9]/g, '');

    let price = 0;
    let discountPrice: number | undefined = undefined;

    if (delPrice) {
      price = parseInt(delPrice, 10) || 0;
      discountPrice = parseInt(currentPriceText.replace(delPrice, ''), 10) || 0;
    } else {
      price = parseInt(currentPriceText, 10) || 0;
    }

    // Sold out 확인
    const isSoldOut = $el.find('.soldout, .item_soldout').length > 0 ||
                      $el.text().toLowerCase().includes('sold out');

    count++;
    console.log(`[${count}] ${name}`);
    console.log(`    goodsNo: ${goodsNo}`);
    console.log(`    브랜드: ${brandName}`);
    console.log(`    가격: ${price} / 할인가: ${discountPrice || '없음'}`);
    console.log(`    Sold Out: ${isSoldOut}`);
    console.log(`    가격 텍스트: ${priceText.slice(0, 80)}`);
    console.log('');
  });

  console.log(`\n총 ${count}개 제품 발견`);

  // 페이지네이션 확인
  const paginationLinks = await page.$$('.pagination a');
  console.log(`페이지네이션 링크 수: ${paginationLinks.length}`);

  await browser.close();
})();
