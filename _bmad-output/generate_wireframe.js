const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Logging helper
function log(msg) {
    fs.appendFileSync('_bmad-output/debug.log', msg + '\n');
}

log("Script started");

// UUID helper with fallback
const get_id = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15);
};

// --- Configuration ---
const OUTPUT_FILE = "_bmad-output/wireframe-dainganxanh.excalidraw";
const GRID_SIZE = 20;

try {

    // Theme
    const COLOR_BG = "#F0FFF4";       // brand-50
    const COLOR_SURFACE = "#ffffff";  // white
    const COLOR_TEXT = "#1A3320";     // brand-600
    const COLOR_ACCENT = "#2E8B57";   // brand-500
    const COLOR_GOLD = "#FFD700";     // accent-gold

    // --- Helpers ---
    const get_time = () => Date.now();
    const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

    const elements = [];

    function add_rect(x, y, w, h, bg = COLOR_SURFACE, stroke = COLOR_ACCENT, stroke_width = 1, fill_style = "solid", roundness = null) {
        const eid = get_id();
        const el = {
            id: eid,
            type: "rectangle",
            x: snap(x),
            y: snap(y),
            width: w,
            height: h,
            angle: 0,
            strokeColor: stroke,
            backgroundColor: bg,
            fillStyle: fill_style,
            strokeWidth: stroke_width,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            roundness: roundness ? { type: 3 } : null,
            seed: get_time(),
            version: 1,
            versionNonce: get_time(),
            isDeleted: false,
            boundElements: [],
            updated: get_time(),
            link: null,
            locked: false,
        };
        elements.push(el);
        return eid;
    }

    function add_text(x, y, text, size = 20, color = COLOR_TEXT, align = "left", width = null, container_id = null) {
        const eid = get_id();
        const est_w = width || (text.length * size * 0.6);

        const el = {
            type: "text",
            version: 256,
            versionNonce: get_time(),
            isDeleted: false,
            id: eid,
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            angle: 0,
            x: snap(x),
            y: snap(y),
            strokeColor: color,
            backgroundColor: "transparent",
            width: est_w,
            height: size * 1.5,
            seed: get_time(),
            groupIds: [],
            roundness: null,
            boundElements: [],
            updated: get_time(),
            link: null,
            locked: false,
            fontSize: size,
            fontFamily: 1,
            text: text,
            textAlign: align,
            verticalAlign: "top",
            baseline: size,
        };

        if (container_id) {
            el.containerId = container_id;
            el.verticalAlign = "middle";
            el.textAlign = "center";
            // Update container
            const container = elements.find(obj => obj.id === container_id);
            if (container) {
                container.boundElements.push({ type: "text", id: eid });
            }
        }

        elements.push(el);
        return eid;
    }

    function add_button(x, y, w, h, text, bg = COLOR_ACCENT, text_color = "#ffffff") {
        const gid = get_id();
        const rid = add_rect(x, y, w, h, bg, bg, 1, "solid", true);
        const tid = add_text(x, y, text, 16, text_color, "center", null, rid);

        elements.forEach(obj => {
            if ([rid, tid].includes(obj.id)) {
                obj.groupIds.push(gid);
            }
        });
        return rid;
    }

    // --- Layout ---
    const WIDTH = 1200;
    const CANVAS_X = 100;
    const CANVAS_Y = 100;

    // 1. Page Container
    add_rect(CANVAS_X, CANVAS_Y, WIDTH, 2000, COLOR_BG, "transparent");

    // 2. Navbar
    add_rect(CANVAS_X, CANVAS_Y, WIDTH, 80, "rgba(255,255,255,0.8)", COLOR_ACCENT);
    add_text(CANVAS_X + 40, CANVAS_Y + 25, "Đại Ngàn Xanh", 24, COLOR_ACCENT);

    const links = ["Về Dự Án", "Minh Bạch", "Dashboard", "Blog"];
    let lx = CANVAS_X + WIDTH - 400;
    links.forEach(l => {
        add_text(lx, CANVAS_Y + 30, l, 16);
        lx += 100;
    });

    // 3. Hero Section
    const hero_y = CANVAS_Y + 80;
    add_rect(CANVAS_X, hero_y, WIDTH, 600, "#ffffff", "transparent");
    add_text(CANVAS_X + 100, hero_y + 150, "Dệt Đại Ngàn,\nGặt Phước Báu", 48, COLOR_ACCENT);
    add_text(CANVAS_X + 100, hero_y + 300, "Sở hữu cây Dó Đen 5 năm tuổi chỉ với 260.000đ.\nTheo dõi qua GPS, ảnh thực tế và tác động CO2.", 20);
    add_button(CANVAS_X + 100, hero_y + 400, 200, 60, "Trồng Ngay", COLOR_GOLD, "#000000");

    // Live Counter
    add_rect(CANVAS_X + 100, hero_y + 80, 250, 40, COLOR_BG, COLOR_ACCENT, 1, "solid", true);
    add_text(CANVAS_X + 120, hero_y + 90, "🌱 138,592 cây đã trồng", 14, COLOR_ACCENT);

    // Hero Image Placeholder
    add_rect(CANVAS_X + 700, hero_y + 100, 400, 400, "#e0e0e0", "#bdbdbd", 1, "cross-hatch", true);
    add_text(CANVAS_X + 800, hero_y + 280, "Hero Video/Image", 20, "#757575");

    // 4. Value Props
    const value_y = hero_y + 600;
    add_rect(CANVAS_X, value_y, WIDTH, 400, COLOR_BG, "transparent");
    add_text(CANVAS_X + 500, value_y + 40, "Tại Sao Chọn Đại Ngàn Xanh?", 32, COLOR_TEXT, "center");

    let cx = CANVAS_X + 100;
    ["Minh Bạch Tuyệt Đối", "Tác Động Thực Tế", "Trải Nghiệm Số"].forEach(title => {
        add_rect(cx, value_y + 120, 300, 200, "#ffffff", COLOR_ACCENT, 1, "solid", true);
        add_rect(cx + 125, value_y + 140, 50, 50, COLOR_BG, COLOR_ACCENT, 1, "solid", true);
        add_text(cx + 60, value_y + 210, title, 20, COLOR_TEXT, "center");
        cx += 350;
    });

    // 5. How It Works
    const how_y = value_y + 400;
    add_rect(CANVAS_X, how_y, WIDTH, 500, "#ffffff", "transparent");
    add_text(CANVAS_X + 100, how_y + 50, "Hành Trình Gieo Mầm", 32);

    let step_x = CANVAS_X + 100;
    const steps = [
        ["1. Chọn Cây", "Chọn số lượng cây bạn muốn trồng"],
        ["2. Thanh Toán", "Quét QR hoặc chuyển khoản USDT"],
        ["3. Nhận Certificate", "Nhận chứng nhận quyền sở hữu"],
        ["4. Theo Dõi", "Xem ảnh và GPS trên Dashboard"]
    ];

    steps.forEach((step, i) => {
        add_rect(step_x, how_y + 150, 220, 250, i % 2 === 0 ? COLOR_BG : "#ffffff", COLOR_ACCENT);
        add_text(step_x + 20, how_y + 180, step[0], 20, COLOR_ACCENT);
        add_text(step_x + 20, how_y + 220, step[1], 16, COLOR_TEXT, "left", 180);
        step_x += 260;
    });

    // 6. Dashboard Preview
    const dash_y = how_y + 500;
    add_rect(CANVAS_X, dash_y, WIDTH, 600, COLOR_ACCENT, "transparent");
    add_text(CANVAS_X + 100, dash_y + 100, "Quản Lý Khu Rừng Của Bạn", 32, "#ffffff");
    add_button(CANVAS_X + 100, dash_y + 200, 200, 60, "Xem Demo Dashboard", COLOR_GOLD, "#000000");

    // Phone Mockup
    const phone_x = CANVAS_X + 700;
    const phone_y = dash_y + 50;
    add_rect(phone_x, phone_y, 300, 500, "#ffffff", "#000000", 2, "solid", true);
    add_rect(phone_x + 20, phone_y + 60, 260, 150, "#e0e0e0", "#000000", 1, "hachure");
    add_text(phone_x + 30, phone_y + 230, "Cây Dó Đen #1024", 18);
    add_text(phone_x + 30, phone_y + 260, "📍 14.0583° N, 108.2772° E", 12, "#757575");
    add_rect(phone_x + 30, phone_y + 300, 260, 10, "#e0e0e0", "transparent", 0, "solid", true);
    add_rect(phone_x + 30, phone_y + 300, 100, 10, COLOR_ACCENT, "transparent", 0, "solid", true);

    // 7. Footer
    const foot_y = dash_y + 600;
    add_rect(CANVAS_X, foot_y, WIDTH, 300, "#1a1a1a", "transparent");
    add_text(CANVAS_X + 100, foot_y + 50, "Đại Ngàn Xanh", 24, "#ffffff");
    add_text(CANVAS_X + 100, foot_y + 100, "Kết nối con người với thiên nhiên.", 16, "#bdbdbd");
    add_text(CANVAS_X + 500, foot_y + 50, "Liên Kết", 18, "#ffffff");
    add_text(CANVAS_X + 500, foot_y + 100, "Về chúng tôi\nChính sách\nLiên hệ", 16, "#bdbdbd");

    // --- Output ---
    const final_json = {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: elements,
        appState: {
            viewBackgroundColor: "#F0F0F0",
            gridSize: GRID_SIZE
        },
        files: {}
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(final_json, null, 2));
    log(`Generated ${elements.length} elements to ${OUTPUT_FILE}`);
    console.log(`Generated ${elements.length} elements to ${OUTPUT_FILE}`);

} catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    console.error(error);
    process.exit(1);
}
