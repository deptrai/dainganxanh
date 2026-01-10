import json
import uuid
import time

print("SCRIPT STARTING...")

# --- Configuration ---
OUTPUT_FILE = "wireframe-dainganxanh.excalidraw"
GRID_SIZE = 20

# Theme
COLOR_BG = "#F0FFF4"       # brand-50
COLOR_SURFACE = "#ffffff"  # white
COLOR_TEXT = "#1A3320"     # brand-600
COLOR_ACCENT = "#2E8B57"   # brand-500
COLOR_GOLD = "#FFD700"     # accent-gold

# --- Helpers ---
def get_id():
    return str(uuid.uuid4())

def get_time():
    return int(time.time() * 1000)

def snap(val):
    return round(val / GRID_SIZE) * GRID_SIZE

elements = []

def add_rect(x, y, w, h, bg=COLOR_SURFACE, stroke=COLOR_ACCENT, stroke_width=1, fill_style="solid", roundness=None):
    eid = get_id()
    el = {
        "id": eid,
        "type": "rectangle",
        "x": snap(x),
        "y": snap(y),
        "width": w,
        "height": h,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": bg,
        "fillStyle": fill_style,
        "strokeWidth": stroke_width,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "roundness": roundness if roundness else None,
        "seed": get_time(),
        "version": 1,
        "versionNonce": get_time(),
        "isDeleted": False,
        "boundElements": [],
        "updated": get_time(),
        "link": None,
        "locked": False,
    }
    if roundness:
        el["roundness"] = {"type": 3} # Adaptive radius
    elements.append(el)
    return eid

def add_text(x, y, text, size=20, color=COLOR_TEXT, align="left", width=None, container_id=None):
    eid = get_id()
    # Estimate width if not provided
    est_w = len(text) * size * 0.6 if not width else width
    
    el = {
        "type": "text",
        "version": 256,
        "versionNonce": get_time(),
        "isDeleted": False,
        "id": eid,
        "fillStyle": "hachure",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": snap(x),
        "y": snap(y),
        "strokeColor": color,
        "backgroundColor": "transparent",
        "width": est_w,
        "height": size * 1.5,
        "seed": get_time(),
        "groupIds": [],
        "roundness": None,
        "boundElements": [],
        "updated": get_time(),
        "link": None,
        "locked": False,
        "fontSize": size,
        "fontFamily": 1, # 1: Virgil (Hand-drawn), 2: Normal, 3: Cascadia
        "text": text,
        "textAlign": align,
        "verticalAlign": "top",
        "baseline": size,
    }
    
    if container_id:
        el["containerId"] = container_id
        el["verticalAlign"] = "middle"
        el["textAlign"] = "center"
        # Update container
        for obj in elements:
            if obj["id"] == container_id:
                obj["boundElements"].append({"type": "text", "id": eid})
                break
                
    elements.append(el)
    return eid

def add_button(x, y, w, h, text, bg=COLOR_ACCENT, text_color="#ffffff"):
    gid = get_id()
    # Button Rect
    rid = add_rect(x, y, w, h, bg=bg, stroke=bg, fill_style="solid", roundness=True)
    # Button Text
    tid = add_text(x, y, text, size=16, color=text_color, container_id=rid)
    
    # Group them
    for obj in elements:
        if obj["id"] in [rid, tid]:
            obj["groupIds"].append(gid)
            
    return rid

# --- Layout ---
WIDTH = 1200
CANVAS_X = 100
CANVAS_Y = 100

# 1. Page Container (Body)
page_height = 2000
add_rect(CANVAS_X, CANVAS_Y, WIDTH, page_height, bg=COLOR_BG, stroke="transparent")

# 2. Navbar
add_rect(CANVAS_X, CANVAS_Y, WIDTH, 80, bg="rgba(255,255,255,0.8)", stroke=COLOR_ACCENT)
add_text(CANVAS_X + 40, CANVAS_Y + 25, "Đại Ngàn Xanh", size=24, color=COLOR_ACCENT)
# Nav links
links = ["Về Dự Án", "Minh Bạch", "Dashboard", "Blog"]
lx = CANVAS_X + WIDTH - 400
for l in links:
    add_text(lx, CANVAS_Y + 30, l, size=16)
    lx += 100

# 3. Hero Section
hero_y = CANVAS_Y + 80
add_rect(CANVAS_X, hero_y, WIDTH, 600, bg="#ffffff", stroke="transparent")
# Hero Content (Left)
add_text(CANVAS_X + 100, hero_y + 150, "Dệt Đại Ngàn,\nGặt Phước Báu", size=48, color=COLOR_ACCENT)
add_text(CANVAS_X + 100, hero_y + 300, "Sở hữu cây Dó Đen 5 năm tuổi chỉ với 260.000đ.\nTheo dõi qua GPS, ảnh thực tế và tác động CO2.", size=20)
add_button(CANVAS_X + 100, hero_y + 400, 200, 60, "Trồng Ngay", bg=COLOR_GOLD, text_color="#000000")
# Live Counter
add_rect(CANVAS_X + 100, hero_y + 80, 250, 40, bg=COLOR_BG, stroke=COLOR_ACCENT, roundness=True)
add_text(CANVAS_X + 120, hero_y + 90, "🌱 138,592 cây đã trồng", size=14, color=COLOR_ACCENT)

# Hero Image Placeholder (Right)
add_rect(CANVAS_X + 700, hero_y + 100, 400, 400, bg="#e0e0e0", stroke="#bdbdbd", fill_style="cross-hatch")
add_text(CANVAS_X + 800, hero_y + 280, "Hero Video/Image", size=20, color="#757575")

# 4. Value Props
value_y = hero_y + 600
add_rect(CANVAS_X, value_y, WIDTH, 400, bg=COLOR_BG, stroke="transparent")
add_text(CANVAS_X + 500, value_y + 40, "Tại Sao Chọn Đại Ngàn Xanh?", size=32, align="center")

# Cards
cx = CANVAS_X + 100
for title in ["Minh Bạch Tuyệt Đối", "Tác Động Thực Tế", "Trải Nghiệm Số"]:
    # Card bg
    add_rect(cx, value_y + 120, 300, 200, bg="#ffffff", roundness=True)
    # Icon placeholder
    add_rect(cx + 125, value_y + 140, 50, 50, bg=COLOR_BG, roundness=True)
    # Title
    add_text(cx + 60, value_y + 210, title, size=20, align="center")
    cx += 350

# 5. How It Works
how_y = value_y + 400
add_rect(CANVAS_X, how_y, WIDTH, 500, bg="#ffffff", stroke="transparent")
add_text(CANVAS_X + 100, how_y + 50, "Hành Trình Gieo Mầm", size=32)

step_x = CANVAS_X + 100
steps = [
    ("1. Chọn Cây", "Chọn số lượng cây bạn muốn trồng"),
    ("2. Thanh Toán", "Quét QR hoặc chuyển khoản USDT"),
    ("3. Nhận Certificate", "Nhận chứng nhận quyền sở hữu"),
    ("4. Theo Dõi", "Xem ảnh và GPS trên Dashboard")
]
for i, (title, desc) in enumerate(steps):
    add_rect(step_x, how_y + 150, 220, 250, bg=COLOR_BG if i%2==0 else "#ffffff", stroke=COLOR_ACCENT)
    add_text(step_x + 20, how_y + 180, title, size=20, color=COLOR_ACCENT)
    add_text(step_x + 20, how_y + 220, desc, size=16, width=180)
    step_x += 260

# 6. Dashboard Preview
dash_y = how_y + 500
add_rect(CANVAS_X, dash_y, WIDTH, 600, bg=COLOR_ACCENT, stroke="transparent")
add_text(CANVAS_X + 100, dash_y + 100, "Quản Lý Khu Rừng Của Bạn", size=32, color="#ffffff")
add_button(CANVAS_X + 100, dash_y + 200, 200, 60, "Xem Demo Dashboard", bg=COLOR_GOLD, text_color="#000000")

# Phone Mockup
phone_x = CANVAS_X + 700
phone_y = dash_y + 50
add_rect(phone_x, phone_y, 300, 500, bg="#ffffff", roundness=True, stroke_width=2)
# Screen content
add_rect(phone_x + 20, phone_y + 60, 260, 150, bg="#e0e0e0", fill_style="hachure") # Map/Image
add_text(phone_x + 30, phone_y + 230, "Cây Dó Đen #1024", size=18)
add_text(phone_x + 30, phone_y + 260, "📍 14.0583° N, 108.2772° E", size=12, color="#757575")
add_rect(phone_x + 30, phone_y + 300, 260, 10, bg="#e0e0e0", roundness=True) # Progress bar
add_rect(phone_x + 30, phone_y + 300, 100, 10, bg=COLOR_ACCENT, roundness=True)

# 7. Footer
foot_y = dash_y + 600
add_rect(CANVAS_X, foot_y, WIDTH, 300, bg="#1a1a1a", stroke="transparent")
add_text(CANVAS_X + 100, foot_y + 50, "Đại Ngàn Xanh", size=24, color="#ffffff")
add_text(CANVAS_X + 100, foot_y + 100, "Kết nối con người với thiên nhiên.", size=16, color="#bdbdbd")
add_text(CANVAS_X + 500, foot_y + 50, "Liên Kết", size=18, color="#ffffff")
add_text(CANVAS_X + 500, foot_y + 100, "Về chúng tôi\nChính sách\nLiên hệ", size=16, color="#bdbdbd")


# --- Output ---
final_json = {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": elements,
    "appState": {
        "viewBackgroundColor": "#F0F0F0",
        "gridSize": GRID_SIZE
    },
    "files": {}
}

# with open(OUTPUT_FILE, "w") as f:
#     json.dump(final_json, f, indent=2)

print(json.dumps(final_json, indent=2))
