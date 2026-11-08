# VARA LUXE ESTATE — Luxury Built-in House Web Application

> **คฤหาสน์หรูระดับเวิลด์คลาส ตกแต่งบิ้วอินครบพร้อมเข้าอยู่โดยทีมผู้เชี่ยวชาญ**  
> ตราสัญลักษณ์ The Royal Stag Emblem (Option 01: Antler & Gable Roof V-Monogram)  
> โทนสี Clean Modern Light (ขาว – เทา – ฟ้า) สว่าง สะอาดตา หรูหรามีมิติ พร้อมฟังก์ชันเปิดใช้งานแบบ Offline 100%

---

## 🔖 เวอร์ชันปัจจุบัน (Current Version)
- **เวอร์ชัน**: `v1.4.0 (VARA LUXE ESTATE Brand Identity Transition & Option 01 Royal Stag Logo)`
- **สถานะการอัปเดตล่าสุด**: 
  - เปลี่ยนชื่อแบรนด์โครงการอย่างเป็นทางการเป็น **VARA LUXE ESTATE** (โดยคุณวรโชติ / เดียร์)
  - ติดตั้งตราสัญลักษณ์ **Option 01: Royal Stag Crest (หัวกวาง & จั่วหลังคาบ้าน V-Monogram)** บน Header และ Favicon
  - ปรับปรุงการตัดคำของปุ่มคำนวณสินเชื่อและปุ่มส่งฟอร์มนัดหมายบนสมาร์ตโฟนให้กระชับ พอดีทุกขนาดหน้าจอ
  - ปรับเปลี่ยน LINE Official Account เป็น `@varaluxe.estate`
- **ลิงก์เข้าชมสดบน GitHub Pages**: [https://worachot33-boop.github.io/luxury-house-web/?v=20261109_varaluxe_v1_4_0](https://worachot33-boop.github.io/luxury-house-web/?v=20261109_varaluxe_v1_4_0)

---

## 🌟 ฟีเจอร์เด่นของระบบ (Key Features)

1. **Panoramic Hero Stage**: ภาพปกคฤหาสน์มุมกว้างเต็มตา 100% พร้อมข้อความหัวข้อคมชัด
2. **Luxury Built-in Gallery**: แกลเลอรีภาพถ่ายงานจริง 8 มุมมอง (Edge-to-Edge) พร้อมฟังก์ชัน Lightbox ดูภาพขยายความละเอียดสูง
3. **Property Catalog & Filters**: ตัวกรองค้นหาตามรหัสแปลง, งบประมาณ, สถานะแปลงบ้าน และจำนวนห้องนอน
4. **Interactive Floor Plans**: สลับดูแปลนบ้าน ชั้น 1 และ ชั้น 2 พร้อมสเปกวัสดุงานบิ้วอินรายห้อง
5. **Smart Mortgage Calculator**: โปรแกรมคำนวณเงินดาวน์และยอดผ่อนต่อเดือนอัตโนมัติ สไตล์ Clean Modern Light มีมิติ
6. **VIP Private Viewing Booking**: ฟอร์มนัดหมายเข้าชมโครงการแบบส่วนตัว ตรวจสอบเบอร์โทรและวันที่ล่วงหน้า
7. **Admin CMS & CSV Export**: ระบบหลังบ้านสำหรับฝ่ายขาย (รหัสผ่านเริ่มต้น `8899`) ปรับสถานะแปลงบ้านแบบเรียลไทม์ และส่งออกรายชื่อลูกค้าเป็นไฟล์ Excel/CSV ภาษาไทยสมบูรณ์ (`\uFEFF` UTF-8 BOM)
8. **100% Offline Compatible & Zero CORS**: รองรับทั้งเปิดบนเว็บเซิร์ฟเวอร์ และเปิดไฟล์ตรงผ่าน `file:///` ได้โดยไม่พึ่งพาอินเทอร์เน็ตภายนอก

---

## 📱 วิธีเปิดใช้งาน (Getting Started)

### 1. เปิดดูออนไลน์ผ่าน GitHub Pages (บนมือถือหรือคอมพิวเตอร์)
- เข้าชมได้ทันทีที่: [https://worachot33-boop.github.io/luxury-house-web/](https://worachot33-boop.github.io/luxury-house-web/)
- หรือเปิดผ่านลิงก์บังคับรีเฟรชแคช: [https://worachot33-boop.github.io/luxury-house-web/?v=20261108_v1_3_0](https://worachot33-boop.github.io/luxury-house-web/?v=20261108_v1_3_0)

### 2. เปิดใช้งานผ่านเครื่องส่วนกลางหน้างาน (Sales Gallery Local Server)
- ดับเบิลคลิกไฟล์ `start_offline.bat`
- เข้าใช้งานผ่านเบราว์เซอร์: `http://localhost:4001/`

---

## 📋 ประวัติการปรับปรุงเวอร์ชัน (Version Changelog)
- **v1.3.0** (2026-11-08):
  - ปรับเลย์เอาต์หน้าแรก (Hero Stage) แสดงภาพปก Panoramic เต็มความกว้าง 100% และหัวข้อกึ่งกลาง 2 บรรทัด
  - เพิ่ม Section แกลเลอรีบิ้วอินหรูหรา 8 ภาพ (2 แถว × 4 คอลัมน์) สไตล์ Edge-to-Edge พร้อมระบบ Full-size Lightbox Modal
  - ปรับปรุงโทนสีของการ์ดคำนวณสินเชื่อและแผงสิทธิพิเศษนัดหมายเป็น **Clean Modern Light (ขาว – เทา – ฟ้า)** สว่าง สะอาดตา และมีเงา Dimension
  - ปรับเอฟเฟกต์เมนูแถบ Header เมื่อนำเมาส์ชี้ให้มีพื้นหลังสีฟ้าอ่อนนุ่มนวล
  - นำตัวเลขช่วงราคาออกจากหัวข้อและดรอปดาวน์ตัวกรองตามคำขอ
  - จัดการแสดงผลหัวข้อทำเลให้อยู่ในบรรทัดเดียวกัน
  - อัปเดต Cache Buster เป็น `20261108_v1_3_0`
- **v1.2.0** (2026-11-08):
  - เปลี่ยนชื่อโครงการเป็น **HAVEN LUXE ESTATE**
  - อัปเดต Brand Crest ในแถบ Header เป็นอักษรย่อ **"H"**
  - อัปเดต `favicon.svg` ไอคอนแท็บเบราว์เซอร์เป็นตราประทับอักษรย่อ **"H"**
  - อัปเดต LINE Official Account เป็น `@havenluxe.estate`
  - อัปเดตชื่อไฟล์ส่งออก CSV ของฝ่ายขายเป็น `HAVEN_LUXE_VIP_Leads_YYYYMMDD.csv`
  - อัปเดต Schema.org JSON-LD และ Open Graph Title/Description เป็น HAVEN LUXE ESTATE
  - อัปเดต Cache Buster เป็น `20261108_haven_luxe_v1`
- **v1.1.0** (2026-11-08):
  - แก้ไข Horizontal Overflow บนมือถือ (เพิ่ม `overflow-x: hidden; width: 100%;`)
  - ซ่อนปุ่ม "สำหรับฝ่ายขาย" ออกจาก Header แถวบนของจอมือถือ และย้ายเข้าไปอยู่ในเมนู `☰`
  - ปรับ Header บนจอมือถือให้มีเฉพาะ Logo + ปุ่มนัดชม VIP + ปุ่ม `☰`
  - ปรับปุ่ม Hero CTA ให้จัดเรียงแนวตั้งและตัดบรรทัดได้ ไม่ดันหน้าจอ
  - ปรับแต่ง Floating CTA ด้านล่างให้พอดีกับหน้าจอมือถือ
  - อัปเดต Cache Buster ทุกสคริปต์เป็น `20261108_mobile_v1`
- **v1.0.0** (2026-11-08):
  - Initial Release เปิดตัวโครงการสถาปัตยกรรม Clean Web Architecture Offline 100%


