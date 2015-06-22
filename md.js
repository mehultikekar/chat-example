var katex = require('katex');

function latexRender(str) {
    try {
        return katex.renderToString(str);
    } catch (err) {
        return str;
    }
}

var md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true
})
.use(require('markdown-it-emoji'))
.use(require('markdown-it-simplemath'), {inlineRenderer: latexRender})
.use(require('markdown-it-sanitizer'));

var twemoji = require('twemoji');

md.renderer.rules.emoji = function(token, idx) {
  return twemoji.parse(
          token[idx].content,
          function(icon, options, variant) {
              return '/twemoji/' + icon + '.svg';
          });
};

module.exports = md;
