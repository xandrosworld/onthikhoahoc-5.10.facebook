# Ôn thi khóa học — demo

Next.js + Prisma + SQLite. Chạy local bằng `npm install` và `npm run dev` sau khi cấu hình `.env` và khởi tạo dữ liệu mẫu.

Netlify tự deploy nhánh `main`, dùng `npm run build:netlify` để tạo database và tài liệu mẫu trước khi build. Bật `NETLIFY_DEMO=1` và `NETLIFY_PERSISTENCE=1`, đặt `SITE_URL` theo domain HTTPS và cấu hình `AUTH_SECRET` trong Netlify.

Bản demo lưu bản SQLite dùng chung vào Netlify Blobs (`onthikhoahoc-data-v1`) và tệp tải lên vào `onthikhoahoc-uploads-v1`. Thư mục tạm chỉ là bản làm việc/cache. Mỗi thao tác đọc phiên bản mới nhất; ghi dữ liệu dùng ETag để kiểm tra xung đột và thử lại, cả transaction được lưu cùng một lần. Chỉ báo lưu thành công sau khi kho xác nhận. Database được khởi tạo từ dữ liệu mẫu **một lần**, không bị ghi đè bởi build/deploy tiếp theo; database local không bị thay đổi. Không xóa hoặc đổi tên store khi deploy cập nhật.

Cách lưu cả snapshot phù hợp bản demo ít người dùng. Khi đưa vào sử dụng với nhiều học viên đồng thời, chuyển sang database cloud quan hệ và migration trước khi tăng tải. Nếu tắt `NETLIFY_PERSISTENCE`, chế độ cũ lưu tạm ở từng instance và có thể mất nội dung.

Tài khoản demo: `admin@demo.vn` / `Admin@1234` và `hocsinh@demo.vn` / `Demo@1234`.

Soạn đề trực tiếp tại **Quản trị → Đề thi → Tạo đề thi mới**: chọn mẫu, bấm **Thêm câu hỏi** trong từng phần, nhập nội dung, đáp án và lời giải rồi **Xem thử đề** trước khi lưu hoặc công bố. Các ô nội dung, phương án A–D, mệnh đề đúng/sai và lời giải hỗ trợ LaTeX với `$...$` (trong dòng), `$$...$$` (riêng dòng), thanh chèn công thức và xem trước trực tiếp. Ví dụ: `$\dfrac{1}{2}$`, `$\sqrt{x}$`. Có thể bôi đen biểu thức rồi chọn phân số/căn trên thanh công cụ; chèn tiếp bên trong công thức sẽ giữ nguyên cặp dấu phân cách. Đáp án trả lời ngắn nhập giá trị để chấm điểm (ví dụ `0,5`), không nhập mã LaTeX.

Trình tạo đề hỗ trợ 3 mẫu (A–D; A–D + đúng/sai; đủ 3 phần). Mỗi phần có điểm mặc định, mỗi câu có thể ghi đè điểm riêng. Đúng/sai có chế độ chia đều hoặc theo mức 10%/25%/50%/100%. Kết quả lưu điểm thực, tổng điểm và điểm quy đổi thang 10; thống kê giữa các đề sử dụng điểm quy đổi.

Khi cập nhật database đã tồn tại, chạy hàm `migrateScoring` trong `scripts/scoring-migration.mjs` trong transaction sau khi sao lưu. Với Netlify Blobs, tải snapshot mới nhất, migration bản sao, rồi ghi có điều kiện theo ETag; không chạy seed lên kho dùng chung. Các trường điểm null giữ cách chấm cũ. Mỗi lượt mới lưu snapshot đề và cách chấm; câu bị bỏ khỏi đề được đánh dấu retired để giữ bài làm cũ.
