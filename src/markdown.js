import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true });
// Jangan memuat gambar eksternal dari jawaban chat.
markdown.disable("image");
window.renderAIMessage = (text) => DOMPurify.sanitize(markdown.render(String(text)), {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["img", "style", "input", "form"],
  FORBID_ATTR: ["style", "id", "name"],
});
