# Epic 12 Context: Trầm Hương Store

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Cho phép khách hàng duyệt danh mục sản phẩm trầm hương vật lý, xem chi tiết sản phẩm, đặt mua trực tiếp (qua chuyển khoản VietQR hoặc COD), và theo dõi đơn hàng của mình; đồng thời cung cấp công cụ quản trị sản phẩm và vận hành giao nhận cho ban quản trị. Epic này mở ra kênh doanh thu bán lẻ vật lý trực tiếp bên cạnh mô hình đầu tư cây và dịch vụ lưu trú.

## Stories

- Story 12.1: Browse Products
- Story 12.2: View Product Detail
- Story 12.3: Store Checkout Form
- Story 12.4: Create Store Order
- Story 12.5: Confirm Store Payment
- Story 12.6: View My Store Orders
- Story 12.7: Admin Product CRUD
- Story 12.8: Admin Store Order Fulfillment
- Story 12.9: Multi-Item Persistent Cart (Deferred)

## Requirements & Constraints

- **Mục tiêu thành công**: 0 sự cố bán vượt tồn kho (overselling), hiển thị tồn kho chính xác trên 95%, tỷ lệ gian lận đơn COD dưới 3%.
- **Bảo mật tạo đơn**: Tất cả thao tác tạo đơn hàng phải đi qua route máy chủ có xác thực (service role), cấm hoàn toàn anonymous insert trực tiếp vào bảng `store_orders` hoặc `store_order_items`.
- **Định dạng mã đơn hàng**: Toàn bộ mã đơn hàng thuộc cửa hàng phải có tiền tố `ST-` (ví dụ: `ST-XXXXXX`) để hệ thống thanh toán tự động phân luồng.
- **Tính toán phía máy chủ**: Giá tiền, tạm tính (subtotal), phí vận chuyển (shipping) và tổng tiền (total) bắt buộc phải được tính toán và kiểm tra toàn vẹn phía máy chủ qua Zod, không tin cậy dữ liệu giá gửi từ trình duyệt.
- **Phương thức thanh toán**: Hỗ trợ hai hình thức là Chuyển khoản ngân hàng (VietQR có thời hạn hiệu lực 15 phút) và Thanh toán khi nhận hàng (COD với trạng thái ban đầu là `pending`).
- **Trừ kho nguyên tử (Atomic Stock Decrement)**: Khi thanh toán thành công (hoặc xác nhận đơn), lượng tồn kho phải được giảm theo giao dịch nguyên tử (`SELECT ... FOR UPDATE` hoặc stored procedure) để chống race condition và overselling.
- **Giải phóng giữ chỗ quá hạn**: Đơn hàng thanh toán chuyển khoản quá thời hạn 15 phút mà chưa nhận được tiền sẽ bị hủy giữ chỗ thông qua tiến trình định kỳ (cron job).
- **Phân quyền người dùng**: Quyền quản trị sản phẩm và xử lý đơn hàng yêu cầu quyền `store_staff`, `admin`, hoặc `super_admin` thông qua kiểm tra `public.is_admin()`.

## Technical Decisions

- **Cấu trúc Route (Next.js App Router)**:
  - Khách hàng: `/store` (danh mục), `/store/[productSlug]` (chi tiết), `/store/checkout` (thanh toán), `/store/checkout/success` (kết quả đặt hàng).
  - Khách hàng đăng nhập: `/crm/my-store-orders` (lịch sử và theo dõi vận chuyển).
  - Quản trị viên: `/crm/admin/products` (quản lý sản phẩm), `/crm/admin/store-orders` (vận hành đơn hàng).
  - API nội bộ: `POST /api/store/orders/create` (tạo đơn hàng), `GET /api/store/orders/status` (kiểm tra trạng thái đơn hàng).
- **Mô hình Dữ liệu (Supabase PostgreSQL)**:
  - `products`: Thông tin sản phẩm, danh mục, xuất xứ (`origin`), số lượng tồn kho (`stock_quantity`), SKU, thông số kỹ thuật (`specs`).
  - `store_orders`: Mã đơn hàng (`code` với prefix `ST-`), thông tin giao hàng, tổng tiền, phương thức thanh toán, trạng thái (`pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered` / `cancelled`), mã vận đơn (`tracking_number`).
  - `store_order_items`: Chi tiết từng dòng sản phẩm trong đơn (`store_order_id`, `product_id`, `quantity`, `unit_price`).
  - `user_carts`: Lưu giỏ hàng cho tài khoản đã đăng nhập (sử dụng khi mở rộng giỏ hàng nhiều món, Story 12.9 deferred).
- **Lưu trữ hình ảnh**: Tải ảnh sản phẩm lên Supabase Storage bucket `product-images`, tối ưu hoá định dạng WebP và tạo thumbnail.
- **Xử lý webhook thanh toán (Casso)**: Tích hợp với webhook đa hình chung (`/api/webhooks/casso`). Webhook đọc tiền tố `ST-` từ nội dung chuyển khoản để chuyển đến handler riêng của cửa hàng, ghi nhận vào `payment_transactions` chống trùng lặp (idempotency).

## UX & Interaction Patterns

- **Catalog & Tìm kiếm**: Trang `/store` bố trí hero sản phẩm nổi bật, thanh cuộn danh mục dạng pills ngang trên di động, ô tìm kiếm theo tên/mô tả, và lưới sản phẩm hiển thị ảnh, giá, nhãn xuất xứ và tình trạng còn/hết hàng.
- **Chi tiết sản phẩm**: Trang `/store/[productSlug]` gồm gallery hình ảnh, bảng thông số kỹ thuật, giá niêm yết và giá so sánh, bộ chọn số lượng và nút bấm "Mua ngay" trực tiếp (direct checkout).
- **Thanh toán nhanh**: Form thanh toán thu thập họ tên, số điện thoại, email, địa chỉ giao hàng, tỉnh/thành, ghi chú kèm bảng tóm tắt đơn hàng và chuyển đổi phương thức Banking / COD.
- **Hiển thị VietQR**: Khi chọn chuyển khoản, hiển thị mã VietQR kèm đồng hồ đếm ngược 15 phút và nút sao chép nhanh số tài khoản/số tiền/nội dung. Khi hết hạn, hiển thị thông báo rõ ràng kèm nút đặt lại đơn.
- **Tiêu chuẩn giao diện**: Thiết kế mobile-first, tải trang công khai dưới 3 giây, hỗ trợ chuẩn WCAG 2.1 AA (tương phản màu sắc nhãn trạng thái, focus ring, nhãn ARIA).

## Cross-Story Dependencies

- **Phụ thuộc nội bộ**:
  - Story 12.4 (Create Store Order) phụ thuộc vào thông tin sản phẩm và form đặt hàng ở Story 12.2 và 12.3.
  - Story 12.5 (Confirm Store Payment) phụ thuộc vào đơn hàng đã tạo ở Story 12.4.
- **Phụ thuộc hạ tầng dùng chung (Epic 13)**:
  - **Story 13.1 (Polymorphic Casso Webhook)**: Cần router tiền tố `ST-` và bảng `payment_transactions` để kích hoạt xác nhận thanh toán tự động cho Story 12.5.
  - **Story 13.2 (Secure Order Creation APIs)**: Cung cấp endpoint an toàn, rate limit và kiểm tra Zod cho việc tạo đơn hàng ở Story 12.4.
  - **Story 13.3 (Inventory Reservation & Release)**: Cung cấp cơ chế khóa tồn kho 15 phút và cron job giải phóng tồn kho cho các đơn hàng chưa thanh toán.
  - **Story 13.4 (Server-side Price Validation)**: Đảm bảo toàn vẹn tính toán giá ở Story 12.3 và 12.4.
