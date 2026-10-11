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

Gói 1.1.2 khoảng 1,84 MB, dưới giới hạn 2 MB của hosting hiện tại. Tệp tải lên qua ứng dụng cũng giới hạn 2 MB.

Kích hoạt lần đầu chỉ mở bản xem trước dành cho quản trị viên. Mục WordPress → SonClass có nút bật website mới. Việc cập nhật plugin không xóa bảng dữ liệu SonClass.

## Sử dụng

- Trang chủ: `https://sonclass.com/`
- Quản trị ứng dụng: `https://sonclass.com/admin`
- Quản trị WordPress: `https://sonclass.com/wp-admin/`
- Quản trị viên dùng tài khoản WordPress hiện có. Học sinh tạo tài khoản trong ứng dụng.
- Đề hỗ trợ 4 mẫu; mẫu 4 gồm trắc nghiệm, đúng/sai, trả lời ngắn và tự luận. Học sinh nhập bài tự luận (tối đa 12.000 ký tự, có LaTeX), tự lưu như các phần khác.
- Giáo viên vào Kết quả thi → bài đã nộp → Chấm phần tự luận. Có điểm riêng từng câu, nhận xét, kiểm tra giới hạn điểm và chống ghi đè khi hai phiên chấm đồng thời. Kết quả hiện điểm tạm thời và số câu chờ chấm; chỉ hoàn tất khi đã chấm hết.
- Chỉ đề đã công bố mới xuất hiện cho học sinh. Đề và cách chấm được chụp riêng cho mỗi lượt làm bài; sửa đề không đổi lượt đã bắt đầu.
- Thời hạn do máy chủ kiểm soát. Đáp án đúng chỉ trả về sau khi bài kết thúc; không cho người khác đọc hoặc sửa bài làm.
- Lưu trữ ẩn nội dung khỏi trang công khai. Xóa vĩnh viễn chỉ áp dụng nội dung đã lưu trữ; đề đã có lượt thi không được xóa vĩnh viễn.

## Dữ liệu và vận hành

Hai bảng dùng tiền tố WordPress: `sc_entities` và `sc_attempts`. Tài khoản dùng WordPress, thêm meta `sc_member`, `sc_locked` và hồ sơ học sinh. Tệp mới lưu qua WordPress Uploads, đánh dấu `sc_upload`.

Công cụ dọn nội dung cũ cố định giới hạn ID bài viết ở lần kích hoạt đầu tiên, không chạm dữ liệu SonClass mới hoặc tài khoản quản trị. Dọn xóa vĩnh viễn theo yêu cầu chủ website; không tạo bản sao lưu. Gỡ plugin cũ là thao tác riêng trong WordPress.

Đặt lại mật khẩu sử dụng email WordPress: cần cấu hình gửi mail của hosting để đảm bảo email tới hộp thư. Chân trang 4 cột dùng thông tin liên hệ trong Thiết lập; không lấy số điện thoại hoặc địa chỉ giả từ demo.

GitHub auto-deploy hiện hữu vẫn dành cho bản Netlify. Hosting WordPress cập nhật bằng ZIP; chưa thiết lập CI tự động từ GitHub cho hosting này.

## Đồng bộ nội dung demo (11/10/2026)

`node scripts/export-demo.mjs` đọc nội dung soạn đề, khóa học và bài viết từ demo bằng tài khoản demo công khai trong README. Không xuất người dùng hoặc kết quả thi. Tệp xuất nằm trong `.runtime` đã loại khỏi Git.

`node scripts/import-demo.mjs` xem kế hoạch; thêm `--apply` để chuyển sang SonClass. Script chuyển ảnh/PDF sang WordPress Uploads, giữ điểm đề cũ, chuẩn hóa ngày React, ghi manifest để tiếp tục không tạo bản sao trùng. Nội dung cùng tên đã có ở đích được giữ nguyên để bảo toàn chỉnh sửa của khách.

Đã chuyển 6 đề công bố (gồm 2 đề giữa kì 1 lớp 12, mỗi đề 12 + 4 + 6 câu), 8 bài viết/tài liệu và 24 tệp ảnh/PDF. Giữ 4 khóa học khách đã tạo/chỉnh sửa trên SonClass, gồm khóa luyện đề đã đổi tên thành “Luyện đề THPT- ĐGNL - ĐGTD”; bản nhập trùng khóa này đã được lưu trữ. Nội dung tự luận không tự bổ sung vào hai đề gốc.

Kiểm thử bổ sung: `node tests/essay.mjs` chạy trên localhost, bao gồm lưu bài tự luận, phân quyền, điểm tạm thời, chấm lại, điểm 0, giới hạn điểm và xung đột phiên chấm. `npm test` tại gốc có kiểm thử định dạng ngày WordPress và dữ liệu demo.
