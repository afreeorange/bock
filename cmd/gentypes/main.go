// cmd/gentypes reads types.go and renderers.go to generate TypeScript
// interfaces into theme/globals.d.ts. Data model types come from types.go
// (exported structs with exported fields). Page props come from the
// engine.Render() calls in renderers.go.
//
// Usage: go run ./cmd/gentypes
package main

import (
	"bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"regexp"
	"strings"
)

func main() {
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, "types.go", nil, parser.ParseComments)
	if err != nil {
		fmt.Fprintln(os.Stderr, "parse error:", err)
		os.Exit(1)
	}

	var out strings.Builder
	out.WriteString("// Auto-generated from types.go and renderers.go — do not edit by hand.\n")
	out.WriteString("// Regenerate with: go run ./cmd/gentypes\n\n")

	// --- Data model types from types.go ---
	out.WriteString("// Data model types (from types.go, using Go field names)\n\n")

	// Collect struct info for page props generation
	structFields := map[string]map[string]string{} // structName → {fieldName → tsType}

	for _, decl := range f.Decls {
		gd, ok := decl.(*ast.GenDecl)
		if !ok || gd.Tok != token.TYPE {
			continue
		}
		for _, spec := range gd.Specs {
			ts := spec.(*ast.TypeSpec)
			st, ok := ts.Type.(*ast.StructType)
			if !ok {
				continue
			}

			if !hasExportedFields(st) {
				continue
			}

			// Skip internal-only types not relevant to templates
			switch ts.Name.Name {
			case "BuildOptions":
				continue
			}

			fields := map[string]string{}
			out.WriteString(fmt.Sprintf("interface %s {\n", ts.Name.Name))

			for _, field := range st.Fields.List {
				if len(field.Names) == 0 || !field.Names[0].IsExported() {
					continue
				}
				tsType := goTypeToTS(field.Type)
				name := field.Names[0].Name
				fields[name] = tsType
				out.WriteString(fmt.Sprintf("  %s: %s;\n", name, tsType))
			}

			out.WriteString("}\n\n")
			structFields[ts.Name.Name] = fields
		}
	}

	// --- Page props from renderers.go ---
	out.WriteString("// Page props (from renderers.go Render calls)\n\n")

	pageProps := parseRenderCalls("renderers.go", structFields)
	for _, pp := range pageProps {
		out.WriteString(fmt.Sprintf("interface %sProps {\n", pp.name))
		for _, f := range pp.fields {
			out.WriteString(fmt.Sprintf("  %s: %s;\n", f.name, f.tsType))
		}
		out.WriteString("}\n\n")
	}

	// --- Global helpers ---
	out.WriteString("// Global helpers injected by the engine\n\n")
	out.WriteString("declare function formatDate(date: string, layout: string): string;\n")
	out.WriteString("declare function humanizeNumber(n: number): string;\n")

	if err := os.WriteFile("theme/globals.d.ts", []byte(out.String()), 0644); err != nil {
		fmt.Fprintln(os.Stderr, "write error:", err)
		os.Exit(1)
	}

	fmt.Println("wrote theme/globals.d.ts")
}

type propField struct {
	name   string
	tsType string
}

type pagePropsInfo struct {
	name   string
	fields []propField
}

// parseRenderCalls scans renderers.go for engine.Render("PageName", map[string]any{...})
// blocks and extracts the prop keys and their types.
func parseRenderCalls(filename string, structFields map[string]map[string]string) []pagePropsInfo {
	file, err := os.Open(filename)
	if err != nil {
		fmt.Fprintln(os.Stderr, "cannot open", filename, ":", err)
		return nil
	}
	defer file.Close()

	renderRe := regexp.MustCompile(`engine\.Render\("(\w+)"`)
	propRe := regexp.MustCompile(`^\s*"(\w+)":\s*(.+),\s*$`)

	var results []pagePropsInfo
	seen := map[string]bool{}
	scanner := bufio.NewScanner(file)
	inBlock := false
	var current pagePropsInfo

	for scanner.Scan() {
		line := scanner.Text()

		if m := renderRe.FindStringSubmatch(line); m != nil {
			name := m[1]
			if seen[name] {
				// Skip duplicates (e.g. RevisionRaw has same shape defined separately)
				inBlock = true
				current = pagePropsInfo{name: ""}
				continue
			}
			seen[name] = true
			current = pagePropsInfo{name: name}
			inBlock = true
			continue
		}

		if inBlock {
			if strings.Contains(line, "})") {
				if current.name != "" {
					results = append(results, current)
				}
				inBlock = false
				continue
			}

			if m := propRe.FindStringSubmatch(line); m != nil && current.name != "" {
				key := m[1]
				value := strings.TrimSpace(m[2])
				tsType := inferPropType(key, value, structFields)
				current.fields = append(current.fields, propField{name: key, tsType: tsType})
			}
		}
	}

	return results
}

// inferPropType determines the TS type for a prop based on the Go value expression.
func inferPropType(key string, value string, structFields map[string]map[string]string) string {
	// Quoted strings
	if strings.HasPrefix(value, `"`) {
		return "string"
	}

	// Known struct field accesses
	if strings.Contains(value, ".Format(time.RFC3339)") {
		return "string"
	}
	if strings.HasPrefix(value, "conversionBuffer.String()") {
		return "string"
	}

	// Bare identifiers that are clearly typed
	switch value {
	case "entityType":
		return "string"
	case "revisions":
		return "Revision[]"
	}

	// Direct struct field references
	fieldAccess := regexp.MustCompile(`\w+\.(\w+)$`)
	if m := fieldAccess.FindStringSubmatch(value); m != nil {
		fieldName := m[1]

		// Check known struct fields
		for _, fields := range structFields {
			if tsType, ok := fields[fieldName]; ok {
				return tsType
			}
		}
	}

	// config.meta
	if value == "config.meta" {
		return "Meta"
	}
	// config.entityTree
	if value == "config.entityTree" {
		return "Entity[]"
	}
	// config.listOfArticles
	if value == "config.listOfArticles" {
		return "Entity[]"
	}
	// revisionMap
	if value == "revisionMap" {
		return "Revision"
	}
	// VERSION constant
	if value == "VERSION" {
		return "string"
	}

	return "any"
}

func hasExportedFields(st *ast.StructType) bool {
	for _, field := range st.Fields.List {
		if len(field.Names) > 0 && field.Names[0].IsExported() {
			return true
		}
	}
	return false
}

func goTypeToTS(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return identToTS(t.Name)
	case *ast.ArrayType:
		elem := goTypeToTS(t.Elt)
		return elem + "[]"
	case *ast.StarExpr:
		inner := goTypeToTS(t.X)
		return inner + " | null"
	case *ast.SelectorExpr:
		pkg := t.X.(*ast.Ident).Name
		name := t.Sel.Name
		if pkg == "time" && name == "Time" {
			return "string"
		}
		if pkg == "time" && name == "Duration" {
			return "string"
		}
		return "any"
	default:
		return "any"
	}
}

func identToTS(name string) string {
	switch name {
	case "string":
		return "string"
	case "bool":
		return "boolean"
	case "int", "int8", "int16", "int32", "int64",
		"uint", "uint8", "uint16", "uint32", "uint64",
		"float32", "float64":
		return "number"
	default:
		return name
	}
}
