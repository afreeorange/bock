package main

import (
	"bytes"

	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/util"

	mathjax "github.com/litao91/goldmark-mathjax"
)

// Patched version of mathjax.InlineMathRenderer that handles both
// *ast.Text and *ast.String children (Typographer produces *ast.String).
type safeInlineMathRenderer struct {
	startDelim string
	endDelim   string
}

func (r *safeInlineMathRenderer) renderInlineMath(w util.BufWriter, source []byte, n ast.Node, entering bool) (ast.WalkStatus, error) {
	if entering {
		_, _ = w.WriteString(`<span class="math inline">` + r.startDelim)
		for c := n.FirstChild(); c != nil; c = c.NextSibling() {
			var value []byte
			switch v := c.(type) {
			case *ast.Text:
				value = v.Segment.Value(source)
			case *ast.String:
				value = v.Value
			default:
				continue
			}
			if bytes.HasSuffix(value, []byte("\n")) {
				w.Write(value[:len(value)-1])
				if c != n.LastChild() {
					w.Write([]byte(" "))
				}
			} else {
				w.Write(value)
			}
		}
		return ast.WalkSkipChildren, nil
	}
	_, _ = w.WriteString(r.endDelim + `</span>`)
	return ast.WalkContinue, nil
}

func (r *safeInlineMathRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(mathjax.KindInlineMath, r.renderInlineMath)
}
