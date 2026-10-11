# SonClass trên WordPress

Ứng dụng dùng giao diện React và trình soạn LaTeX của bản Next.js; PHP WordPress thay thế API, đăng nhập, cơ sở dữ liệu và lưu tệp. Không cần Node.js, Netlify hay Prisma trên hosting.

## Phát triển

Từ thư mục `wordpress`:

```powershell
npm ci
node build.mjs
node tests/domain.mjs
node node_modules/@wp-playground/cli/cli.js server --port=9403 --workers=6 --mount-dir ./sonclass /wordpress/wp-content/plugins/sonclass --blueprint=blueprint.json
```

Chờ Playground báo Ready, rồi chạy `node tests/http.mjs` và `node tests/deadline.mjs` trong terminal khác. Bộ HTTP chỉ nhắm tới localhost và tạo dữ liệu kiểm thử. Môi trường thử dùng tài khoản mặc định Playground; tuyệt đối không dùng mật khẩu thử trên hosting.

## Đóng gói và cập nhật

Build frontend, nén riêng thư mục `sonclass` thành ZIP, tải qua WordPress → Plugin → Thêm plugin → Tải plugin lên. Không đóng gói `.env`, `node_modules`, cấu hình Playground hoặc dữ liệu thử.

Gói 1.0.1 khoảng 1,84 MB, dưới giới hạn 2 MB của hosting hiện tại. Tệp tải lên qua ứng dụng cũng giới hạn 2 MB.

Kích hoạt lần đầu chỉ mở bản xem trước dành cho quản trị viên. Mục WordPress → SonClass có nút bật website mới. Việc cập nhật plugin không xóa bảng dữ liệu SonClass.

## Sử dụng

- Trang chủ: `https://sonclass.com/`
- Quản trị ứng dụng: `https://sonclass.com/admin`
- Quản trị WordPress: `https://sonclass.com/wp-admin/`
- Quản trị viên dùng tài khoản WordPress hiện có. Học sinh tạo tài khoản trong ứng dụng.
- Đề hỗ trợ trắc nghiệm, đúng/sai, trả lời ngắn, điểm riêng từng câu, công thức LaTeX và ảnh.
- Chỉ đề đã công bố mới xuất hiện cho học sinh. Đề và cách chấm được chụp riêng cho mỗi lượt làm bài; sửa đề không đổi lượt đã bắt đầu.
- Thời hạn do máy chủ kiểm soát. Đáp án đúng chỉ trả về sau khi bài kết thúc; không cho người khác đọc hoặc sửa bài làm.
- Lưu trữ ẩn nội dung khỏi trang công khai. Xóa vĩnh viễn chỉ áp dụng nội dung đã lưu trữ; đề đã có lượt thi không được xóa vĩnh viễn.

## Dữ liệu và vận hành

Hai bảng dùng tiền tố WordPress: `sc_entities` và `sc_attempts`. Tài khoản dùng WordPress, thêm meta `sc_member`, `sc_locked` và hồ sơ học sinh. Tệp mới lưu qua WordPress Uploads, đánh dấu `sc_upload`.

Công cụ dọn nội dung cũ cố định giới hạn ID bài viết ở lần kích hoạt đầu tiên, không chạm dữ liệu SonClass mới hoặc tài khoản quản trị. Dọn xóa vĩnh viễn theo yêu cầu chủ website; không tạo bản sao lưu. Gỡ plugin cũ là thao tác riêng trong WordPress.

Đặt lại mật khẩu sử dụng email WordPress: cần cấu hình gửi mail của hosting để đảm bảo email tới hộp thư. Thông tin liên hệ để trống cho khách điền trong Thiết lập; không tự suy đoán số điện thoại hay địa chỉ.

GitHub auto-deploy hiện hữu vẫn dành cho bản Netlify. Hosting WordPress cập nhật bằng ZIP; chưa thiết lập CI tự động từ GitHub cho hosting này.
