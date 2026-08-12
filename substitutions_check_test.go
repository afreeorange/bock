package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestSubstitutions(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		// Fractions
		{"1/2 cup", "&frac12; cup"},
		{"1/4 and 3/4", "&frac14; and &frac34;"},
		{"21/4", "21/4"},           // no match inside larger numbers
		{"1/45", "1/45"},           // no match inside larger numbers

		// Arrows
		{"a -> b", "a &rarr; b"},
		{"a <- b", "a &larr; b"},
		{"a <-> b", "a &harr; b"},
		{"a => b", "a &rArr; b"},
		{"a <=> b", "a &hArr; b"},

		// Symbols
		{"(c) 2024", "&copy; 2024"},
		{"(R) brand", "&reg; brand"},
		{"(TM) mark", "&trade; mark"},
		{"a != b", "a &ne; b"},
		{"+-5", "&plusmn;5"},
		{"error is +-0.5", "error is &plusmn;0.5"},

		// Code spans should be untouched
		{"`1/2`", "<code>1/2</code>"},
		{"`a -> b`", "<code>a -&gt; b</code>"},
	}

	for _, tc := range cases {
		var buf bytes.Buffer
		if err := markdown.Convert([]byte(tc.input), &buf); err != nil {
			t.Errorf("Convert(%q): %v", tc.input, err)
			continue
		}
		got := strings.TrimSpace(buf.String())
		got = strings.TrimPrefix(got, "<p>")
		got = strings.TrimSuffix(got, "</p>")
		if got != tc.want {
			t.Errorf("%q\n  got:  %s\n  want: %s", tc.input, got, tc.want)
		}
	}
}
