# HAVEN LUXE ESTATE — Luxury Built-in House Web Application

> **โครงการบ้านเดี่ยวหรู ตกแต่งบิ้วอินครบพร้อมเข้าอยู่ (ระดับราคา 8.9 – 19.5 ล้านบาท)**  
> โทนสี Warm Luxury (ขาวครีม – ทองแชมเปญ) พร้อมฟังก์ชันเปิดใช้งานแบบ Offline 100%

---

## 🔖 เวอร์ชันปัจจุบัน (Current Version)
- **เวอร์ชัน**: `v1.2.0 (Brand Renaming to Haven Luxe Estate)`
- **สถานะการอัปเดตล่าสุด**: เปลี่ยนชื่อแบรนด์โครงการอย่างเป็นทางการเป็น **HAVEN LUXE ESTATE** อัปเดตโลโก้ Crest ตราสัญลักษณ์เป็นตัวอักษร **"H"** สีทองแชมเปญ, อัปเดต Favicon, LINE OA (`@havenluxe.estate`), Metadata SEO และ Cache Buster เป็น `20261108_haven_luxe_v1`
- **ลิงก์เข้าชมสด**: [https://worachot33-boop.github.io/luxury-house-web/?v=20261108_haven_luxe_v1](https://worachot33-boop.github.io/luxury-house-web/?v=20261108_haven_luxe_v1)

---

## 🌟 ฟีเจอร์เด่นของระบบ (Key Features)

1. **Before / After Comparison Slider**: เลื่อนสไลเดอร์เปรียบเทียบห้องจริง *"บ้านเปล่าส่งมอบ vs บ้านบิ้วอินพร้อมอยู่"* ในมุมมองเดียวกัน
2. **Property Catalog & Filters**: ตัวกรองค้นหาตามงบประมาณ (8–12 ลบ. / 12–16 ลบ. / 16–20 ลบ.), สถานะแปลงบ้าน (พร้อมอยู่ / จองแล้ว / ขายแล้ว) และจำนวนห้องนอน
3. **Interactive Floor Plans**: สลับดูแปลนบ้าน ชั้น 1 และ ชั้น 2 พร้อมสเปกวัสดุงานบิ้วอินรายห้อง
4. **Smart Mortgage Calculator**: โปรแกรมคำนวณเงินดาวน์และยอดผ่อนต่อเดือนอัตโนมัติ อ้างอิงตามเกณฑ์ LTV ธปท.
5. **VIP Private Viewing Booking**: ฟอร์มนัดหมายเข้าชมโครงการแบบส่วนตัว ตรวจสอบเบอร์โทรและวันที่ล่วงหน้า
6. **Admin CMS & CSV Export**: ระบบหลังบ้านสำหรับฝ่ายขาย (รหัสผ่านเริ่มต้น `8899`) เพื่อปรับสถานะแปลงบ้านแบบเรียลไทม์ และส่งออกรายชื่อลูกค้าเป็นไฟล์ Excel/CSV ภาษาไทยสมบูรณ์ (`\uFEFF` UTF-8 BOM)
7. **Mobile-First Responsive Layout**: รองรับการเปิดบนสมาร์ตโฟนทุกขนาดหน้าจอ (iOS & Android) เต็มจอ 100% ไม่มีแถบเลื่อนแนวนอนกวนใจ

---

## 📱 วิธีเปิดใช้งาน (Getting Started)

### 1. เปิดดูออนไลน์ผ่าน GitHub Pages (บนมือถือหรือคอมพิวเตอร์)
- เข้าชมได้ทันทีที่: [https://worachot33-boop.github.io/luxury-house-web/](https://worachot33-boop.github.io/luxury-house-web/)
- หรือเปิดผ่านลิงก์บังคับรีเฟรชแคช: [https://worachot33-boop.github.io/luxury-house-web/?v=20261108_haven_luxe_v1](https://worachot33-boop.github.io/luxury-house-web/?v=20261108_haven_luxe_v1)

### 2. เปิดใช้งานผ่านเครื่องส่วนกลางหน้างาน (Sales Gallery Local Server)
- ดับเบิลคลิกไฟล์ `start_offline.bat`
- เข้าใช้งานผ่านเบราว์เซอร์: `http://localhost:4001/`
- หรือเปิดบนมือถือผ่าน Wi-Fi เดียวกันตาม IP ที่ระบบแจ้งในคอนโซล (เช่น `http://192.168.1.40:4001/`)

---

## 📋 ประวัติการปรับปรุงเวอร์ชัน (Version Changelog)
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


