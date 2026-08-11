package main

import (
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
	"go.abhg.dev/goldmark/toc"
)

type tocPlaceholderExtension struct{}

func (e *tocPlaceholderExtension) Extend(m goldmark.Markdown) {
	m.Parser().AddOptions(
		parser.WithASTTransformers(
			util.Prioritized(&tocPlaceholderTransformer{}, 100),
		),
	)
}

type tocPlaceholderTransformer struct{}

func (t *tocPlaceholderTransformer) Transform(doc *ast.Document, reader text.Reader, pc parser.Context) {
	source := reader.Source()

	var toReplace []ast.Node
	_ = ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || n.Kind() != ast.KindParagraph {
			return ast.WalkContinue, nil
		}
		if strings.EqualFold(strings.TrimSpace(paragraphRawText(n, source)), "[[toc]]") {
			toReplace = append(toReplace, n)
		}
		return ast.WalkContinue, nil
	})

	if len(toReplace) == 0 {
		return
	}

	tree, err := toc.Inspect(doc, source, toc.MaxDepth(3), toc.Compact(true))
	if err != nil || len(tree.Items) == 0 {
		for _, n := range toReplace {
			n.Parent().RemoveChild(n.Parent(), n)
		}
		return
	}

	list := toc.RenderList(tree)
	if list == nil {
		for _, n := range toReplace {
			n.Parent().RemoveChild(n.Parent(), n)
		}
		return
	}

	list.SetAttributeString("id", []byte("toc"))

	parent := toReplace[0].Parent()
	parent.ReplaceChild(parent, toReplace[0], list)

	for _, n := range toReplace[1:] {
		n.Parent().RemoveChild(n.Parent(), n)
	}
}

func paragraphRawText(n ast.Node, source []byte) string {
	var buf strings.Builder
	lines := n.Lines()
	for i := 0; i < lines.Len(); i++ {
		seg := lines.At(i)
		buf.Write(seg.Value(source))
	}
	return buf.String()
}
