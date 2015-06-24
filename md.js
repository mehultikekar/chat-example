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

// add target=_blank to all links
function defaultRenderer(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}
var linkRenderer = md.renderer.rules.link_open || defaultRenderer

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // add target attr to token if it doesnt exist, else overwrite
  var tok = tokens[idx]
  var aIndex = tok.attrIndex('target');

  if (aIndex < 0)
    tok.attrPush(['target', '_blank'])
  else
    tok.attrs[aIndex][1] = '_blank'

  return linkRenderer(tokens, idx, options, env, self);
}

module.exports = md
