// Seed dữ liệu demo. Chạy: npm run db:seed  (xóa toàn bộ dữ liệu cũ và nạp lại)
import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { gradeAttempt } from '../src/lib/grading.js';
import { slugify } from '../src/lib/utils.js';

const { PrismaClient } = pkg;
const db = new PrismaClient();

/* ---------- tiện ích ---------- */
let seedN = 20240611;
const rnd = () => { seedN |= 0; seedN = (seedN + 0x6d2b79f5) | 0; let t = Math.imul(seedN ^ (seedN >>> 15), 1 | seedN); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000);

const mc = (content, opts, correct, explanation = '') => ({ content, explanation, options: opts.map((c, i) => ({ label: 'ABCD'[i], content: c, isCorrect: i === correct })) });
const tf = (content, sts, explanation = '') => ({ content, explanation, statements: sts.map(([c, v], i) => ({ label: 'abcd'[i], content: c, isTrue: v })) });
const sa = (content, answers, explanation = '') => ({ content, explanation, answers });

/* ---------- đề thi ---------- */
const EXAMS = [
  {
    title: 'Đề luyện thi Toán 12 – Số 01', grade: '12', durationMinutes: 90, shuffleQuestions: true, status: 'PUBLISHED', ago: 12,
    description: 'Đề luyện tập theo cấu trúc mới gồm ba phần, bao quát giải tích, hình học Oxyz và xác suất. Phù hợp ôn tập giữa học kì II.',
    mc: [
      mc('Cho hàm số $f(x)=x^3-3x+2$. Giá trị cực đại của hàm số là', ['$0$', '$4$', '$2$', '$-1$'], 1, 'Ta có $f\'(x)=3x^2-3=0\\Leftrightarrow x=\\pm1$. Hàm số đạt cực đại tại $x=-1$ và $f(-1)=4$.'),
      mc('Đạo hàm của hàm số $y=\\ln(x^2+1)$ là', ['$\\dfrac{1}{x^2+1}$', '$\\dfrac{2x}{x^2+1}$', '$\\dfrac{2x}{(x^2+1)^2}$', '$2x\\ln(x^2+1)$'], 1, 'Áp dụng $(\\ln u)\'=\\dfrac{u\'}{u}$ với $u=x^2+1$.'),
      mc('Tập nghiệm của bất phương trình $\\log_2(x-1)<3$ là', ['$(1;9)$', '$(-\\infty;9)$', '$(1;8)$', '$(9;+\\infty)$'], 0, 'Điều kiện $x>1$. Bất phương trình tương đương $x-1<2^3=8$, tức $1<x<9$.'),
      mc('Tích phân $I=\\displaystyle\\int_0^1 (2x+1)\\,dx$ bằng', ['$1$', '$2$', '$3$', '$0$'], 1, '$I=\\left(x^2+x\\right)\\Big|_0^1=2$.'),
      mc('Cho cấp số cộng $(u_n)$ có $u_1=3$ và công sai $d=2$. Số hạng $u_{10}$ bằng', ['$21$', '$23$', '$20$', '$25$'], 0, '$u_{10}=u_1+9d=3+18=21$.'),
      mc('Giá trị của $\\displaystyle\\lim_{x\\to 2}\\dfrac{x^2-4}{x-2}$ bằng', ['$0$', '$2$', '$4$', 'Không tồn tại'], 2, 'Phân tích $x^2-4=(x-2)(x+2)$ nên giới hạn bằng $\\lim_{x\\to2}(x+2)=4$.'),
      mc('Trong không gian $Oxyz$, mặt cầu $(S):(x-1)^2+(y+2)^2+z^2=9$ có bán kính bằng', ['$9$', '$3$', '$81$', '$\\sqrt{3}$'], 1, 'Vế phải bằng $R^2=9$ nên $R=3$.'),
      mc('Nghiệm của phương trình $2^{2x-1}=8$ là', ['$x=1$', '$x=2$', '$x=3$', '$x=4$'], 1, '$2^{2x-1}=2^3\\Leftrightarrow 2x-1=3\\Leftrightarrow x=2$.'),
      mc('Cho hai vectơ $\\vec{a}=(1;2;-1)$ và $\\vec{b}=(2;-1;3)$. Tích vô hướng $\\vec{a}\\cdot\\vec{b}$ bằng', ['$3$', '$-3$', '$0$', '$-1$'], 1, '$\\vec{a}\\cdot\\vec{b}=1\\cdot2+2\\cdot(-1)+(-1)\\cdot3=-3$.'),
      mc('Họ nguyên hàm của hàm số $f(x)=\\cos 2x$ là', ['$\\dfrac{1}{2}\\sin 2x+C$', '$2\\sin 2x+C$', '$-\\dfrac{1}{2}\\sin 2x+C$', '$\\sin 2x+C$'], 0, '$\\int\\cos(ax)\\,dx=\\dfrac1a\\sin(ax)+C$.'),
    ],
    tf: [
      tf('Cho hàm số $f(x)=x^3-3x^2+1$.', [['Đạo hàm của hàm số là $f\'(x)=3x^2-6x$.', true], ['Hàm số đồng biến trên khoảng $(0;2)$.', false], ['Hàm số đạt cực đại tại $x=0$.', true], ['Giá trị cực tiểu của hàm số bằng $-3$.', true]], 'Ta có $f\'(x)=3x(x-2)$. Trên $(0;2)$ thì $f\'<0$ nên hàm số nghịch biến. $f$ đạt cực đại tại $x=0$ ($f(0)=1$) và cực tiểu tại $x=2$ ($f(2)=-3$).'),
      tf('Trong không gian $Oxyz$, cho điểm $A(1;2;3)$ và mặt phẳng $(P):2x-y+2z-1=0$.', [['Một vectơ pháp tuyến của $(P)$ là $\\vec{n}=(2;-1;2)$.', true], ['Điểm $A$ thuộc mặt phẳng $(P)$.', false], ['Khoảng cách từ $A$ đến $(P)$ bằng $\\dfrac{5}{3}$.', true], ['Mặt phẳng $(Q):2x-y+2z+5=0$ song song với $(P)$.', true]], 'Thay tọa độ $A$: $2-2+6-1=5\\neq0$. $d(A,(P))=\\dfrac{|5|}{\\sqrt{4+1+4}}=\\dfrac53$.'),
      tf('Một hộp chứa $5$ bi đỏ và $4$ bi xanh. Lấy ngẫu nhiên đồng thời $3$ viên bi.', [['Số cách lấy $3$ viên bi bất kì là $C_9^3=84$.', true], ['Số cách lấy được $3$ viên bi đều màu đỏ là $10$.', true], ['Xác suất để lấy được ít nhất một bi xanh bằng $\\dfrac{5}{6}$.', false], ['Xác suất để lấy được đúng $2$ bi đỏ và $1$ bi xanh bằng $\\dfrac{10}{21}$.', true]], 'Xác suất ít nhất một bi xanh là $1-\\dfrac{10}{84}=\\dfrac{37}{42}$. Xác suất đúng 2 đỏ, 1 xanh: $\\dfrac{C_5^2\\cdot4}{84}=\\dfrac{10}{21}$.'),
    ],
    sa: [
      sa('Tiệm cận ngang của đồ thị hàm số $y=\\dfrac{2x+1}{x-1}$ là đường thẳng $y=a$. Tìm $a$.', ['2'], '$\\lim_{x\\to\\infty}\\dfrac{2x+1}{x-1}=2$.'),
      sa('Giá trị nhỏ nhất của hàm số $f(x)=x^2-4x+7$ bằng bao nhiêu?', ['3'], '$f(x)=(x-2)^2+3\\ge3$.'),
      sa('Tính tích phân $\\displaystyle\\int_0^2 3x^2\\,dx$.', ['8'], '$\\int_0^2 3x^2dx=x^3\\Big|_0^2=8$.'),
      sa('Cho cấp số nhân $(u_n)$ có $u_1=2$ và $u_4=54$. Tìm công bội $q$.', ['3'], '$u_4=u_1q^3\\Rightarrow q^3=27\\Rightarrow q=3$.'),
      sa('Tính giá trị biểu thức $\\log_2 8+\\log_3 9$.', ['5'], '$\\log_28=3$, $\\log_39=2$.'),
      sa('Gieo một đồng xu cân đối hai lần. Tính xác suất để có đúng một lần xuất hiện mặt sấp (viết dưới dạng số thập phân).', ['0,5', '0.5', '1/2'], 'Không gian mẫu có $4$ phần tử, biến cố có $2$ phần tử nên $P=\\dfrac24=0{,}5$.'),
    ],
  },
  {
    title: 'Đề luyện thi Toán 12 – Số 02', grade: '12', durationMinutes: 90, shuffleQuestions: true, status: 'PUBLISHED', ago: 4,
    description: 'Đề rút gọn tập trung vào nguyên hàm – tích phân, đồ thị hàm phân thức và tổ hợp. Phù hợp luyện tốc độ trước kỳ thi.',
    mc: [
      mc('Trên khoảng $(0;+\\infty)$, họ nguyên hàm của hàm số $f(x)=\\dfrac{1}{x}$ là', ['$\\ln x+C$', '$-\\dfrac{1}{x^2}+C$', '$\\dfrac{1}{x^2}+C$', '$e^x+C$'], 0),
      mc('Thể tích khối chóp có diện tích đáy $B=6$ và chiều cao $h=4$ bằng', ['$24$', '$12$', '$8$', '$10$'], 2, '$V=\\dfrac13Bh=\\dfrac13\\cdot6\\cdot4=8$.'),
      mc('Số nghiệm thực của phương trình $x^4-5x^2+4=0$ là', ['$1$', '$2$', '$3$', '$4$'], 3, 'Đặt $t=x^2\\ge0$: $t^2-5t+4=0\\Rightarrow t=1$ hoặc $t=4$, suy ra $x=\\pm1$, $x=\\pm2$.'),
      mc('Phương trình mặt phẳng đi qua $A(1;0;0)$ và có vectơ pháp tuyến $\\vec{n}=(1;1;1)$ là', ['$x+y+z-1=0$', '$x+y+z+1=0$', '$x-y+z-1=0$', '$x+y+z=0$'], 0),
      mc('Số hoán vị của $5$ phần tử phân biệt là', ['$24$', '$60$', '$120$', '$5$'], 2, '$5!=120$.'),
    ],
    tf: [
      tf('Cho hàm số $y=\\dfrac{x+1}{x-2}$.', [['Tập xác định của hàm số là $\\mathbb{R}\\setminus\\{2\\}$.', true], ['Đồ thị hàm số có tiệm cận đứng là đường thẳng $x=2$.', true], ['Đồ thị hàm số có tiệm cận ngang là đường thẳng $y=1$.', true], ['Hàm số đồng biến trên tập xác định.', false]], 'Ta có $y\'=\\dfrac{-3}{(x-2)^2}<0$ nên hàm số nghịch biến trên từng khoảng xác định.'),
      tf('Cho hàm số $F(x)=x^2+\\sin x$ và $f(x)=2x+\\cos x$.', [['$F\'(x)=2x+\\cos x$.', true], ['$F(x)$ là một nguyên hàm của $f(x)$ trên $\\mathbb{R}$.', true], ['$\\displaystyle\\int_0^{\\pi}f(x)\\,dx=\\pi^2$.', true], ['$F(0)=1$.', false]]),
    ],
    sa: [
      sa('Tính $\\displaystyle\\int_1^e\\dfrac{dx}{x}$.', ['1']),
      sa('Tìm giá trị của $m$ để hàm số $y=x^3-3x+m$ có giá trị cực tiểu bằng $0$.', ['2'], 'Cực tiểu tại $x=1$: $y(1)=m-2=0\\Rightarrow m=2$.'),
      sa('Có bao nhiêu số tự nhiên có $3$ chữ số khác nhau được lập từ các chữ số $1,2,3,4,5$?', ['60'], '$A_5^3=5\\cdot4\\cdot3=60$.'),
    ],
  },
  {
    title: 'Đề kiểm tra Toán 11 – Giới hạn và Đạo hàm', grade: '11', durationMinutes: 45, shuffleQuestions: true, status: 'PUBLISHED', ago: 8,
    description: 'Bài kiểm tra 45 phút về giới hạn của dãy số, hàm số và các quy tắc tính đạo hàm cơ bản.',
    mc: [
      mc('Giới hạn $\\displaystyle\\lim_{x\\to+\\infty}\\dfrac{3x+1}{x-2}$ bằng', ['$1$', '$2$', '$3$', '$+\\infty$'], 2),
      mc('Đạo hàm của hàm số $y=x^5$ là', ['$x^4$', '$5x^4$', '$5x^5$', '$4x^5$'], 1),
      mc('Đạo hàm của hàm số $y=\\sin x\\cos x$ là', ['$\\sin 2x$', '$\\cos 2x$', '$-\\cos 2x$', '$2\\cos 2x$'], 1, '$y=\\dfrac12\\sin2x\\Rightarrow y\'=\\cos2x$.'),
      mc('Hệ số góc của tiếp tuyến của đồ thị hàm số $y=x^2$ tại điểm có hoành độ $x=3$ bằng', ['$3$', '$6$', '$9$', '$2$'], 1),
      mc('Giới hạn $\\displaystyle\\lim_{x\\to0}\\dfrac{\\sin 3x}{x}$ bằng', ['$0$', '$1$', '$3$', '$\\dfrac13$'], 2),
      mc('Đạo hàm của hàm số $y=\\dfrac{x+1}{x-1}$ là', ['$\\dfrac{2}{(x-1)^2}$', '$\\dfrac{-2}{(x-1)^2}$', '$\\dfrac{-1}{(x-1)^2}$', '$\\dfrac{1}{(x-1)^2}$'], 1),
    ],
    tf: [
      tf('Cho hàm số $f(x)=x^3-3x+1$.', [['$f\'(x)=3x^2-3$.', true], ['$f\'(1)=0$.', true], ['Tiếp tuyến của đồ thị tại điểm có hoành độ $x=0$ là $y=-3x+1$.', true], ['$f\'\'(1)=3$.', false]], 'Vì $f\'\'(x)=6x$ nên $f\'\'(1)=6$.'),
      tf('Xét các giới hạn sau.', [['$\\displaystyle\\lim_{n\\to\\infty}\\dfrac1n=0$.', true], ['$\\displaystyle\\lim_{x\\to1}\\dfrac{x^2-1}{x-1}=2$.', true], ['$\\displaystyle\\lim_{x\\to+\\infty}(x^2-x)=-\\infty$.', false], ['$\\displaystyle\\lim_{x\\to0^+}\\dfrac1x=+\\infty$.', true]]),
    ],
    sa: [
      sa('Tính $\\displaystyle\\lim_{x\\to1}\\dfrac{x^2-1}{x^2-3x+2}$.', ['-2'], 'Rút gọn $\\dfrac{(x-1)(x+1)}{(x-1)(x-2)}=\\dfrac{x+1}{x-2}\\to-2$.'),
      sa('Cho hàm số $y=x^3-2x$. Tính $y\'(2)$.', ['10'], '$y\'=3x^2-2\\Rightarrow y\'(2)=10$.'),
      sa('Tính tổng $S=1+\\dfrac12+\\dfrac14+\\dfrac18+\\cdots$', ['2'], 'Cấp số nhân lùi vô hạn: $S=\\dfrac{1}{1-\\frac12}=2$.'),
    ],
  },
  {
    title: 'Đề khảo sát Toán 10 – Hàm số bậc hai', grade: '10', durationMinutes: 45, shuffleQuestions: false, status: 'PUBLISHED', ago: 15,
    description: 'Khảo sát kiến thức về parabol, bảng biến thiên và bất phương trình bậc hai. Thứ tự câu hỏi được giữ cố định.',
    mc: [
      mc('Tọa độ đỉnh của parabol $y=x^2-4x+3$ là', ['$(2;-1)$', '$(-2;1)$', '$(4;3)$', '$(1;0)$'], 0),
      mc('Trục đối xứng của parabol $y=2x^2-8x+1$ là đường thẳng', ['$x=2$', '$x=-2$', '$x=4$', '$x=1$'], 0),
      mc('Hàm số $y=-x^2+2x+3$ đồng biến trên khoảng', ['$(-\\infty;1)$', '$(1;+\\infty)$', '$(-\\infty;3)$', '$(-1;+\\infty)$'], 0),
      mc('Tập nghiệm của bất phương trình $x^2-5x+6\\le0$ là', ['$[2;3]$', '$(2;3)$', '$(-\\infty;2]\\cup[3;+\\infty)$', '$[-3;-2]$'], 0),
      mc('Số giao điểm của parabol $y=x^2-2x-3$ với trục hoành là', ['$0$', '$1$', '$2$', '$3$'], 2),
      mc('Tập xác định của hàm số $y=\\sqrt{x-2}+\\dfrac{1}{x-5}$ là', ['$[2;+\\infty)\\setminus\\{5\\}$', '$(2;+\\infty)$', '$\\mathbb{R}\\setminus\\{5\\}$', '$[2;5)$'], 0),
    ],
    tf: [
      tf('Cho parabol $(P):y=x^2-2x-3$.', [['Đỉnh của $(P)$ là $I(1;-4)$.', true], ['$(P)$ cắt trục tung tại điểm $(0;-3)$.', true], ['$(P)$ cắt trục hoành tại hai điểm có hoành độ $x=-1$ và $x=3$.', true], ['Hàm số nghịch biến trên khoảng $(1;+\\infty)$.', false]]),
      tf('Cho hàm số $y=ax^2+bx+c$ với $a\\neq0$.', [['Nếu $a>0$ thì parabol có bề lõm hướng lên trên.', true], ['Hoành độ đỉnh của parabol là $x=-\\dfrac{b}{2a}$.', true], ['Nếu $a>0$ và $\\Delta<0$ thì $y>0$ với mọi $x$.', true], ['Parabol luôn cắt trục hoành.', false]]),
    ],
    sa: [
      sa('Giá trị lớn nhất của hàm số $y=-x^2+4x+1$ bằng bao nhiêu?', ['5']),
      sa('Tìm $m$ để parabol $y=x^2-2x+m$ có đỉnh nằm trên trục hoành.', ['1'], 'Đỉnh $I(1;m-1)$ nằm trên $Ox$ khi $m-1=0$.'),
      sa('Tính tổng các nghiệm của phương trình $x^2-7x+10=0$.', ['7'], 'Theo Vi-ét, tổng hai nghiệm bằng $7$.'),
    ],
  },
  {
    title: 'Đề thi thử Toán 12 – Số 03 (đang soạn)', grade: '12', durationMinutes: 90, shuffleQuestions: true, status: 'DRAFT', ago: 1,
    description: 'Bản nháp đang soạn, chưa công bố cho học sinh.',
    mc: [
      mc('Cho hàm số $y=x^4-2x^2+1$. Số điểm cực trị của hàm số là', ['$1$', '$2$', '$3$', '$0$'], 2),
      mc('Giá trị của $\\displaystyle\\int_0^{\\pi/2}\\sin x\\,dx$ bằng', ['$0$', '$1$', '$-1$', '$\\dfrac{\\pi}{2}$'], 1),
      mc('Ma trận $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ có định thức bằng', ['$-2$', '$2$', '$10$', '$-10$'], 0, '$\\det A=1\\cdot4-2\\cdot3=-2$.'),
    ],
    tf: [
      tf('Cho hàm số $f(x)=e^{x}-x$.', [['$f\'(x)=e^x-1$.', true], ['Hàm số đạt cực tiểu tại $x=0$.', true], ['$f(0)=0$.', false], ['Hàm số đồng biến trên $\\mathbb{R}$.', false]]),
    ],
    sa: [sa('Tính $\\displaystyle\\lim_{x\\to0}\\dfrac{e^x-1}{x}$.', ['1'])],
  },
];

/* ---------- khóa học ---------- */
const COURSES = [
  {
    title: 'Toán 10 – Nền tảng', grade: '10', theme: 'teal', featured: true,
    summary: 'Xây dựng nền tảng vững chắc về đại số, hàm số và hình học phẳng để tự tin bước vào chương trình THPT.',
    audience: 'Học sinh lớp 10 mất căn bản hoặc muốn học trước chương trình; học sinh vừa hoàn thành lớp 9.',
    duration: '32 buổi · 4 tháng', schedule: 'Thứ 3, Thứ 5 · 18:00 – 19:30', tuition: 'Liên hệ để được tư vấn',
    teacherName: 'Thầy Nguyễn Minh Khoa', teacherBio: 'Thạc sĩ Toán học, hơn 12 năm giảng dạy và luyện thi. Từng bồi dưỡng học sinh giỏi cấp thành phố.',
    description: 'Khóa học **Toán 10 – Nền tảng** giúp học sinh hiểu bản chất các khái niệm thay vì học thuộc công thức.\n\n## Bạn sẽ đạt được gì?\n\n- Nắm chắc mệnh đề, tập hợp, hàm số và đồ thị.\n- Giải thành thạo phương trình, bất phương trình bậc hai: $ax^2+bx+c=0$.\n- Biết vận dụng vectơ và hệ thức lượng trong tam giác.\n\n## Phương pháp học\n\nMỗi buổi học gồm phần lý thuyết ngắn, luyện tập có hướng dẫn và bài kiểm tra 10 phút. Cuối mỗi chương học sinh làm đề luyện trực tuyến để đo mức độ nắm bài.',
    syllabus: [
      ['Chương 1 – Mệnh đề và tập hợp', ['Mệnh đề, mệnh đề chứa biến', 'Các phép toán trên tập hợp', 'Các tập hợp số']],
      ['Chương 2 – Hàm số bậc nhất và bậc hai', ['Khái niệm hàm số, đồ thị', 'Hàm số bậc hai: $y=ax^2+bx+c$', 'Dấu của tam thức bậc hai']],
      ['Chương 3 – Phương trình và bất phương trình', ['Phương trình quy về bậc hai', 'Bất phương trình bậc hai một ẩn', 'Hệ phương trình']],
      ['Chương 4 – Vectơ và hệ thức lượng', ['Các phép toán vectơ', 'Tích vô hướng của hai vectơ', 'Định lí cosin và định lí sin']],
    ],
  },
  {
    title: 'Toán 11 – Chuyên đề', grade: '11', theme: 'navy', featured: true,
    summary: 'Hệ thống chuyên đề lượng giác, dãy số, giới hạn, đạo hàm và hình học không gian với bài tập phân loại theo mức độ.',
    audience: 'Học sinh lớp 11 muốn nâng cao điểm trên lớp và chuẩn bị nền tảng cho năm lớp 12.',
    duration: '36 buổi · 5 tháng', schedule: 'Thứ 2, Thứ 4 · 18:30 – 20:00', tuition: 'Liên hệ để được tư vấn',
    teacherName: 'Cô Trần Thu Hà', teacherBio: 'Cử nhân Sư phạm Toán, 9 năm kinh nghiệm. Nổi tiếng với cách giảng giải rõ ràng, dễ hiểu.',
    description: 'Khóa học **Toán 11 – Chuyên đề** đi sâu từng chuyên đề trọng tâm, phân loại bài tập từ nhận biết đến vận dụng cao.\n\n## Điểm nổi bật\n\n- Mỗi chuyên đề có bộ bài tập ba mức độ.\n- Chữa chi tiết các lỗi sai phổ biến.\n- Kiểm tra định kỳ theo cấu trúc đề thi mới.\n\nVí dụ một bài toán điển hình: tính giới hạn $$\\lim_{x\\to 0}\\dfrac{\\sin 3x}{x}=3.$$',
    syllabus: [
      ['Chuyên đề 1 – Lượng giác', ['Công thức lượng giác cơ bản', 'Phương trình lượng giác thường gặp']],
      ['Chuyên đề 2 – Dãy số, cấp số cộng, cấp số nhân', ['Dãy số và quy luật', 'Cấp số cộng, cấp số nhân', 'Bài toán thực tế']],
      ['Chuyên đề 3 – Giới hạn và liên tục', ['Giới hạn của dãy số', 'Giới hạn của hàm số', 'Hàm số liên tục']],
      ['Chuyên đề 4 – Đạo hàm', ['Định nghĩa và quy tắc tính đạo hàm', 'Tiếp tuyến của đồ thị hàm số', 'Đạo hàm cấp hai']],
      ['Chuyên đề 5 – Hình học không gian', ['Quan hệ song song', 'Quan hệ vuông góc', 'Góc và khoảng cách']],
    ],
  },
  {
    title: 'Toán 12 – Luyện thi THPT', grade: '12', theme: 'indigo', featured: true,
    summary: 'Chương trình ôn luyện toàn diện lớp 12: khảo sát hàm số, nguyên hàm – tích phân, Oxyz, xác suất và thống kê.',
    audience: 'Học sinh lớp 12 đặt mục tiêu 8+ trong kỳ thi tốt nghiệp THPT và xét tuyển đại học.',
    duration: '48 buổi · 7 tháng', schedule: 'Thứ 3, Thứ 5, Thứ 7 · 18:00 – 20:00', tuition: 'Liên hệ để được tư vấn',
    teacherName: 'Thầy Nguyễn Minh Khoa', teacherBio: 'Thạc sĩ Toán học, hơn 12 năm luyện thi THPT. Hàng trăm học sinh đạt từ 9 điểm trở lên.',
    description: 'Khóa **Toán 12 – Luyện thi THPT** bám sát cấu trúc đề thi mới với ba phần: trắc nghiệm nhiều phương án, đúng/sai và trả lời ngắn.\n\n## Lộ trình\n\n1. Hệ thống lại kiến thức nền tảng.\n2. Luyện chuyên đề theo từng dạng bài.\n3. Luyện đề tổng hợp có tính giờ, chấm điểm trực tuyến.\n\n> Học viên được sử dụng không giới hạn hệ thống đề luyện thi trực tuyến của trung tâm.\n\nMột ví dụ trọng tâm: tính tích phân $$I=\\int_0^1 \\dfrac{x}{\\sqrt{x^2+1}}\\,dx=\\sqrt2-1.$$',
    syllabus: [
      ['Phần 1 – Giải tích', ['Tính đơn điệu, cực trị, GTLN – GTNN', 'Đường tiệm cận, khảo sát và vẽ đồ thị', 'Mũ – logarit', 'Nguyên hàm, tích phân và ứng dụng']],
      ['Phần 2 – Hình học', ['Khối đa diện, thể tích', 'Mặt nón, mặt trụ, mặt cầu', 'Phương pháp tọa độ trong không gian Oxyz']],
      ['Phần 3 – Xác suất thống kê', ['Tổ hợp, xác suất', 'Phân tích dữ liệu thống kê']],
      ['Phần 4 – Luyện đề', ['10 đề tổng hợp theo cấu trúc mới', 'Chiến lược phân bổ thời gian làm bài']],
    ],
  },
  {
    title: 'Luyện đề THPT Quốc gia', grade: '12', theme: 'amber', featured: false,
    summary: 'Khóa cấp tốc 12 buổi: luyện đề, chữa đề chi tiết và rèn kỹ năng làm bài nhanh – chính xác trước kỳ thi.',
    audience: 'Học sinh lớp 12 đã học xong chương trình, cần rèn tốc độ và hệ thống lại các dạng bài.',
    duration: '12 buổi · 6 tuần', schedule: 'Thứ 7, Chủ nhật · 8:00 – 11:30', tuition: 'Liên hệ để được tư vấn',
    teacherName: 'Cô Lê Phương Anh', teacherBio: 'Thạc sĩ Giáo dục học, chuyên gia phân tích đề thi và chiến lược làm bài.',
    description: 'Khóa **Luyện đề THPT Quốc gia** dành cho giai đoạn nước rút.\n\n## Nội dung\n\n- Mỗi buổi: làm 1 đề trong 90 phút, chữa chi tiết trong 90 phút.\n- Phân tích điểm mạnh – điểm yếu của từng học sinh.\n- Chiến lược xử lý câu đúng/sai và trả lời ngắn.',
    syllabus: [
      ['Giai đoạn 1 – Đánh giá năng lực', ['Đề khảo sát đầu vào', 'Phân tích kết quả cá nhân']],
      ['Giai đoạn 2 – Luyện đề theo cấu trúc mới', ['8 đề luyện tập có tính giờ', 'Chữa đề và rút kinh nghiệm']],
      ['Giai đoạn 3 – Tăng tốc', ['Kỹ thuật bấm máy tính', 'Chiến lược phân bổ thời gian', 'Đề thi thử cuối khóa']],
    ],
  },
];

/* ---------- bài viết ---------- */
const POSTS = [
  { title: 'Tổng hợp công thức đạo hàm và nguyên hàm cần nhớ', category: 'TAI_LIEU', theme: 'indigo', ago: 2, pdf: true,
    excerpt: 'Bảng công thức đạo hàm, nguyên hàm và các quy tắc tính cơ bản, kèm ví dụ minh họa. Tải về bản PDF để in.',
    content: '## Bảng đạo hàm cơ bản\n\n- $(x^n)\'=n\\,x^{n-1}$\n- $(\\sin x)\'=\\cos x$, $(\\cos x)\'=-\\sin x$\n- $(e^x)\'=e^x$, $(\\ln x)\'=\\dfrac{1}{x}$\n\n## Quy tắc tính\n\nVới $u=u(x)$ và $v=v(x)$:\n\n$$\\left(\\dfrac{u}{v}\\right)\'=\\dfrac{u\'v-uv\'}{v^2}$$\n\n## Bảng nguyên hàm\n\n$$\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C\\quad(n\\neq-1)$$\n\n$$\\int \\dfrac{1}{x}\\,dx=\\ln|x|+C,\\qquad \\int e^x\\,dx=e^x+C$$\n\n> Mẹo: luôn kiểm tra lại kết quả bằng cách lấy đạo hàm của nguyên hàm vừa tìm.\n\nBản PDF đính kèm bên dưới có thể in ra dán bàn học.' },
  { title: 'Cấu trúc đề thi tốt nghiệp THPT môn Toán và cách phân bổ thời gian', category: 'KINH_NGHIEM', theme: 'navy', ago: 5,
    excerpt: 'Hiểu rõ ba phần của đề thi và chiến lược phân bổ 90 phút để tối đa hóa điểm số.',
    content: 'Đề thi môn Toán gồm **ba phần** với cách chấm điểm khác nhau:\n\n## Phần I – Trắc nghiệm nhiều phương án\n\nMỗi câu có bốn lựa chọn A, B, C, D và chỉ một đáp án đúng.\n\n## Phần II – Trắc nghiệm đúng/sai\n\nMỗi câu có bốn mệnh đề a), b), c), d). Điểm tăng theo số ý đúng: 1 ý đúng được $0{,}1$ điểm, 2 ý được $0{,}25$, 3 ý được $0{,}5$ và đủ 4 ý được $1$ điểm.\n\n## Phần III – Trả lời ngắn\n\nĐiền kết quả là một số, không cần trình bày lời giải.\n\n## Gợi ý phân bổ thời gian\n\n1. Phần I: khoảng 35 phút.\n2. Phần II: khoảng 30 phút.\n3. Phần III: khoảng 20 phút.\n4. Còn lại 5 phút để rà soát.' },
  { title: '5 sai lầm thường gặp khi giải bài toán cực trị hàm số', category: 'KINH_NGHIEM', theme: 'plum', ago: 7,
    excerpt: 'Những lỗi học sinh hay mắc phải khi tìm cực trị và cách tránh chúng.',
    content: '## 1. Chỉ giải $f\'(x)=0$ mà quên xét dấu\n\nĐiều kiện $f\'(x_0)=0$ chỉ là điều kiện **cần**. Phải xét dấu $f\'(x)$ quanh $x_0$.\n\nVí dụ: $f(x)=x^3$ có $f\'(0)=0$ nhưng $x=0$ không phải điểm cực trị.\n\n## 2. Nhầm giá trị cực trị với điểm cực trị\n\nVới $f(x)=x^3-3x+2$: điểm cực đại là $x=-1$, còn **giá trị** cực đại là $f(-1)=4$.\n\n## 3. Bỏ sót điểm mà đạo hàm không tồn tại\n\nHàm $y=|x|$ đạt cực tiểu tại $x=0$ dù không có đạo hàm tại đó.\n\n## 4. Quên điều kiện xác định\n\nLuôn tìm tập xác định trước khi tính đạo hàm.\n\n## 5. Nhầm giữa cực trị và GTLN – GTNN\n\nTrên một đoạn $[a;b]$, GTLN – GTNN có thể đạt tại hai đầu mút.' },
  { title: 'Video bài giảng: Ý nghĩa hình học của đạo hàm', category: 'VIDEO', theme: 'teal', ago: 9, video: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    excerpt: 'Video giúp hình dung đạo hàm như hệ số góc của tiếp tuyến và tốc độ thay đổi tức thời.',
    content: 'Trong video này, chúng ta cùng tìm hiểu đạo hàm **không chỉ là công thức**, mà còn là một ý tưởng hình học trực quan.\n\n## Nội dung chính\n\n- Hệ số góc của cát tuyến và tiếp tuyến.\n- Định nghĩa đạo hàm bằng giới hạn: $$f\'(x_0)=\\lim_{h\\to0}\\dfrac{f(x_0+h)-f(x_0)}{h}.$$\n- Phương trình tiếp tuyến: $y=f\'(x_0)(x-x_0)+f(x_0)$.\n\nSau khi xem video, hãy làm đề **Toán 11 – Giới hạn và Đạo hàm** để kiểm tra mức độ hiểu bài.' },
  { title: 'Thông báo lịch khai giảng các lớp Toán tháng 11', category: 'THONG_BAO', theme: 'amber', ago: 3,
    excerpt: 'Lịch khai giảng, thời gian học thử miễn phí và hướng dẫn đăng ký các lớp Toán 10, 11, 12.',
    content: 'Trung tâm trân trọng thông báo lịch khai giảng các lớp:\n\n- **Toán 10 – Nền tảng:** khai giảng thứ 3 đầu tháng 11.\n- **Toán 11 – Chuyên đề:** khai giảng thứ 2 tuần thứ hai.\n- **Toán 12 – Luyện thi THPT:** khai giảng thứ 3 tuần thứ hai.\n\n## Học thử miễn phí\n\nHọc sinh được dự **một buổi học thử miễn phí** trước khi quyết định ghi danh.\n\n## Cách đăng ký\n\nĐiền form tại trang *Đăng ký khóa học*, trung tâm sẽ gọi điện tư vấn trong vòng 24 giờ làm việc. Việc đăng ký không thu phí và không có thanh toán trực tuyến.' },
  { title: 'Phương pháp giải nhanh bài toán Đúng/Sai về hàm số', category: 'KINH_NGHIEM', theme: 'slate', ago: 6,
    excerpt: 'Chiến lược xử lý câu hỏi đúng/sai nhiều ý: kiểm tra từng mệnh đề độc lập, tận dụng kết quả chung.',
    content: 'Câu hỏi đúng/sai thường cho **một hàm số** rồi hỏi bốn mệnh đề về đạo hàm, tính đơn điệu, cực trị và giá trị cực trị.\n\n## Quy trình 4 bước\n\n1. Tính $f\'(x)$ và giải $f\'(x)=0$.\n2. Lập bảng biến thiên ngắn gọn.\n3. Đối chiếu từng mệnh đề với bảng biến thiên.\n4. Với mệnh đề tính toán, thay số kiểm tra lại.\n\n## Ví dụ\n\nCho $f(x)=x^3-3x^2+1$. Ta có $f\'(x)=3x(x-2)$.\n\n- $f\'(x)<0$ trên $(0;2)$ nên hàm số **nghịch biến** trên khoảng này.\n- $f(0)=1$ là giá trị cực đại, $f(2)=-3$ là giá trị cực tiểu.\n\nLuyện tập thêm trong đề **Toán 12 – Số 01**, Phần II.' },
  { title: 'Chuyên đề tích phân: phương pháp đổi biến số', category: 'TAI_LIEU', theme: 'indigo', ago: 10,
    excerpt: 'Hướng dẫn đổi biến loại 1 và loại 2 qua các ví dụ từ dễ đến khó.',
    content: '## Ý tưởng\n\nĐể tính $\\displaystyle\\int f(g(x))\\,g\'(x)\\,dx$, đặt $t=g(x)$ thì $dt=g\'(x)\\,dx$.\n\n## Ví dụ 1\n\nTính $I=\\displaystyle\\int_0^1\\dfrac{x}{\\sqrt{x^2+1}}\\,dx$.\n\nĐặt $t=x^2+1\\Rightarrow dt=2x\\,dx$. Đổi cận: $x=0\\Rightarrow t=1$; $x=1\\Rightarrow t=2$.\n\n$$I=\\dfrac12\\int_1^2 t^{-1/2}\\,dt=\\sqrt{t}\\Big|_1^2=\\sqrt2-1.$$\n\n## Lưu ý\n\n- Luôn đổi cận khi tính tích phân xác định.\n- Chọn $t$ là biểu thức nằm trong căn, mũ hoặc mẫu.' },
  { title: 'Đề cương ôn tập học kì II môn Toán 11', category: 'TAI_LIEU', theme: 'navy', ago: 14, pdf: true,
    excerpt: 'Hệ thống kiến thức trọng tâm và dạng bài thường gặp trong đề kiểm tra học kì II.',
    content: '## Nội dung ôn tập\n\n1. Giới hạn của dãy số và hàm số.\n2. Hàm số liên tục.\n3. Đạo hàm và các quy tắc tính.\n4. Quan hệ vuông góc trong không gian.\n\n## Lời khuyên\n\n- Học thuộc các giới hạn đặc biệt, ví dụ $\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1$.\n- Luyện tập đề kiểm tra trực tuyến để quen với áp lực thời gian.\n\nTải đề cương dạng PDF ở phần đính kèm.' },
];

/* ---------- PDF mẫu ---------- */
function buildPdf(lines) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let y = 790;
  const content = ['BT', '/F1 18 Tf', '56 800 Td', `(${esc(lines[0])}) Tj`, 'ET', 'BT', '/F1 12 Tf', '56 770 Td', '16 TL'];
  for (const l of lines.slice(1)) content.push(`(${esc(l)}) Tj T*`);
  content.push('ET');
  const stream = content.join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

async function main() {
  console.log('Đang xóa dữ liệu cũ…');
  for (const m of ['studentAnswer', 'attemptQuestionOrder', 'examResult', 'examAttempt', 'shortAnswer', 'trueFalseStatement', 'questionOption', 'question', 'examSection', 'exam', 'courseRegistration', 'course', 'post', 'media', 'passwordReset', 'studentProfile', 'user', 'setting']) await db[m].deleteMany();

  /* Người dùng */
  const admin = await db.user.create({ data: { email: 'admin@demo.vn', fullName: 'Nguyễn Minh Khoa', phone: '0901234567', role: 'ADMIN', passwordHash: await bcrypt.hash('Admin@1234', 10), createdAt: daysAgo(90) } });
  const studentsData = [
    ['hocsinh@demo.vn', 'Nguyễn Minh Anh', '0912345678', '12', 'THPT Lê Quý Đôn', 0.78, 30],
    ['tranbaongoc@demo.vn', 'Trần Bảo Ngọc', '0903456781', '12', 'THPT Nguyễn Thị Minh Khai', 0.88, 28],
    ['lehoangnam@demo.vn', 'Lê Hoàng Nam', '0987654321', '11', 'THPT Lê Hồng Phong', 0.62, 25],
    ['phamgiahan@demo.vn', 'Phạm Gia Hân', '0934567812', '12', 'THPT Trần Đại Nghĩa', 0.72, 22],
    ['vuthanhdat@demo.vn', 'Vũ Thành Đạt', '0976543210', '10', 'THPT Bùi Thị Xuân', 0.55, 19],
    ['dothuytrang@demo.vn', 'Đỗ Thùy Trang', '0945678123', '11', 'THPT Marie Curie', 0.82, 16],
    ['nguyenquanghuy@demo.vn', 'Nguyễn Quang Huy', '0965432109', '12', 'THPT Gia Định', 0.45, 11],
    ['hoangmaianh@demo.vn', 'Hoàng Mai Anh', '0956781234', '10', 'THPT Nguyễn Hữu Huân', 0.68, 6],
  ];
  const students = [];
  for (const [email, fullName, phone, grade, school, skill, ago] of studentsData) {
    const u = await db.user.create({ data: { email, fullName, phone, role: 'STUDENT', passwordHash: await bcrypt.hash('Demo@1234', 10), createdAt: daysAgo(ago + 3), profile: { create: { grade, school } } } });
    students.push({ ...u, skill, ago });
  }

  /* Khóa học */
  const courseRows = [];
  for (let i = 0; i < COURSES.length; i++) {
    const c = COURSES[i];
    courseRows.push(await db.course.create({ data: {
      slug: slugify(c.title), title: c.title, summary: c.summary, description: c.description, audience: c.audience, grade: c.grade, duration: c.duration,
      schedule: c.schedule, tuition: c.tuition, theme: c.theme, featured: c.featured, teacherName: c.teacherName, teacherBio: c.teacherBio,
      syllabus: JSON.stringify(c.syllabus.map(([title, items]) => ({ title, items }))), status: 'PUBLISHED', createdAt: daysAgo(60 - i),
    } }));
  }

  /* Đăng ký khóa học */
  const regs = [
    ['Nguyễn Thị Lan Anh', '0911222333', 'lananh.nguyen@gmail.com', 2, '12', 'Em muốn đạt 8+ môn Toán, hiện đang yếu phần hình Oxyz.', 'NEW', 0],
    ['Trần Quốc Bảo', '0922333444', 'quocbao.tran@gmail.com', 1, '11', 'Phụ huynh muốn xin lịch học thử vào buổi tối.', 'NEW', 1],
    ['Lê Phương Thảo', '0933444555', 'phuongthao.le@gmail.com', 0, '9', 'Em chuẩn bị vào lớp 10, muốn học trước chương trình.', 'CONTACTED', 2],
    ['Phạm Đức Minh', '0944555666', 'ducminh.pham@gmail.com', 3, '12', '', 'ENROLLED', 4],
    ['Võ Ngọc Diệp', '0955666777', 'ngocdiep.vo@gmail.com', 2, '12', 'Có thể học các buổi cuối tuần không ạ?', 'CONTACTED', 5],
    ['Đặng Anh Tuấn', '0966777888', 'anhtuan.dang@gmail.com', 1, '11', 'Muốn cải thiện phần đạo hàm và ứng dụng.', 'ENROLLED', 7],
    ['Bùi Thanh Vân', '0977888999', 'thanhvan.bui@gmail.com', 0, '10', '', 'CANCELLED', 9],
    ['Hồ Minh Châu', '0988999000', 'minhchau.ho@gmail.com', 2, '12', 'Em đã học 2 năm ở trung tâm khác, muốn chuyển sang luyện đề.', 'NEW', 0],
    ['Ngô Gia Bảo', '0999000111', 'giabao.ngo@gmail.com', 3, '12', 'Cần lớp cấp tốc trước kỳ thi.', 'CONTACTED', 3],
  ];
  for (const [fullName, phone, email, ci, currentGrade, note, status, ago] of regs) {
    await db.courseRegistration.create({ data: { fullName, phone, email, courseId: courseRows[ci].id, currentGrade, note: note || null, status, createdAt: daysAgo(ago, 2) } });
  }

  /* Tệp PDF mẫu */
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const pdfs = {
    'seed-cong-thuc-dao-ham-nguyen-ham.pdf': ['Cong thuc dao ham va nguyen ham', '', 'DAO HAM CO BAN', '(x^n)\' = n.x^(n-1)', '(sin x)\' = cos x      (cos x)\' = -sin x', '(e^x)\' = e^x         (ln x)\' = 1/x', '', 'NGUYEN HAM CO BAN', 'Int x^n dx = x^(n+1)/(n+1) + C   (n khac -1)', 'Int 1/x dx = ln|x| + C', 'Int e^x dx = e^x + C', '', '(Tai lieu mau - Toan Tu Duy)'],
    'seed-de-cuong-toan-11-hk2.pdf': ['De cuong on tap Toan 11 - Hoc ki II', '', '1. Gioi han cua day so va ham so', '2. Ham so lien tuc', '3. Dao ham va cac quy tac tinh', '4. Quan he vuong goc trong khong gian', '', 'Luu y: hoc thuoc cac gioi han dac biet,', 'vi du lim sin x / x = 1 khi x -> 0.', '', '(Tai lieu mau - Toan Tu Duy)'],
  };
  const pdfNames = Object.keys(pdfs);
  for (const [name, lines] of Object.entries(pdfs)) {
    const buf = buildPdf(lines);
    fs.writeFileSync(path.join(uploadDir, name), buf);
    await db.media.create({ data: { filename: name, original: name.replace('seed-', ''), mime: 'application/pdf', size: buf.length, kind: 'PDF' } });
  }

  /* Bài viết */
  let pdfIdx = 0;
  for (const p of POSTS) {
    const pdf = p.pdf ? pdfNames[pdfIdx++] : null;
    await db.post.create({ data: {
      slug: slugify(p.title), title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, theme: p.theme, videoUrl: p.video || null,
      pdfUrl: pdf ? `/api/files/${pdf}` : null, pdfName: pdf ? (pdf.includes('cong-thuc') ? 'Cong-thuc-dao-ham-nguyen-ham.pdf' : 'De-cuong-Toan-11-HK2.pdf') : null,
      status: 'PUBLISHED', publishedAt: daysAgo(p.ago), createdAt: daysAgo(p.ago + 1),
    } });
  }

  /* Đề thi */
  const examRows = [];
  for (const e of EXAMS) {
    const exam = await db.exam.create({ data: { title: e.title, description: e.description, grade: e.grade, durationMinutes: e.durationMinutes, shuffleQuestions: e.shuffleQuestions, status: e.status, createdAt: daysAgo(e.ago + 1), updatedAt: daysAgo(e.ago) } });
    const defs = [['MULTIPLE_CHOICE', 'Phần I. Trắc nghiệm nhiều phương án', e.mc], ['TRUE_FALSE', 'Phần II. Trắc nghiệm đúng sai', e.tf], ['SHORT_ANSWER', 'Phần III. Trả lời ngắn', e.sa]];
    for (let si = 0; si < defs.length; si++) {
      const [type, title, qs] = defs[si];
      const sec = await db.examSection.create({ data: { examId: exam.id, type, order: si, title } });
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        await db.question.create({ data: {
          sectionId: sec.id, order: i, content: q.content, explanation: q.explanation || '',
          options: q.options ? { create: q.options } : undefined,
          statements: q.statements ? { create: q.statements } : undefined,
          shortAnswers: q.answers ? { create: q.answers.map((a, k) => ({ answer: a, isPrimary: k === 0 })) } : undefined,
        } });
      }
    }
    examRows.push(exam);
  }

  /* Kết quả demo: tạo lượt thi, thứ tự câu, đáp án và chấm điểm bằng đúng thuật toán của hệ thống */
  async function makeAttempt(student, examIdx, dayAgo, skill) {
    const exam = await db.exam.findUnique({ where: { id: examRows[examIdx].id }, include: { sections: { orderBy: { order: 'asc' }, include: { questions: { orderBy: { order: 'asc' }, include: { options: true, statements: true, shortAnswers: true } } } } } });
    const durMin = exam.durationMinutes;
    const startedAt = daysAgo(dayAgo, rnd() * 5);
    const usedSec = Math.round(durMin * 60 * (0.55 + rnd() * 0.4));
    const submittedAt = new Date(startedAt.getTime() + usedSec * 1000);
    const attempt = await db.examAttempt.create({ data: { examId: exam.id, userId: student.id, status: 'SUBMITTED', startedAt, deadlineAt: new Date(startedAt.getTime() + durMin * 60000), submittedAt, createdAt: startedAt } });
    const orders = [], answers = [], map = {};
    for (const s of exam.sections) {
      const ids = s.questions.map((q) => q.id);
      (exam.shuffleQuestions ? shuffle(ids) : ids).forEach((qid, pos) => orders.push({ attemptId: attempt.id, sectionType: s.type, questionId: qid, position: pos }));
      for (const q of s.questions) {
        if (rnd() < 0.05) continue; // bỏ trống
        if (s.type === 'MULTIPLE_CHOICE') {
          const right = q.options.find((o) => o.isCorrect).label;
          const pick = rnd() < skill ? right : 'ABCD'.split('').filter((l) => l !== right)[Math.floor(rnd() * 3)];
          answers.push({ attemptId: attempt.id, questionId: q.id, sub: '', value: pick }); map[`${q.id}|`] = pick;
        } else if (s.type === 'TRUE_FALSE') {
          for (const st of q.statements) {
            if (rnd() < 0.03) continue;
            const v = (rnd() < skill ? st.isTrue : !st.isTrue) ? 'T' : 'F';
            answers.push({ attemptId: attempt.id, questionId: q.id, sub: st.label, value: v }); map[`${q.id}|${st.label}`] = v;
          }
        } else {
          const ok = q.shortAnswers[0].answer;
          const v = rnd() < skill * 0.9 ? ok : String(Math.floor(rnd() * 9) + 11);
          answers.push({ attemptId: attempt.id, questionId: q.id, sub: '', value: v }); map[`${q.id}|`] = v;
        }
      }
    }
    await db.attemptQuestionOrder.createMany({ data: orders });
    await db.studentAnswer.createMany({ data: answers });
    const g = gradeAttempt(exam.sections, map, usedSec);
    await db.examResult.create({ data: { attemptId: attempt.id, score: g.score, totalUnits: g.totalUnits, correct: g.correct, wrong: g.wrong, unanswered: g.unanswered, durationSec: usedSec, breakdown: JSON.stringify(g.breakdown), createdAt: submittedAt } });
    return g.score;
  }

  // Học sinh demo chính: 3 lượt, chưa làm Đề số 02 (để hiển thị "Đề mới")
  const main = students[0];
  console.log('Điểm demo:', [await makeAttempt(main, 3, 11, 0.9), await makeAttempt(main, 2, 6, 0.72), await makeAttempt(main, 0, 2, 0.8)]);
  for (const s of students.slice(1)) {
    const plan = [[0, 14], [1, 9], [2, 7], [3, 5], [0, 3], [1, 1]].filter(() => rnd() < 0.55).slice(0, 3);
    if (!plan.length) plan.push([0, 4]);
    for (const [ei, d] of plan) {
      if (examRows[ei].status !== 'PUBLISHED') continue;
      const grade = s.profile?.grade;
      await makeAttempt(s, ei, Math.min(d, s.ago), s.skill + (rnd() - 0.5) * 0.12);
    }
  }
  console.log('Seed hoàn tất.');
  console.log('  Admin:   admin@demo.vn / Admin@1234');
  console.log('  Học sinh: hocsinh@demo.vn / Demo@1234');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
