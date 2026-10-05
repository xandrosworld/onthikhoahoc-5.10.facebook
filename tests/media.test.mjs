import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRichInline } from '../src/lib/markdown.js';
import { videoSource, validVideoUrl } from '../src/lib/video.js';

test('exam text preserves formulas and multiple images in sequence', () => {
  const html = renderRichInline('Cho $x^2$.\n![Đồ thị](/api/files/graph.png)\nTìm $x$. ![Hình 2](https://example.com/figure.webp)');
  assert.equal((html.match(/class="exam-image"/g) || []).length, 2);
  assert.match(html, /class="katex"/);
  assert.ok(html.indexOf('graph.png') < html.indexOf('Tìm'));
  assert.match(html, /alt="Đồ thị"/);
});

test('exam image markup cannot inject HTML or unsafe image schemes', () => {
  const html = renderRichInline('<script>alert(1)</script> ![A "quoted" <figure>](/api/files/a.png)');
  assert.ok(!html.includes('<script>'));
  assert.match(html, /alt="A &quot;quoted&quot; &lt;figure&gt;"/);
  for (const url of ['javascript:alert', 'data:image/png;base64,AAAA', '//evil.example/image.png', '/\\evil.example/image.png']) {
    assert.ok(!renderRichInline(`![Ảnh](${url})`).includes('<img'), url);
  }
});

test('course introduction accepts supported video links and local uploads', () => {
  const youtube = 'https://www.youtube-nocookie.com/embed/WUvTyaaNkzM';
  for (const url of ['https://youtu.be/WUvTyaaNkzM', 'https://www.youtube.com/watch?v=WUvTyaaNkzM', 'https://www.youtube.com/shorts/WUvTyaaNkzM', youtube]) {
    assert.deepEqual(videoSource(url), { type: 'embed', url: youtube });
  }
  assert.deepEqual(videoSource('https://vimeo.com/12345678'), { type: 'embed', url: 'https://player.vimeo.com/video/12345678' });
  assert.deepEqual(videoSource('/api/files/123-demo.mp4'), { type: 'file', url: '/api/files/123-demo.mp4' });
  assert.equal(videoSource('https://example.com/course.webm?download=1').type, 'file');
  assert.ok(validVideoUrl(''));
});

test('course introduction rejects malformed links, HTML and lookalike hosts', () => {
  for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.example/watch?v=WUvTyaaNkzM', 'https://www.youtube.com/watch?v=bad', '<iframe src="x">', 'https://example.com/not-a-video']) {
    assert.equal(validVideoUrl(url), false, url);
  }
});
