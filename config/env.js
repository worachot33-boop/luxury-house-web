const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

module.exports = {
  PORT: Number(process.env.PORT) || 4001,
  ROOT_DIR,
  DB_PATH: process.env.DB_PATH || path.join(ROOT_DIR, 'db', 'luxury_houses.db'),
  SCHEMA_PATH: path.join(ROOT_DIR, 'db', 'schema.sql'),
  DATA_EXCEL_DIR: path.join(ROOT_DIR, 'data_excel'),
  ADMIN_PASSCODE: process.env.ADMIN_PASSCODE || '8899',
  PROJECT_BRAND: {
    name: 'HAVEN LUXE ESTATE',
    thaiSubtitle: 'โครงการบ้านเดี่ยวหรู ตกแต่งบิ้วอินครบพร้อมเข้าอยู่',
    priceRangeText: '8.9 – 19.5 ล้านบาท',
    phone: '02-889-9900',
    lineId: '@havenluxe.estate',
    locationName: 'วัชรพล – ด่านจตุโชติ (ใกล้ทางด่วนฉลองรัช & วงแหวนตะวันออก)'
  }
};

