const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = [
  // PRODUCTS
  {
    path: 'public/images/products/nuoc-hoa-tram-huong.webp',
    width: 800,
    height: 800,
    svg: `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1E140A"/>
            <stop offset="50%" stop-color="#3A2412"/>
            <stop offset="100%" stop-color="#120A05"/>
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFE29F"/>
            <stop offset="50%" stop-color="#D4AF37"/>
            <stop offset="100%" stop-color="#AA771C"/>
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#1E140A" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bg)"/>
        <circle cx="400" cy="400" r="300" fill="url(#glow)"/>

        <!-- Perfume bottle silhouette -->
        <rect x="360" y="160" width="80" height="60" rx="8" fill="url(#gold)"/>
        <rect x="385" y="120" width="30" height="40" rx="4" fill="url(#gold)"/>
        <!-- Bottle Body -->
        <rect x="260" y="220" width="280" height="380" rx="28" fill="#181109" stroke="url(#gold)" stroke-width="4"/>
        <rect x="290" y="250" width="220" height="320" rx="16" fill="#24180C" opacity="0.6"/>

        <!-- Label -->
        <rect x="300" y="320" width="200" height="180" rx="8" fill="#120B05" stroke="url(#gold)" stroke-width="1.5"/>
        <text x="400" y="365" font-family="serif" font-size="14" fill="#D4AF37" text-anchor="middle" letter-spacing="4">ĐẠI NGÀN XANH</text>
        <line x1="330" y1="385" x2="470" y2="385" stroke="#D4AF37" stroke-width="1" opacity="0.5"/>
        <text x="400" y="425" font-family="serif" font-size="28" font-weight="bold" fill="#FFE29F" text-anchor="middle">AGARWOOD</text>
        <text x="400" y="455" font-family="sans-serif" font-size="12" fill="#D4AF37" text-anchor="middle" letter-spacing="3">EAU DE PARFUM</text>
        <text x="400" y="485" font-family="sans-serif" font-size="12" fill="#A88B4D" text-anchor="middle">50ml / 1.7 FL. OZ.</text>

        <!-- Badge -->
        <circle cx="400" cy="650" r="28" fill="#181109" stroke="url(#gold)" stroke-width="2"/>
        <text x="400" y="656" font-family="serif" font-size="18" fill="#FFE29F" text-anchor="middle">🌿</text>
        <text x="400" y="720" font-family="sans-serif" font-size="16" fill="#C9A050" text-anchor="middle" letter-spacing="2">TRẦM HƯƠNG DÓ ĐEN</text>
      </svg>
    `
  },
  {
    path: 'public/images/products/tinh-dau-tram-huong.webp',
    width: 800,
    height: 800,
    svg: `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0B1A12"/>
            <stop offset="50%" stop-color="#143324"/>
            <stop offset="100%" stop-color="#060E0A"/>
          </linearGradient>
          <linearGradient id="gold2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFE29F"/>
            <stop offset="50%" stop-color="#10B981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
          <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#0B1A12" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bg2)"/>
        <circle cx="400" cy="400" r="280" fill="url(#glow2)"/>

        <!-- Dropper Bottle -->
        <!-- Pipette top -->
        <path d="M380 130 Q400 100 420 130 L415 170 L385 170 Z" fill="#D1D5DB"/>
        <rect x="375" y="170" width="50" height="25" rx="4" fill="#F59E0B"/>
        <rect x="365" y="195" width="70" height="40" rx="6" fill="#1F2937"/>
        <!-- Bottle Body -->
        <rect x="310" y="235" width="180" height="340" rx="24" fill="#0A0F0D" stroke="#10B981" stroke-width="3"/>
        <rect x="325" y="250" width="150" height="310" rx="14" fill="#13261C" opacity="0.7"/>

        <!-- Label -->
        <rect x="330" y="320" width="140" height="180" rx="6" fill="#07120C" stroke="#34D399" stroke-width="1.5"/>
        <text x="400" y="355" font-family="serif" font-size="11" fill="#34D399" text-anchor="middle" letter-spacing="2">ĐẠI NGÀN XANH</text>
        <text x="400" y="390" font-family="serif" font-size="18" font-weight="bold" fill="#ECFDF5" text-anchor="middle">TINH DẦU</text>
        <text x="400" y="415" font-family="serif" font-size="15" fill="#6EE7B7" text-anchor="middle">TRẦM HƯƠNG</text>
        <line x1="350" y1="430" x2="450" y2="430" stroke="#34D399" stroke-width="1" opacity="0.4"/>
        <text x="400" y="450" font-family="sans-serif" font-size="10" fill="#A7F3D0" text-anchor="middle">100% PURE &amp; NATURAL</text>
        <text x="400" y="475" font-family="sans-serif" font-size="12" font-weight="bold" fill="#F59E0B" text-anchor="middle">10 ML</text>

        <!-- Drop icon -->
        <path d="M400 630 C385 655 375 670 375 685 A25 25 0 0 0 425 685 C425 670 415 655 400 630 Z" fill="#34D399"/>
        <text x="400" y="740" font-family="sans-serif" font-size="16" fill="#A7F3D0" text-anchor="middle" letter-spacing="3">TÂY NGUYÊN</text>
      </svg>
    `
  },
  {
    path: 'public/images/products/nhang-nu-tram-huong.webp',
    width: 800,
    height: 800,
    svg: `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#2D1A10"/>
            <stop offset="50%" stop-color="#4A2818"/>
            <stop offset="100%" stop-color="#1A0D08"/>
          </linearGradient>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8C5338"/>
            <stop offset="100%" stop-color="#3D1D10"/>
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bg3)"/>

        <!-- Incense smoke art -->
        <path d="M400 240 Q430 180 390 140 T410 80" stroke="#FFE4D6" stroke-width="4" fill="none" opacity="0.3" stroke-linecap="round"/>
        <path d="M395 240 Q370 170 410 130 T385 60" stroke="#FDBA74" stroke-width="2.5" fill="none" opacity="0.4" stroke-linecap="round"/>

        <!-- Center Incense Cone -->
        <path d="M400 250 L460 480 Q400 500 340 480 Z" fill="url(#cone)" stroke="#FDBA74" stroke-width="2"/>

        <!-- Burning tip -->
        <circle cx="400" cy="250" r="8" fill="#EA580C"/>
        <circle cx="400" cy="250" r="4" fill="#FED7AA"/>

        <!-- Side cones -->
        <path d="M280 360 L330 520 Q280 535 230 520 Z" fill="url(#cone)" opacity="0.8"/>
        <path d="M520 360 L570 520 Q520 535 470 520 Z" fill="url(#cone)" opacity="0.8"/>

        <!-- Wooden burner plate -->
        <ellipse cx="400" cy="520" rx="260" ry="40" fill="#1C0E08" stroke="#78350F" stroke-width="3"/>
        <ellipse cx="400" cy="515" rx="240" ry="32" fill="#29140A"/>

        <!-- Text -->
        <text x="400" y="630" font-family="serif" font-size="30" font-weight="bold" fill="#FED7AA" text-anchor="middle">NHANG NỤ TRẦM HƯƠNG</text>
        <text x="400" y="665" font-family="sans-serif" font-size="14" fill="#FDBA74" text-anchor="middle" letter-spacing="3">HỘP 40 NỤ NGUYÊN CHẤT</text>
        <text x="400" y="705" font-family="sans-serif" font-size="13" fill="#A8715A" text-anchor="middle">Khói Dịu Thanh Lọc Không Gian Gia Đình</text>
      </svg>
    `
  },
  {
    path: 'public/images/products/vong-tay-tram-huong.webp',
    width: 800,
    height: 800,
    svg: `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1F1B16"/>
            <stop offset="50%" stop-color="#2E261F"/>
            <stop offset="100%" stop-color="#120F0C"/>
          </linearGradient>
          <radialGradient id="bead" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#8D6E50"/>
            <stop offset="40%" stop-color="#543D28"/>
            <stop offset="100%" stop-color="#23170D"/>
          </radialGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bg4)"/>

        <!-- Circular Bracelet -->
        <circle cx="400" cy="380" r="200" stroke="#17120D" stroke-width="6" fill="none"/>

        <!-- Beads mapped along circle -->
        ${Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 2 * Math.PI;
          const cx = 400 + 200 * Math.cos(angle);
          const cy = 380 + 200 * Math.sin(angle);
          return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="22" fill="url(#bead)" stroke="#1F150C" stroke-width="1"/>`;
        }).join('\n')}

        <!-- Guru bead / Tassel at bottom -->
        <circle cx="400" cy="580" r="30" fill="url(#bead)" stroke="#C59B27" stroke-width="3"/>
        <rect x="396" y="610" width="8" height="60" fill="#C59B27"/>
        <path d="M385 670 Q400 710 415 670 Z" fill="#C59B27"/>

        <!-- Center lotus emblem -->
        <text x="400" y="380" font-family="serif" font-size="44" fill="#D4AF37" text-anchor="middle">🪷</text>
        <text x="400" y="415" font-family="serif" font-size="14" fill="#C59B27" text-anchor="middle" letter-spacing="4">108 HẠT</text>

        <!-- Typography -->
        <text x="400" y="730" font-family="serif" font-size="26" font-weight="bold" fill="#F3E5D8" text-anchor="middle">VÒNG TAY TRẦM HƯƠNG</text>
        <text x="400" y="760" font-family="sans-serif" font-size="13" fill="#B39274" text-anchor="middle" letter-spacing="2">PHONG THỦY BÌNH AN - DÓ ĐEN</text>
      </svg>
    `
  },
  {
    path: 'public/images/products/nhang-khong-tam.webp',
    width: 800,
    height: 800,
    svg: `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#141E18"/>
            <stop offset="50%" stop-color="#1C2E24"/>
            <stop offset="100%" stop-color="#0E1612"/>
          </linearGradient>
          <linearGradient id="box" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#8B5A2B"/>
            <stop offset="50%" stop-color="#A06834"/>
            <stop offset="100%" stop-color="#6E441F"/>
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bg5)"/>

        <!-- Box Container -->
        <rect x="280" y="140" width="240" height="520" rx="14" fill="url(#box)" stroke="#D4AF37" stroke-width="2"/>
        <rect x="300" y="160" width="200" height="480" rx="8" fill="#1E140C" stroke="#AA771C" stroke-width="1"/>

        <!-- Incense sticks fan -->
        <line x1="380" y1="180" x2="330" y2="80" stroke="#8C6239" stroke-width="4" stroke-linecap="round"/>
        <line x1="400" y1="180" x2="400" y2="70" stroke="#8C6239" stroke-width="4" stroke-linecap="round"/>
        <line x1="420" y1="180" x2="470" y2="80" stroke="#8C6239" stroke-width="4" stroke-linecap="round"/>
        <!-- Burning tips -->
        <circle cx="330" cy="80" r="3" fill="#EF4444"/>
        <circle cx="400" cy="70" r="3" fill="#EF4444"/>
        <circle cx="470" cy="80" r="3" fill="#EF4444"/>

        <!-- Gold label band -->
        <rect x="320" y="320" width="160" height="180" fill="#2E1B10" stroke="#D4AF37" stroke-width="1.5"/>
        <text x="400" y="360" font-family="serif" font-size="12" fill="#D4AF37" text-anchor="middle" letter-spacing="3">ĐẠI NGÀN XANH</text>
        <text x="400" y="405" font-family="serif" font-size="20" font-weight="bold" fill="#FFE29F" text-anchor="middle">NHANG</text>
        <text x="400" y="435" font-family="serif" font-size="16" fill="#FFE29F" text-anchor="middle">KHÔNG TĂM</text>
        <line x1="340" y1="450" x2="460" y2="450" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>
        <text x="400" y="475" font-family="sans-serif" font-size="11" fill="#D4AF37" text-anchor="middle">50 CÂY • 20CM</text>

        <!-- Typography -->
        <text x="400" y="715" font-family="serif" font-size="24" font-weight="bold" fill="#E2E8F0" text-anchor="middle">NHANG KHÔNG TĂM CAO CẤP</text>
        <text x="400" y="745" font-family="sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle" letter-spacing="2">THƯỞNG TRÀ &amp; THIỀN ĐỊNH</text>
      </svg>
    `
  },

  // ROOMS
  {
    path: 'public/images/rooms/phong-deluxe-ba-vi.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="roomBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1B2820"/>
            <stop offset="50%" stop-color="#283E31"/>
            <stop offset="100%" stop-color="#141E18"/>
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#A27B5C"/>
            <stop offset="100%" stop-color="#3F2E21"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#roomBg)"/>
        <!-- Window panorama to forest -->
        <rect x="150" y="100" width="900" height="380" rx="16" fill="#0C1B13" stroke="#A27B5C" stroke-width="8"/>
        <!-- Mountain & trees silhouette -->
        <path d="M150 380 Q350 200 600 350 T1050 320 L1050 480 L150 480 Z" fill="#143224"/>
        <path d="M150 420 Q450 300 750 410 T1050 380 L1050 480 L150 480 Z" fill="#1E4432"/>
        <circle cx="600" cy="220" r="60" fill="#FEF08A" opacity="0.3"/>

        <!-- Floor -->
        <polygon points="0,600 1200,600 1200,800 0,800" fill="url(#wood)"/>

        <!-- Cozy Bed -->
        <rect x="360" y="460" width="480" height="240" rx="16" fill="#E2E8F0" stroke="#334155" stroke-width="2"/>
        <!-- Headboard -->
        <rect x="330" y="400" width="540" height="90" rx="10" fill="#5C3D24" stroke="#8C5831" stroke-width="3"/>
        <!-- Pillows -->
        <rect x="390" y="470" width="180" height="70" rx="8" fill="#CBD5E1"/>
        <rect x="630" y="470" width="180" height="70" rx="8" fill="#CBD5E1"/>
        <rect x="420" y="550" width="360" height="150" rx="8" fill="#047857"/>

        <!-- Overlay Text Badge -->
        <rect x="50" y="50" width="380" height="90" rx="16" fill="#061A10" opacity="0.85" stroke="#10B981" stroke-width="2"/>
        <text x="75" y="88" font-family="serif" font-size="22" font-weight="bold" fill="#ECFDF5">Phòng Deluxe Sinh Thái</text>
        <text x="75" y="118" font-family="sans-serif" font-size="13" fill="#6EE7B7">VƯỜN TRẦM HƯƠNG BA VÌ • VIEW RỪNG</text>
      </svg>
    `
  },
  {
    path: 'public/images/rooms/phong-vip-ba-vi.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vipBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1A1510"/>
            <stop offset="50%" stop-color="#2D2218"/>
            <stop offset="100%" stop-color="#120E0A"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#vipBg)"/>
        <!-- Full glass wall view -->
        <rect x="80" y="60" width="1040" height="460" rx="20" fill="#0F1F17" stroke="#D4AF37" stroke-width="4"/>
        <path d="M80 400 Q400 240 700 380 T1120 340 L1120 520 L80 520 Z" fill="#183B2B"/>
        <circle cx="850" cy="180" r="50" fill="#FDE047" opacity="0.25"/>

        <!-- Wooden deck floor -->
        <polygon points="0,580 1200,580 1200,800 0,800" fill="#3E2718"/>
        <!-- King bed with warm ambient lighting -->
        <rect x="340" y="440" width="520" height="260" rx="18" fill="#F8FAFC"/>
        <rect x="300" y="380" width="600" height="90" rx="10" fill="#854D0E" stroke="#CA8A04" stroke-width="2"/>
        <rect x="360" y="450" width="200" height="80" rx="10" fill="#E2E8F0"/>
        <rect x="640" y="450" width="200" height="80" rx="10" fill="#E2E8F0"/>
        <rect x="380" y="540" width="440" height="160" rx="12" fill="#B45309"/>

        <!-- Badge -->
        <rect x="50" y="50" width="360" height="90" rx="16" fill="#1C1309" opacity="0.9" stroke="#EAB308" stroke-width="2"/>
        <text x="75" y="88" font-family="serif" font-size="22" font-weight="bold" fill="#FEF08A">Phòng VIP Hoàng Gia</text>
        <text x="75" y="118" font-family="sans-serif" font-size="13" fill="#FACC15">VƯỜN TRẦM HƯƠNG BA VÌ • CAO CẤP</text>
      </svg>
    `
  },
  {
    path: 'public/images/rooms/phong-standard-dong-nai.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stdBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#14231E"/>
            <stop offset="50%" stop-color="#1E3830"/>
            <stop offset="100%" stop-color="#0E1915"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#stdBg)"/>
        <rect x="180" y="90" width="840" height="400" rx="14" fill="#0A1811" stroke="#34D399" stroke-width="4"/>
        <path d="M180 390 Q500 280 750 370 T1020 350 L1020 490 L180 490 Z" fill="#164E35"/>

        <polygon points="0,580 1200,580 1200,800 0,800" fill="#4B382A"/>
        <rect x="380" y="470" width="440" height="230" rx="14" fill="#F1F5F9"/>
        <rect x="350" y="420" width="500" height="70" rx="8" fill="#573D29"/>
        <rect x="410" y="480" width="170" height="60" rx="6" fill="#E2E8F0"/>
        <rect x="620" y="480" width="170" height="60" rx="6" fill="#E2E8F0"/>
        <rect x="420" y="550" width="360" height="150" rx="8" fill="#0D9488"/>

        <!-- Badge -->
        <rect x="50" y="50" width="370" height="90" rx="16" fill="#0B1A13" opacity="0.9" stroke="#10B981" stroke-width="2"/>
        <text x="75" y="88" font-family="serif" font-size="22" font-weight="bold" fill="#F0FDF4">Phòng Standard Xanh Mát</text>
        <text x="75" y="118" font-family="sans-serif" font-size="13" fill="#6EE7B7">VƯỜN CÂY XANH ĐỒNG NAI</text>
      </svg>
    `
  },

  // LOTS
  {
    path: 'public/images/lots/vuon-tram-huong-ba-vi.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1E3A2F"/>
            <stop offset="60%" stop-color="#3D6B57"/>
            <stop offset="100%" stop-color="#7CA982"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#sky1)"/>
        <!-- Mountain ranges -->
        <path d="M0 450 Q300 220 600 380 T1200 300 L1200 800 L0 800 Z" fill="#1C3829"/>
        <path d="M0 520 Q400 360 800 500 T1200 440 L1200 800 L0 800 Z" fill="#142B20"/>
        <path d="M0 600 Q500 480 1000 580 L1200 550 L1200 800 L0 800 Z" fill="#0C1B13"/>

        <!-- Sunlight -->
        <circle cx="350" cy="200" r="140" fill="#FEF08A" opacity="0.35"/>

        <!-- Title Card -->
        <rect x="70" y="620" width="500" height="110" rx="20" fill="#07150E" opacity="0.9" stroke="#10B981" stroke-width="2"/>
        <text x="100" y="665" font-family="serif" font-size="28" font-weight="bold" fill="#ECFDF5">Vườn Trầm Hương Ba Vì</text>
        <text x="100" y="700" font-family="sans-serif" font-size="15" fill="#6EE7B7">KHU NGHỈ DƯỠNG SINH THÁI RỪNG TRẦM THUẦN KHIẾT</text>
      </svg>
    `
  },
  {
    path: 'public/images/lots/vuon-do-den-tay-nguyen.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3B1C12"/>
            <stop offset="60%" stop-color="#78350F"/>
            <stop offset="100%" stop-color="#B45309"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#sky2)"/>
        <!-- Red basalt hills -->
        <path d="M0 480 Q350 320 700 440 T1200 360 L1200 800 L0 800 Z" fill="#451A03"/>
        <path d="M0 550 Q450 420 900 530 T1200 480 L1200 800 L0 800 Z" fill="#2E1002"/>
        <circle cx="850" cy="220" r="120" fill="#FBBF24" opacity="0.3"/>

        <!-- Title Card -->
        <rect x="70" y="620" width="500" height="110" rx="20" fill="#1C0A02" opacity="0.9" stroke="#F59E0B" stroke-width="2"/>
        <text x="100" y="665" font-family="serif" font-size="28" font-weight="bold" fill="#FEF3C7">Vườn Dó Đen Tây Nguyên</text>
        <text x="100" y="700" font-family="sans-serif" font-size="15" fill="#FCD34D">ĐẤT ĐỎ BASALT • CÂY DÓ ĐEN TÍCH TRẦM TỰ NHIÊN</text>
      </svg>
    `
  },
  {
    path: 'public/images/lots/vuon-cay-xanh-dong-nai.webp',
    width: 1200,
    height: 800,
    svg: `
      <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#143026"/>
            <stop offset="60%" stop-color="#1F5643"/>
            <stop offset="100%" stop-color="#34D399"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#sky3)"/>
        <!-- Canopy foliage -->
        <path d="M0 450 Q300 300 650 430 T1200 370 L1200 800 L0 800 Z" fill="#064E3B"/>
        <path d="M0 540 Q400 410 800 520 T1200 460 L1200 800 L0 800 Z" fill="#022C22"/>
        <circle cx="300" cy="200" r="130" fill="#A7F3D0" opacity="0.35"/>

        <!-- Title Card -->
        <rect x="70" y="620" width="500" height="110" rx="20" fill="#021C16" opacity="0.9" stroke="#10B981" stroke-width="2"/>
        <text x="100" y="665" font-family="serif" font-size="28" font-weight="bold" fill="#ECFDF5">Vườn Cây Xanh Đồng Nai</text>
        <text x="100" y="700" font-family="sans-serif" font-size="15" fill="#6EE7B7">RỪNG CÂY TƯƠI TỐT MIỀN ĐÔNG NAM BỘ</text>
      </svg>
    `
  }
];

async function generate() {
  for (const item of ASSETS) {
    const dir = path.dirname(item.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(Buffer.from(item.svg))
      .webp({ quality: 90 })
      .toFile(item.path);
    console.log('✅ Đã tạo ảnh:', item.path);
  }
  console.log('🎉 Hoàn tất tạo tất cả ảnh tính năng!');
}

generate().catch(console.error);
