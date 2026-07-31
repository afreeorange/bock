package tsx

import (
	"os"
	"strings"
	"testing"
	"testing/fstest"
)

func testThemeFS(t *testing.T, pages map[string]string) fstest.MapFS {
	t.Helper()
	nanoData, err := os.ReadFile("../theme/static/js/nano.full.min.js")
	if err != nil {
		t.Fatalf("reading nano.full.min.js: %v", err)
	}

	fs := fstest.MapFS{
		"static/js/nano.full.min.js": &fstest.MapFile{Data: nanoData},
	}
	for name, content := range pages {
		fs[name] = &fstest.MapFile{Data: []byte(content)}
	}
	return fs
}

func TestBasicRender(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Hello.tsx": `export default function Hello(props: any) {
			return <div className="greeting"><h1>{props.title}</h1></div>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Hello", map[string]any{"title": "World"})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, `class="greeting"`) {
		t.Errorf("expected className->class mapping, got: %s", html)
	}
	if !strings.Contains(html, "<h1>World</h1>") {
		t.Errorf("expected <h1>World</h1>, got: %s", html)
	}
}

func TestRawHTML(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Article.tsx": `export default function Article(props: any) {
			return <div>{raw(props.html)}</div>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Article", map[string]any{
		"html": "<p>Hello <strong>world</strong></p>",
	})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "<p>Hello <strong>world</strong></p>") {
		t.Errorf("expected raw HTML to pass through unescaped, got: %s", html)
	}
}

func TestEscaping(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Escape.tsx": `export default function Escape(props: any) {
			return <div>{props.text}</div>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Escape", map[string]any{
		"text": "<script>alert('xss')</script>",
	})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if strings.Contains(html, "<script>") {
		t.Errorf("expected HTML escaping, got: %s", html)
	}
	if !strings.Contains(html, "&lt;script&gt;") {
		t.Errorf("expected escaped script tag, got: %s", html)
	}
}

func TestComponentImport(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"components/Wrapper.tsx": `export function Wrapper(props: any) {
			return <div className="wrapper">{props.children}</div>;
		}`,
		"pages/Page.tsx": `import { Wrapper } from '../components/Wrapper';
		export default function Page(props: any) {
			return <Wrapper><h1>{props.title}</h1></Wrapper>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Page", map[string]any{"title": "Test"})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, `class="wrapper"`) {
		t.Errorf("expected wrapper component, got: %s", html)
	}
	if !strings.Contains(html, "<h1>Test</h1>") {
		t.Errorf("expected h1 content, got: %s", html)
	}
}

func TestFragment(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Frag.tsx": `export default function Frag(props: any) {
			return <><h1>One</h1><h2>Two</h2></>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Frag", map[string]any{})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "<h1>One</h1>") || !strings.Contains(html, "<h2>Two</h2>") {
		t.Errorf("expected both elements from fragment, got: %s", html)
	}
}

func TestConditionalRendering(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Cond.tsx": `export default function Cond(props: any) {
			return <div>{props.show && <span>visible</span>}{!props.show && <span>hidden</span>}</div>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Cond", map[string]any{"show": true})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "visible") {
		t.Errorf("expected 'visible', got: %s", html)
	}
	if strings.Contains(html, "hidden") {
		t.Errorf("should not contain 'hidden', got: %s", html)
	}
}

func TestVoidElements(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Void.tsx": `export default function Void(props: any) {
			return <div><br /><img src="/test.png" /><input type="text" /></div>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Void", map[string]any{})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "<br />") && !strings.Contains(html, "<br/>") {
		t.Errorf("expected self-closing br, got: %s", html)
	}
	if !strings.Contains(html, `src="/test.png"`) {
		t.Errorf("expected img with src, got: %s", html)
	}
}

func TestFormatDate(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/DatePage.tsx": `export default function DatePage(props: any) {
			return <span>{formatDate(props.date, "2006-01-02")}</span>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("DatePage", map[string]any{
		"date": "2024-03-15T10:30:00Z",
	})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "2024-03-15") {
		t.Errorf("expected formatted date, got: %s", html)
	}
}

func TestHumanizeNumber(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Num.tsx": `export default function Num(props: any) {
			return <span>{humanizeNumber(props.count)}</span>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("Num", map[string]any{"count": 1234567})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	if !strings.Contains(html, "1,234,567") {
		t.Errorf("expected humanized number, got: %s", html)
	}
}

func TestArrayMap(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/List.tsx": `export default function List(props: any) {
			return <ul>{props.items.map((item: any) => <li key={item}>{item}</li>)}</ul>;
		}`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	html, err := engine.Render("List", map[string]any{
		"items": []string{"alpha", "beta", "gamma"},
	})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	// NanoJSX renders key as an HTML attribute
	if !strings.Contains(html, ">alpha</li>") {
		t.Errorf("expected list items, got: %s", html)
	}
	if !strings.Contains(html, ">beta</li>") {
		t.Errorf("expected list items, got: %s", html)
	}
}

func TestUnknownTemplate(t *testing.T) {
	theme := testThemeFS(t, map[string]string{
		"pages/Hello.tsx": `export default function Hello() { return <div>hi</div>; }`,
	})

	engine, err := NewFromFS(theme)
	if err != nil {
		t.Fatalf("NewFromFS: %v", err)
	}

	_, err = engine.Render("NonExistent", map[string]any{})
	if err == nil {
		t.Fatal("expected error for unknown template")
	}
}
