var katex = require('katex');

var md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true
})
.use(require('markdown-it-emoji'))
.use(require('markdown-it-simplemath'), {inlineRenderer: katex.renderToString})
.use(require('markdown-it-sanitizer'));

var twemoji = require('twemoji');

md.renderer.rules.emoji = function(token, idx) {
  return twemoji.parse(token[idx].content);
};

module.exports = md;
