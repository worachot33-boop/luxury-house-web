(function (window) {
  'use strict';

  var BRAND = {
    name: 'THE AURELIA RESIDENCE',
    thaiSubtitle: 'โครงการบ้านเดี่ยวหรู ตกแต่งบิ้วอินครบพร้อมเข้าอยู่',
    priceRangeText: '8.9 – 19.5 ล้านบาท',
    phone: '02-889-9900',
    lineId: '@aurelia.residence',
    locationName: 'วัชรพล – ด่านจตุโชติ (ใกล้ทางด่วนฉลองรัช & วงแหวนตะวันออก)'
  };

  var PROPERTIES = [
    {
      id: 1,
      plot_code: 'A-03',
      title: 'Villa Serene',
      slug: 'villa-serene-a03',
      subtitle: 'บ้านเดี่ยว 2 ชั้น ตกแต่งบิ้วอิน Warm Minimal ครบทุกห้อง หิ้วกระเป๋าเข้าอยู่ได้ทันที',
      price_thb: 8900000,
      usable_area_sqm: 225,
      land_sqw: 56.5,
      bedrooms: 3,
      bathrooms: 4,
      parking: 2,
      maid_rooms: 0,
      status: 'available',
      highlight_badge: 'พร้อมเข้าอยู่ทันที • ฟรีบิ้วอิน 1.5 ล้าน',
      builtin_style: 'Warm Ivory & Natural Oak',
      builtin_value_thb: 1500000,
      description:
        'บ้านเดี่ยวหลังเริ่มต้นของโครงการที่จัดเต็มงานบิ้วอินระดับโรงแรม 5 ดาว โถงรับแขกโปร่งสบายเชื่อมต่อสวนข้างบ้าน มาพร้อมชุดครัวฝรั่งท็อปหินควอตซ์และตู้เสื้อผ้า Walk-in Closet สูงจรดฝ้าในห้องนอนใหญ่',
      hero_image: 'assets/images/villa_serene_hero.jpg',
      before_image: 'assets/images/builtin_before_shell.jpg',
      after_image: 'assets/images/builtin_after_luxury.jpg',
      is_featured: true,
      builtin_features: [
        {
          id: 1,
          room_name: 'Grand Living & Dining',
          feature_detail: 'ผนังทีวีบิ้วอินกรุลายหินอ่อนครีมตัดคิ้วสแตนเลสสีทองแชมเปญ พร้อมไฟซ่อน Warm White รอบฝ้าหลุม',
          material_spec: 'โครงไม้กันชื้น HMR เกรด E1 ปลอดสารฟอร์มาลดีไฮด์ + ลามิเนตผิวสัมผัสธรรมชาติ',
          sort_order: 1
        },
        {
          id: 2,
          room_name: 'Pantry & Thai Kitchen',
          feature_detail: 'เคาน์เตอร์ไอส์แลนด์เตรียมอาหารพร้อมเตาไฟฟ้า เครื่องดูดควัน และครัวไทยแยกส่วนประตูกระจกบานเลื่อน',
          material_spec: 'ท็อปหิน Quartz กันรอยขีดข่วน + บานพับ Soft-Close แบรนด์ยุโรปทั้งหมด',
          sort_order: 2
        },
        {
          id: 3,
          room_name: 'Master Suite Walk-in Closet',
          feature_detail: 'ตู้เสื้อผ้าบิ้วอินบานกระจกสีชาทองสูงจรดฝ้า พร้อมโต๊ะเครื่องแป้งและไฟส่องสว่างอัตโนมัติในตู้',
          material_spec: 'เฟรมอะลูมิเนียมสี Champagne Anodized + กระจกนิรภัย Tinted Glass',
          sort_order: 3
        }
      ],
      floor_plans: [
        {
          id: 1,
          floor_number: 1,
          floor_label: 'ชั้น 1 (Ground Floor)',
          area_sqm: 115,
          room_summary: 'โถงรับแขกวิวสวน • โซนรับประทานอาหาร 6 ที่นั่ง • Pantry Island • ครัวไทยแยกส่วน • ห้องน้ำแขก • ที่จอดรถในร่ม 2 คัน',
          plan_image: 'assets/images/plan_f1_standard.svg'
        },
        {
          id: 2,
          floor_number: 2,
          floor_label: 'ชั้น 2 (Upper Floor)',
          area_sqm: 110,
          room_summary: 'Master Bedroom พร้อม Walk-in Closet และห้องน้ำในตัว • ห้องนอน 2 และ 3 พร้อมห้องน้ำในตัวทุกห้อง • มุมนั่งเล่นครอบครัว',
          plan_image: 'assets/images/plan_f2_standard.svg'
        }
      ]
    },
    {
      id: 2,
      plot_code: 'A-08',
      title: 'Villa Celeste',
      slug: 'villa-celeste-a08',
      subtitle: 'บ้านเดี่ยวแปลงมุม โถงเพดานสูง Double Volume 6.2 เมตร พร้อมห้องนอนชั้นล่างรองรับผู้สูงอายุ',
      price_thb: 12800000,
      usable_area_sqm: 295,
      land_sqw: 68.0,
      bedrooms: 4,
      bathrooms: 5,
      parking: 3,
      maid_rooms: 0,
      status: 'available',
      highlight_badge: 'แปลงมุมยอดนิยม • ฟรีบิ้วอิน 2.2 ล้าน',
      builtin_style: 'Champagne Gold & Cream Marble',
      builtin_value_thb: 2200000,
      description:
        'ออกแบบเพื่อครอบครัวขยายที่ต้องการความโอ่อ่าและฟังก์ชันครบครัน โดดเด่นด้วยโถงรับแขก Double Volume สูง 6.2 เมตร พร้อมโคมไฟระย้าคริสตัลสั่งทำพิเศษ และห้องนอนชั้นล่างที่ออกแบบทางเดินไร้ธรณีประตูเพื่อความปลอดภัยสูงสุด',
      hero_image: 'assets/images/villa_celeste_hero.jpg',
      before_image: 'assets/images/builtin_before_shell.jpg',
      after_image: 'assets/images/builtin_after_luxury.jpg',
      is_featured: true,
      builtin_features: [
        {
          id: 4,
          room_name: 'Double Volume Living Hall (6.2m)',
          feature_detail: 'ผนังตกแต่งบิ้วอินความสูงเต็ม 2 ชั้น กรุหิน Sintered Stone ลายครีมทอง พร้อม Chandelier ดีไซน์พิเศษ',
          material_spec: 'แผ่นหิน Sintered Stone นำเข้า ทนความร้อนและรอยขีดข่วน + คิ้วสแตนเลสเกรด 304 สี Champagne',
          sort_order: 1
        },
        {
          id: 5,
          room_name: 'Elderly-Friendly Ground Bedroom',
          feature_detail: 'ห้องนอนชั้นล่างบิ้วอินเตียงและตู้เสื้อผ้ามุมโค้งมน พื้น SPC กันลื่นและห้องน้ำไร้ระดับ (Zero-Threshold)',
          material_spec: 'พื้น Cushion SPC ลดแรงกระแทก + ราวจับดีไซน์หรูกลมกลืนกับงานอินทีเรีย',
          sort_order: 2
        },
        {
          id: 6,
          room_name: 'Master Suite & U-Shape Closet',
          feature_detail: 'ห้องนอนใหญ่เต็มหน้ากว้างบ้าน กั้นโซนห้องแต่งตัวรูปตัว U พร้อมตู้โชว์กระเป๋าและนาฬิกาไฟ LED',
          material_spec: 'ไม้ HMR เกรด E1 หุ้มหนังเทียมพรีเมียมภายในลิ้นชักเครื่องประดับ + อ่างอาบน้ำ Jacuzzi',
          sort_order: 3
        }
      ],
      floor_plans: [
        {
          id: 3,
          floor_number: 1,
          floor_label: 'ชั้น 1 (Ground Floor)',
          area_sqm: 155,
          room_summary: 'โถง Double Volume 6.2 ม. • ห้องอาหาร 8 ที่นั่ง • ห้องนอนผู้สูงอายุชั้นล่าง • ครัวฝรั่ง & ครัวไทย • ที่จอดรถ 3 คัน',
          plan_image: 'assets/images/plan_f1_standard.svg'
        },
        {
          id: 4,
          floor_number: 2,
          floor_label: 'ชั้น 2 (Upper Floor)',
          area_sqm: 140,
          room_summary: 'Master Suite หน้ากว้างพร้อม U-Shape Closet • ห้องนอน 2 & 3 ห้องน้ำในตัว • โถง Mezzanine มองลงโถงรับแขก',
          plan_image: 'assets/images/plan_f2_standard.svg'
        }
      ]
    },
    {
      id: 3,
      plot_code: 'B-02',
      title: 'Villa Solaris Courtyard',
      slug: 'villa-solaris-b02',
      subtitle: 'บ้านเดี่ยวดีไซน์คอร์ทยาร์ดส่วนตัว โอบล้อมสวนกลางบ้าน พร้อมบาร์เครื่องดื่มบิ้วอินสุดเอ็กซ์คลูซีฟ',
      price_thb: 15900000,
      usable_area_sqm: 365,
      land_sqw: 84.0,
      bedrooms: 4,
      bathrooms: 5,
      parking: 3,
      maid_rooms: 1,
      status: 'reserved',
      highlight_badge: 'จองแล้ว • เปิดชมบ้านตัวอย่างแบบเดียวกันได้',
      builtin_style: 'Quiet Luxury Courtyard',
      builtin_value_thb: 2900000,
      description:
        'บ้านทรงตัว L ที่โอบล้อม Private Inner Courtyard ให้ทุกห้องสัมผัสแสงธรรมชาติและสวนสีเขียวอย่างเป็นส่วนตัว จัดเต็มงานบิ้วอินโซน Wine & Coffee Lounge สำหรับต้อนรับแขกคนสำคัญ พร้อมโซนแม่บ้านแยกทางเดินเป็นสัดส่วน',
      hero_image: 'assets/images/villa_solaris_hero.jpg',
      before_image: 'assets/images/builtin_before_shell.jpg',
      after_image: 'assets/images/builtin_after_luxury.jpg',
      is_featured: true,
      builtin_features: [
        {
          id: 7,
          room_name: 'Courtyard Lounge & Wine Bar',
          feature_detail: 'เคาน์เตอร์บาร์หินอ่อนธรรมชาติพร้อมตู้แช่ไวน์บิ้วอินและชั้นโชว์แก้วคริสตัล มองเห็นสวนกลางบ้านเต็มตา',
          material_spec: 'หินอ่อนแท้เคลือบกันซึม + ระบบไฟส่องสว่างปรับระดับความสว่าง (Dimmer Scene Control)',
          sort_order: 1
        },
        {
          id: 8,
          room_name: 'Chef Pantry & Heavy Thai Kitchen',
          feature_detail: 'ชุดครัวบิ้วอินครบเซ็ต เตาอบ ไมโครเวฟฝัง ตู้เย็นบิ้วอินหน้าบานกลืนกับตู้ และห้องครัวไทยแยกโซนซักล้างและห้องแม่บ้าน',
          material_spec: 'หน้าบานพ่นสี High-Gloss Champagne Cream อบสีมาตรฐานโรงงาน + อุปกรณ์ฟิตติ้ง Blum',
          sort_order: 2
        },
        {
          id: 9,
          room_name: 'Sanctuary Master Bathroom',
          feature_detail: 'เคาน์เตอร์อ่างล้างหน้า His & Hers พร้อมกระจกไฟวงแหวนระบบสัมผัส และอ่างอาบน้ำลอยตัวชมวิวต้นไม้',
          material_spec: 'ท็อปหินสังเคราะห์ไร้รอยต่อ + สุขภัณฑ์อัตโนมัติเต็มรูปแบบ',
          sort_order: 3
        }
      ],
      floor_plans: [
        {
          id: 5,
          floor_number: 1,
          floor_label: 'ชั้น 1 (Ground Floor)',
          area_sqm: 195,
          room_summary: 'Private Inner Courtyard • Grand Living & Wine Bar • ห้องนอนแขก/ผู้สูงอายุ • ครัวฝรั่ง-ไทย • โซนแม่บ้านแยกส่วน • จอดรถ 3 คัน',
          plan_image: 'assets/images/plan_f1_grand.svg'
        },
        {
          id: 6,
          floor_number: 2,
          floor_label: 'ชั้น 2 (Upper Floor)',
          area_sqm: 170,
          room_summary: 'Master Wing เต็มฝั่งตะวันออก • Family Living Area ชั้นบน • ห้องนอนรองขนาดใหญ่ 2 ห้องพร้อม Walk-in Closet',
          plan_image: 'assets/images/plan_f2_grand.svg'
        }
      ]
    },
    {
      id: 4,
      plot_code: 'V-01',
      title: 'Villa Imperial — The Grand Manor',
      slug: 'villa-imperial-grand-manor-v01',
      subtitle: 'คฤหาสน์หรูแปลงพิเศษหน้าสวนส่วนกลาง 5 ห้องนอน จอดรถ 4 คัน ตกแต่งบิ้วอินเต็มหลังระดับ Flagship',
      price_thb: 19500000,
      usable_area_sqm: 450,
      land_sqw: 112.0,
      bedrooms: 5,
      bathrooms: 6,
      parking: 4,
      maid_rooms: 1,
      status: 'available',
      highlight_badge: 'Flagship 1 เดียวหน้าสวน • ฟรีบิ้วอิน 3.8 ล้าน',
      builtin_style: 'Signature Bespoke Gold & Walnut',
      builtin_value_thb: 3800000,
      description:
        'ที่สุดแห่งความภาคภูมิใจเพียงหลังเดียวในตำแหน่งที่ดีที่สุดหน้าสวนโครงการ ตกแต่งบิ้วอินครบทั้ง 5 ห้องนอน โถงต้อนรับเพดานสูง 6.8 เมตร ห้องทำงานผู้บริหารส่วนตัว และโรงจอดรถ 4 คันพร้อมเดินระบบรองรับ EV Charger',
      hero_image: 'assets/images/villa_imperial_hero.jpg',
      before_image: 'assets/images/builtin_before_shell.jpg',
      after_image: 'assets/images/builtin_after_luxury.jpg',
      is_featured: true,
      builtin_features: [
        {
          id: 10,
          room_name: '6.8m Grand Foyer & Executive Lounge',
          feature_detail: 'โถงต้อนรับเพดานสูงกรุแผ่นหิน Bookmatch ลายต่อเนื่อง พร้อมห้องทำงานผู้บริหารบิ้วอินชั้นหนังสือไม้โอ๊คสีอบอุ่น',
          material_spec: 'วีเนียร์ไม้โอ๊คธรรมชาติคัดลาย + หิน Sintered Bookmatch + ระบบ Smart Home ควบคุมแอร์และม่านไฟฟ้าทั้งหลัง',
          sort_order: 1
        },
        {
          id: 11,
          room_name: 'Penthouse Master Suite',
          feature_detail: 'ห้องนอนมาสเตอร์ขนาด 85 ตร.ม. แยกโซนนั่งเล่นส่วนตัว ห้องแต่งตัว His & Hers ขนาดใหญ่ และเกาะกลางเก็บเครื่องประดับ',
          material_spec: 'กระจกบานเลื่อนสูงจรดฝ้า + ลิ้นชักกรุกำมะหยี่สีครีมแชมเปญ + ระบบไฟ Sensor ทุกช่องเก็บของ',
          sort_order: 2
        },
        {
          id: 12,
          room_name: '4-Car Garage & Smart Security',
          feature_detail: 'โรงจอดรถในร่ม 4 คันพร้อมตู้เก็บอุปกรณ์บิ้วอินหน้าบ้าน ประตูรั้วอัตโนมัติ และจุดติดตั้ง EV Charger 22kW',
          material_spec: 'พื้นโรงรถ Stamped Concrete เสริมโครงสร้างกันทรุด + กล้องวงจรปิด CCTV รอบบ้าน 8 จุด',
          sort_order: 3
        }
      ],
      floor_plans: [
        {
          id: 7,
          floor_number: 1,
          floor_label: 'ชั้น 1 (Ground Floor)',
          area_sqm: 240,
          room_summary: 'Grand Foyer 6.8 ม. • Executive Study Room • ห้องนอนชั้นล่าง • Dining 10 ที่นั่ง & Island Bar • ครัวไทย & ห้องแม่บ้าน • จอดรถ 4 คัน',
          plan_image: 'assets/images/plan_f1_grand.svg'
        },
        {
          id: 8,
          floor_number: 2,
          floor_label: 'ชั้น 2 (Upper Floor)',
          area_sqm: 210,
          room_summary: 'Penthouse Master Suite 85 ตร.ม. • ห้องนอน 2, 3, 4 บิ้วอินครบทุกห้อง • ห้องพระ / Family Lounge ชมวิวสวน',
          plan_image: 'assets/images/plan_f2_grand.svg'
        }
      ]
    }
  ];

  window.InitialHouseData = {
    BRAND: BRAND,
    PROPERTIES: PROPERTIES
  };
})(window);
