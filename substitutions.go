package main

import (
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

// --- Custom inline node for HTML entities (rendered without escaping) ---

var kindHTMLEntity = ast.NewNodeKind("HTMLEntity")

type htmlEntity struct {
	ast.BaseInline
	value []byte
}

func (n *htmlEntity) Kind() ast.NodeKind { return kindHTMLEntity }
func (n *htmlEntity) Dump(source []byte, level int) {
	ast.DumpHelper(n, source, level, nil, nil)
}

// --- Renderer ---

type substitutionRenderer struct{}

func (r *substitutionRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(kindHTMLEntity, r.render)
}

func (r *substitutionRenderer) render(w util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if entering {
		_, _ = w.Write(node.(*htmlEntity).value)
	}
	return ast.WalkContinue, nil
}

// --- Substitution pattern and map ---

var substitutionPattern = regexp.MustCompile(
	`<->|<=>|---|--|->|<-|=>|\.\.\.` +
		`|\b3/4\b|\b1/4\b|\b1/2\b` +
		`|(?i:\(tm\))|(?i:\(c\))|(?i:\(r\))` +
		`|!=|\+-`,
)

var substitutionMap = map[string]string{
	"<->": "&harr;",
	"<=>": "&hArr;",
	"---": "&mdash;",
	"--":  "&ndash;",
	"->":  "&rarr;",
	"<-":  "&larr;",
	"=>":  "&rArr;",
	"...": "&hellip;",
	"3/4": "&frac34;",
	"1/4": "&frac14;",
	"1/2": "&frac12;",
	"(tm)": "&trade;",
	"(c)":  "&copy;",
	"(r)":  "&reg;",
	"!=":   "&ne;",
	"+-":   "&plusmn;",
}

// --- Extension ---

type substitutionExtension struct{}

func (e *substitutionExtension) Extend(m goldmark.Markdown) {
	m.Parser().AddOptions(
		parser.WithASTTransformers(
			util.Prioritized(&substitutionTransformer{}, 200),
		),
	)
	m.Renderer().AddOptions(
		renderer.WithNodeRenderers(
			util.Prioritized(&substitutionRenderer{}, 500),
		),
	)
}

// --- AST Transformer ---

type substitutionTransformer struct{}

func (t *substitutionTransformer) Transform(doc *ast.Document, reader text.Reader, pc parser.Context) {
	source := reader.Source()
	var nodes []*ast.Text

	_ = ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || n.Kind() != ast.KindText {
			return ast.WalkContinue, nil
		}
		if p := n.Parent(); p != nil && p.Kind() == ast.KindCodeSpan {
			return ast.WalkContinue, nil
		}
		nodes = append(nodes, n.(*ast.Text))
		return ast.WalkContinue, nil
	})

	// Phase 1: Handle +- split across consecutive sibling text nodes
	// (The Typographer splits "+-<digit>" into "+" and "-<digit>" nodes)
	for i := len(nodes) - 2; i >= 0; i-- {
		curr, next := nodes[i], nodes[i+1]
		if curr.Parent() != next.Parent() || curr.NextSibling() != next {
			continue
		}
		currVal := curr.Segment.Value(source)
		nextVal := next.Segment.Value(source)
		if len(currVal) == 0 || currVal[len(currVal)-1] != '+' ||
			len(nextVal) == 0 || nextVal[0] != '-' {
			continue
		}

		parent := curr.Parent()
		var anchor ast.Node = curr

		if len(currVal) > 1 {
			s := ast.NewString(currVal[:len(currVal)-1])
			parent.InsertBefore(parent, curr, s)
			anchor = s
		}

		entity := &htmlEntity{value: []byte("&plusmn;")}
		if anchor == curr {
			parent.InsertBefore(parent, curr, entity)
		} else {
			parent.InsertAfter(parent, anchor, entity)
		}
		anchor = entity

		if len(nextVal) > 1 {
			s := ast.NewString(nextVal[1:])
			parent.InsertAfter(parent, anchor, s)
		}

		if next.SoftLineBreak() || next.HardLineBreak() {
			br := &htmlEntity{value: []byte("<br />\n")}
			parent.InsertAfter(parent, anchor, br)
		}

		parent.RemoveChild(parent, curr)
		parent.RemoveChild(parent, next)
		nodes = append(nodes[:i], nodes[i+2:]...)
	}

	// Phase 2: Single-node regex substitutions
	for _, node := range nodes {
		value := node.Segment.Value(source)
		matches := substitutionPattern.FindAllIndex(value, -1)
		if len(matches) == 0 {
			continue
		}

		parent := node.Parent()
		var last ast.Node
		pos := 0

		insert := func(newNode ast.Node) {
			if last == nil {
				parent.InsertBefore(parent, node, newNode)
			} else {
				parent.InsertAfter(parent, last, newNode)
			}
			last = newNode
		}

		for _, m := range matches {
			if m[0] > pos {
				insert(ast.NewString(value[pos:m[0]]))
			}
			key := strings.ToLower(string(value[m[0]:m[1]]))
			insert(&htmlEntity{value: []byte(substitutionMap[key])})
			pos = m[1]
		}

		if pos < len(value) {
			insert(ast.NewString(value[pos:]))
		}

		if node.SoftLineBreak() || node.HardLineBreak() {
			insert(&htmlEntity{value: []byte("<br />\n")})
		}

		parent.RemoveChild(parent, node)
	}
}
