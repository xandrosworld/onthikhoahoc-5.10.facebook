# Ôn thi khóa học — demo

Next.js + Prisma + SQLite. Chạy local bằng `npm install` và `npm run dev` sau khi cấu hình `.env` và khởi tạo dữ liệu mẫu.

Netlify tự deploy nhánh `main`, dùng `npm run build:netlify` để tạo database và tài liệu demo trước khi build. Bật `NETLIFY_DEMO=1`, đặt `SITE_URL` theo domain HTTPS và cấu hình `AUTH_SECRET` trong Netlify.

Demo trên Netlify sử dụng SQLite và uploads trong thư mục tạm của từng serverless instance. Dữ liệu phát sinh không được đảm bảo lưu lâu dài hoặc chia sẻ giữa các instance, và có thể reset khi instance khởi động lại hoặc deploy lại. Dữ liệu mẫu được tạo lại mỗi lần build; database local không bị thay đổi.

Tài khoản demo: `admin@demo.vn` / `Admin@1234` và `hocsinh@demo.vn` / `Demo@1234`.
