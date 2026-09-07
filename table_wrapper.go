package main

import (
	gast "github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/extension/ast"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/util"
)

// Wraps <table> in <table-wrapper>. Overrides the Table extension's renderer
// (registered at 500), so must be prioritized lower.
type tableWrapperRenderer struct{}

func (r *tableWrapperRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(ast.KindTable, r.renderTable)
}

func (r *tableWrapperRenderer) renderTable(w util.BufWriter, source []byte, n gast.Node, entering bool) (gast.WalkStatus, error) {
	if entering {
		_, _ = w.WriteString("<table-wrapper>\n<table")
		if n.Attributes() != nil {
			html.RenderAttributes(w, n, extension.TableAttributeFilter)
		}
		_, _ = w.WriteString(">\n")
	} else {
		_, _ = w.WriteString("</table>\n</table-wrapper>\n")
	}
	return gast.WalkContinue, nil
}
