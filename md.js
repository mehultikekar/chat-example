var katex = require('katex')
  , twemoji = require('twemoji')

function latexRender(str) {
  try {
    return katex.renderToString(str)
  } catch (err) {
    console.log(err)
    return str
  }
}

var md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
})
.use(require('markdown-it-emoji'))
.use(require('markdown-it-simplemath'), {inlineRenderer: latexRender})
.use(require('markdown-it-sanitizer'))

md.renderer.rules.emoji = function(token, idx) {
  return twemoji.parse(
    token[idx].content,
    function(icon, options, variant) {
      return '/twemoji/' + icon + '.svg'
    }
  )
}

module.exports = md
