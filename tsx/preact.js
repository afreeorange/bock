var __preact = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tsx/preact-entry.js
  var preact_entry_exports = {};
  __export(preact_entry_exports, {
    Fragment: () => S,
    h: () => k,
    renderToString: () => I2
  });

  // node_modules/preact/dist/preact.mjs
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var a;
  var s;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l3, u3, t2) {
    var i3, r3, o3, e2 = {};
    for (o3 in u3) "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e2[o3] = u3[o3];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e2[o3] && (e2[o3] = l3.defaultProps[o3]);
    return x(l3, e2, i3, r3, null);
  }
  function x(n2, t2, i3, r3, o3) {
    var e2 = { type: n2, props: t2, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e2), e2;
  }
  function S(n2) {
    return n2.children;
  }
  function C(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function $(n2, l3) {
    if (null == l3) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u3 = n2.__v, t2 = u3.__e, i3 = [], r3 = [], o3 = m({}, u3);
      o3.__v = u3.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u3, n2.__n, n2.__P.namespaceURI, 32 & u3.__u ? [t2] : null, i3, null == t2 ? $(u3) : t2, !!(32 & u3.__u), r3), o3.__v = u3.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u3.__e = u3.__ = null, o3.__e != t2 && P(o3);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l3) {
      if (null != l3 && null != l3.__e) return n2.__e = n2.__c.base = l3.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l3 = 1; i.length; ) i.length > l3 && i.sort(e), n2 = i.shift(), l3 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l3, u3, t2, i3, r3, o3, e2, f3, c3, a3) {
    var s3, h3, p3, v3, y3, _3, g3, m3 = t2 && t2.__k || w, b3 = l3.length;
    for (f3 = T(u3, l3, m3, f3, b3), s3 = 0; s3 < b3; s3++) null != (p3 = u3.__k[s3]) && (h3 = -1 != p3.__i && m3[p3.__i] || d, p3.__i = s3, _3 = q(n2, p3, h3, i3, r3, o3, e2, f3, c3, a3), v3 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), a3.push(p3.ref, p3.__c || v3, p3)), null == y3 && null != v3 && (y3 = v3), (g3 = !!(4 & p3.__u)) || h3.__k === p3.__k ? (f3 = j(p3, f3, n2, g3), g3 && h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _3 ? f3 = _3 : v3 && (f3 = v3.nextSibling), p3.__u &= -7);
    return u3.__e = y3, f3;
  }
  function T(n2, l3, u3, t2, i3) {
    var r3, o3, e2, f3, c3, a3 = u3.length, s3 = a3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f3 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e2 = null, -1 != (c3 = o3.__i = O(o3, u3, f3, s3)) && (s3--, (e2 = u3[c3]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (s3) for (r3 = 0; r3 < a3; r3++) null != (e2 = u3[r3]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = $(e2)), K(e2, e2));
    return t2;
  }
  function j(n2, l3, u3, t2) {
    var i3, r3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, r3 = 0; i3 && r3 < i3.length; r3++) i3[r3] && (i3[r3].__ = n2, l3 = j(i3[r3], l3, u3, t2));
      return l3;
    }
    n2.__e != l3 && (t2 && (l3 && n2.type && !l3.parentNode && (l3 = $(n2)), u3.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function O(n2, l3, u3, t2) {
    var i3, r3, o3, e2 = n2.key, f3 = n2.type, c3 = l3[u3], a3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e2 || a3 && e2 == c3.key && f3 == c3.type) return u3;
    if (t2 > (a3 ? 1 : 0)) {
      for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e2 == c3.key && f3 == c3.type) return o3;
    }
    return -1;
  }
  function z(n2, l3, u3) {
    "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || _.test(l3) ? u3 : u3 + "px";
  }
  function N(n2, l3, u3, t2, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l3 in t2) u3 && l3 in u3 || z(n2.style, l3, "");
      if (u3) for (l3 in u3) t2 && u3[l3] == t2[l3] || z(n2.style, l3, u3[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(s, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t2 ? u3[a] = t2[a] : (u3[a] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
  }
  function V(n2) {
    return function(u3) {
      if (this.l) {
        var t2 = this.l[u3.type + n2];
        if (null == u3[c]) u3[c] = h++;
        else if (u3[c] < t2[a]) return;
        return t2(l.event ? l.event(u3) : u3);
      }
    };
  }
  function q(n2, u3, t2, i3, r3, o3, e2, f3, c3, a3) {
    var s3, h3, p3, v3, y3, d3, _3, k3, x3, M2, $3, I3, P3, A3, H3, T2, j2 = u3.type;
    if (void 0 !== u3.constructor) return null;
    128 & t2.__u && (c3 = !!(32 & t2.__u), o3 = [f3 = u3.__e = t2.__e]), (s3 = l.__b) && s3(u3);
    n: if ("function" == typeof j2) {
      h3 = e2.length;
      try {
        if (x3 = u3.props, M2 = j2.prototype && j2.prototype.render, $3 = (s3 = j2.contextType) && i3[s3.__c], I3 = s3 ? $3 ? $3.props.value : s3.__ : i3, t2.__c ? k3 = (p3 = u3.__c = t2.__c).__ = p3.__E : (M2 ? u3.__c = p3 = new j2(x3, I3) : (u3.__c = p3 = new C(x3, I3), p3.constructor = j2, p3.render = Q), $3 && $3.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v3 = p3.__d = true, p3.__h = [], p3._sb = []), M2 && null == p3.__s && (p3.__s = p3.state), M2 && null != j2.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, j2.getDerivedStateFromProps(x3, p3.__s))), y3 = p3.props, d3 = p3.state, p3.__v = u3, v3) M2 && null == j2.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M2 && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
        else {
          if (M2 && null == j2.getDerivedStateFromProps && x3 !== y3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x3, I3), u3.__v == t2.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x3, p3.__s, I3)) {
            u3.__v != t2.__v && (p3.props = x3, p3.state = p3.__s, p3.__d = false), u3.__e = t2.__e, u3.__k = t2.__k, u3.__k.some(function(n3) {
              n3 && (n3.__ = u3);
            }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e2.push(p3);
            break n;
          }
          null != p3.componentWillUpdate && p3.componentWillUpdate(x3, p3.__s, I3), M2 && null != p3.componentDidUpdate && p3.__h.push(function() {
            p3.componentDidUpdate(y3, d3, _3);
          });
        }
        if (p3.context = I3, p3.props = x3, p3.__P = n2, p3.__e = false, P3 = l.__r, A3 = 0, M2) p3.state = p3.__s, p3.__d = false, P3 && P3(u3), s3 = p3.render(p3.props, p3.state, p3.context), w.push.apply(p3.__h, p3._sb), p3._sb = [];
        else do {
          p3.__d = false, P3 && P3(u3), s3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
        } while (p3.__d && ++A3 < 25);
        p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M2 && !v3 && null != p3.getSnapshotBeforeUpdate && (_3 = p3.getSnapshotBeforeUpdate(y3, d3)), H3 = null != s3 && s3.type === S && null == s3.key ? E(s3.props.children) : s3, f3 = L(n2, g(H3) ? H3 : [H3], u3, t2, i3, r3, o3, e2, f3, c3, a3), p3.base = u3.__e, u3.__u &= -161, p3.__h.length && e2.push(p3), k3 && (p3.__E = p3.__ = null);
      } catch (n3) {
        if (e2.length = h3, u3.__v = null, c3 || null != o3) {
          if (n3.then) {
            for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; ) f3 = f3.nextSibling;
            null != o3 && (o3[o3.indexOf(f3)] = null), u3.__e = f3;
          } else if (null != o3) for (T2 = o3.length; T2--; ) b(o3[T2]);
        } else u3.__e = t2.__e;
        null == u3.__k && (u3.__k = t2.__k || []), n3.then || B(u3), l.__e(n3, u3, t2);
      }
    } else null == o3 && u3.__v == t2.__v ? (u3.__k = t2.__k, u3.__e = t2.__e) : f3 = u3.__e = G(t2.__e, u3, t2, i3, r3, o3, e2, c3, a3);
    return (s3 = l.diffed) && s3(u3), 128 & u3.__u ? void 0 : f3;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u3, t2) {
    for (var i3 = 0; i3 < t2.length; i3++) J(t2[i3], t2[++i3], t2[++i3]);
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
  }
  function G(u3, t2, i3, r3, o3, e2, f3, c3, a3) {
    var s3, h3, p3, v3, y3, w3, _3, m3 = i3.props || d, k3 = t2.props, x3 = t2.type;
    if ("svg" == x3 ? o3 = "http://www.w3.org/2000/svg" : "math" == x3 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s3 = 0; s3 < e2.length; s3++) if ((y3 = e2[s3]) && "setAttribute" in y3 == !!x3 && (x3 ? y3.localName == x3 : 3 == y3.nodeType)) {
        u3 = y3, e2[s3] = null;
        break;
      }
    }
    if (null == u3) {
      if (null == x3) return document.createTextNode(k3);
      u3 = document.createElementNS(o3, x3, k3.is && k3), c3 && (l.__m && l.__m(t2, e2), c3 = false), e2 = null;
    }
    if (null == x3) m3 === k3 || c3 && u3.data == k3 || (u3.data = k3);
    else {
      if (e2 = "textarea" == x3 && null != k3.defaultValue ? null : e2 && n.call(u3.childNodes), !c3 && null != e2) for (m3 = {}, s3 = 0; s3 < u3.attributes.length; s3++) m3[(y3 = u3.attributes[s3]).name] = y3.value;
      for (s3 in m3) y3 = m3[s3], "dangerouslySetInnerHTML" == s3 ? p3 = y3 : "children" == s3 || s3 in k3 || "value" == s3 && "defaultValue" in k3 || "checked" == s3 && "defaultChecked" in k3 || N(u3, s3, null, y3, o3);
      for (s3 in k3) y3 = k3[s3], "children" == s3 ? v3 = y3 : "dangerouslySetInnerHTML" == s3 ? h3 = y3 : "value" == s3 ? w3 = y3 : "checked" == s3 ? _3 = y3 : c3 && "function" != typeof y3 || m3[s3] === y3 || N(u3, s3, y3, m3[s3], o3);
      if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t2.__k = [];
      else if (p3 && (u3.innerHTML = ""), L("template" == t2.type ? u3.content : u3, g(v3) ? v3 : [v3], t2, i3, r3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o3, e2, f3, e2 ? e2[0] : i3.__k && $(i3, 0), c3, a3), null != e2) for (s3 = e2.length; s3--; ) b(e2[s3]);
      c3 && "textarea" != x3 || (s3 = "value", "progress" == x3 && null == w3 ? u3.removeAttribute("value") : null != w3 && (w3 !== u3[s3] || "progress" == x3 && !w3 || "option" == x3 && w3 != m3[s3]) && N(u3, s3, w3, m3[s3], o3), s3 = "checked", null != _3 && _3 != u3[s3] && N(u3, s3, _3, m3[s3], o3));
    }
    return u3;
  }
  function J(n2, u3, t2) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t2);
    }
  }
  function K(n2, u3, t2) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i3.base = i3.__P = i3.__n = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u3, t2 || "function" != typeof n2.type);
    t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  n = w.slice, l = { __e: function(n2, l3, u3, t2) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t2 || {}), o3 = i3.__d), o3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, C.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u3), this.props)), n2 && m(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // node_modules/preact-render-to-string/dist/index.mjs
  var r2 = "diffed";
  var o2 = "__c";
  var i2 = "__s";
  var a2 = "__c";
  var c2 = "__k";
  var u2 = "__d";
  var s2 = "__s";
  var l2 = /[\s\n\\/='"\0<>]/;
  var f2 = /^(xlink|xmlns|xml)([A-Z])/;
  var p2 = /^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/;
  var h2 = /^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;
  var d2 = /* @__PURE__ */ new Set(["draggable", "spellcheck"]);
  function v2(e2) {
    void 0 !== e2.__g ? e2.__g |= 8 : e2[u2] = true;
  }
  function m2(e2) {
    void 0 !== e2.__g ? e2.__g &= -9 : e2[u2] = false;
  }
  function y2(e2) {
    return void 0 !== e2.__g ? !!(8 & e2.__g) : true === e2[u2];
  }
  var _2 = /["&<]/;
  function g2(e2) {
    if (0 === e2.length || false === _2.test(e2)) return e2;
    for (var t2 = 0, n2 = 0, r3 = "", o3 = ""; n2 < e2.length; n2++) {
      switch (e2.charCodeAt(n2)) {
        case 34:
          o3 = "&quot;";
          break;
        case 38:
          o3 = "&amp;";
          break;
        case 60:
          o3 = "&lt;";
          break;
        default:
          continue;
      }
      n2 !== t2 && (r3 += e2.slice(t2, n2)), r3 += o3, t2 = n2 + 1;
    }
    return n2 !== t2 && (r3 += e2.slice(t2, n2)), r3;
  }
  var b2 = {};
  var x2 = /* @__PURE__ */ new Set(["animation-iteration-count", "border-image-outset", "border-image-slice", "border-image-width", "box-flex", "box-flex-group", "box-ordinal-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-order", "flex-positive", "flex-shrink", "flood-opacity", "font-weight", "grid-column", "grid-row", "line-clamp", "line-height", "opacity", "order", "orphans", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]);
  var k2 = /[A-Z]/g;
  function w2(e2) {
    var t2 = "";
    for (var n2 in e2) {
      var r3 = e2[n2];
      if (null != r3 && "" !== r3) {
        var o3 = "-" == n2[0] ? n2 : b2[n2] || (b2[n2] = n2.replace(k2, "-$&").toLowerCase()), i3 = ";";
        "number" != typeof r3 || o3.startsWith("--") || x2.has(o3) || (i3 = "px;"), t2 = t2 + o3 + ":" + r3 + i3;
      }
    }
    return t2 || void 0;
  }
  function C2() {
    this.__d = true;
  }
  function A2(e2, t2) {
    return { __v: e2, context: t2, props: e2.props, setState: C2, forceUpdate: C2, __d: true, __h: new Array(0) };
  }
  var D2;
  var P2;
  var $2;
  var U;
  var F = {};
  var M = [];
  var W = Array.isArray;
  var z2 = Object.assign;
  var H2 = "";
  var N2 = "<!--$s-->";
  var q2 = "<!--/$s-->";
  function B2(e2) {
    return "string" == typeof e2 ? N2 + e2 + q2 : W(e2) ? (e2.unshift(N2), e2.push(q2), e2) : e2 && "function" == typeof e2.then ? e2.then(B2) : N2 + e2 + q2;
  }
  function I2(a3, u3, s3) {
    var l3 = l[i2];
    l[i2] = true, D2 = l.__b, P2 = l[r2], $2 = l.__r, U = l.unmount;
    var f3 = k(S, null);
    f3[c2] = [a3];
    try {
      var p3 = R(a3, u3 || F, false, void 0, f3, false, s3);
      return W(p3) ? p3.join(H2) : p3;
    } catch (e2) {
      if (e2.then) throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
      throw e2;
    } finally {
      l[o2] && l[o2](a3, M), l[i2] = l3, M.length = 0;
    }
  }
  function O2(e2, t2) {
    var n2, r3 = e2.type, o3 = true;
    return e2[a2] ? (o3 = false, (n2 = e2[a2]).state = n2[s2]) : n2 = new r3(e2.props, t2), e2[a2] = n2, n2.__v = e2, n2.props = e2.props, n2.context = t2, v2(n2), null == n2.state && (n2.state = F), null == n2[s2] && (n2[s2] = n2.state), r3.getDerivedStateFromProps ? n2.state = z2({}, n2.state, r3.getDerivedStateFromProps(n2.props, n2.state)) : o3 && n2.componentWillMount ? (n2.componentWillMount(), n2.state = n2[s2] !== n2.state ? n2[s2] : n2.state) : !o3 && n2.componentWillUpdate && n2.componentWillUpdate(), $2 && $2(e2), n2.render(n2.props, n2.state, t2);
  }
  function R(t2, r3, o3, i3, u3, _3, b3) {
    if (null == t2 || true === t2 || false === t2 || t2 === H2) return H2;
    var x3 = typeof t2;
    if ("object" != x3) return "function" == x3 ? H2 : "string" == x3 ? g2(t2) : t2 + H2;
    if (W(t2)) {
      var k3, C3 = H2;
      u3[c2] = t2;
      for (var S2 = t2.length, L2 = 0; L2 < S2; L2++) {
        var E2 = t2[L2];
        if (null != E2 && "boolean" != typeof E2) {
          var j2, T2 = R(E2, r3, o3, i3, u3, _3, b3);
          "string" == typeof T2 ? C3 += T2 : (k3 || (k3 = new Array(S2)), C3 && k3.push(C3), C3 = H2, W(T2) ? (j2 = k3).push.apply(j2, T2) : k3.push(T2));
        }
      }
      return k3 ? (C3 && k3.push(C3), k3) : C3;
    }
    if (void 0 !== t2.constructor) return H2;
    t2.__ = u3, D2 && D2(t2);
    var Z = t2.type, M2 = t2.props;
    if ("function" == typeof Z) {
      var N3, q3, I3, K2 = r3;
      if (Z === S) {
        if ("tpl" in M2) {
          for (var G2 = H2, Q2 = 0; Q2 < M2.tpl.length; Q2++) if (G2 += M2.tpl[Q2], M2.exprs && Q2 < M2.exprs.length) {
            var X = M2.exprs[Q2];
            if (null == X) continue;
            "object" != typeof X || void 0 !== X.constructor && !W(X) ? G2 += X : G2 += R(X, r3, o3, i3, t2, _3, b3);
          }
          return G2;
        }
        if ("UNSTABLE_comment" in M2) return "<!--" + g2(M2.UNSTABLE_comment) + "-->";
        q3 = M2.children;
      } else {
        if (null != (N3 = Z.contextType)) {
          var Y = r3[N3.__c];
          K2 = Y ? Y.props.value : N3.__;
        }
        var ee = Z.prototype && "function" == typeof Z.prototype.render;
        if (ee) q3 = /**#__NOINLINE__**/
        O2(t2, K2), I3 = t2[a2];
        else {
          t2[a2] = I3 = /**#__NOINLINE__**/
          A2(t2, K2);
          for (var te = 0; y2(I3) && te++ < 25; ) {
            m2(I3), $2 && $2(t2);
            try {
              q3 = Z.call(I3, M2, K2);
            } catch (e2) {
              throw _3 && e2 && "function" == typeof e2.then && (t2._suspended = true), e2;
            }
          }
          v2(I3);
        }
        if (null != I3.getChildContext && (r3 = z2({}, r3, I3.getChildContext())), ee && l.errorBoundaries && (Z.getDerivedStateFromError || I3.componentDidCatch)) {
          q3 = null != q3 && q3.type === S && null == q3.key && null == q3.props.tpl ? q3.props.children : q3;
          try {
            return R(q3, r3, o3, i3, t2, _3, false);
          } catch (e2) {
            return Z.getDerivedStateFromError && (I3[s2] = Z.getDerivedStateFromError(e2)), I3.componentDidCatch && I3.componentDidCatch(e2, F), y2(I3) ? (q3 = O2(t2, r3), null != (I3 = t2[a2]).getChildContext && (r3 = z2({}, r3, I3.getChildContext())), R(q3 = null != q3 && q3.type === S && null == q3.key && null == q3.props.tpl ? q3.props.children : q3, r3, o3, i3, t2, _3, b3)) : H2;
          } finally {
            P2 && P2(t2), U && U(t2);
          }
        }
      }
      q3 = null != q3 && q3.type === S && null == q3.key && null == q3.props.tpl ? q3.props.children : q3;
      try {
        var ne = R(q3, r3, o3, i3, t2, _3, b3);
        return P2 && P2(t2), l.unmount && l.unmount(t2), t2._suspended ? B2(ne) : ne;
      } catch (n2) {
        if (!_3 && b3 && b3.onError) {
          var re = (function e2(n3) {
            return b3.onError(n3, t2, function(t3, n4) {
              try {
                return R(t3, r3, o3, i3, n4, _3, b3);
              } catch (t4) {
                return e2(t4);
              }
            });
          })(n2);
          if (void 0 !== re) return re;
          var oe = l.__e;
          return oe && oe(n2, t2), H2;
        }
        if (!_3) throw n2;
        if (!n2 || "function" != typeof n2.then) throw n2;
        return n2.then(function e2() {
          try {
            var n3 = R(q3, r3, o3, i3, t2, _3, b3);
            return t2._suspended ? B2(n3) : n3;
          } catch (t3) {
            if (!t3 || "function" != typeof t3.then) throw t3;
            return t3.then(e2);
          }
        });
      }
    }
    var ie, ae = "<" + Z, ce = H2;
    for (var ue in M2) {
      var se = M2[ue];
      if ("function" != typeof (se = J2(se) ? se.value : se) || "class" === ue || "className" === ue) {
        switch (ue) {
          case "children":
            ie = se;
            continue;
          case "key":
          case "ref":
          case "__self":
          case "__source":
            continue;
          case "htmlFor":
            if ("for" in M2) continue;
            ue = "for";
            break;
          case "className":
            if ("class" in M2) continue;
            ue = "class";
            break;
          case "defaultChecked":
            ue = "checked";
            break;
          case "defaultSelected":
            ue = "selected";
            break;
          case "defaultValue":
          case "value":
            switch (ue = "value", Z) {
              case "textarea":
                ie = se;
                continue;
              case "select":
                i3 = se;
                continue;
              case "option":
                i3 != se || "selected" in M2 || (ae += " selected");
            }
            break;
          case "dangerouslySetInnerHTML":
            ce = se && se.__html;
            continue;
          case "style":
            "object" == typeof se && (se = w2(se));
            break;
          case "acceptCharset":
            ue = "accept-charset";
            break;
          case "httpEquiv":
            ue = "http-equiv";
            break;
          default:
            if (l2.test(ue)) continue;
            f2.test(ue) ? ue = ue.replace(f2, "$1:$2").toLowerCase() : "-" !== ue[4] && !d2.has(ue) || null == se ? o3 ? h2.test(ue) && (ue = "panose1" === ue ? "panose-1" : ue.replace(/([A-Z])/g, "-$1").toLowerCase()) : p2.test(ue) && (ue = ue.toLowerCase()) : se += H2;
        }
        null != se && false !== se && (ae = true === se || se === H2 ? ae + " " + ue : ae + " " + ue + '="' + ("string" == typeof se ? g2(se) : se + H2) + '"');
      }
    }
    if (l2.test(Z)) throw new Error(Z + " is not a valid HTML tag name in " + ae + ">");
    if (ce || ("string" == typeof ie ? ce = g2(ie) : null != ie && false !== ie && true !== ie && (ce = R(ie, r3, "svg" === Z || "foreignObject" !== Z && o3, i3, t2, _3, b3))), P2 && P2(t2), U && U(t2), !ce && V2.has(Z)) return ae + "/>";
    var le = "</" + Z + ">", fe = ae + ">";
    return W(ce) ? [fe].concat(ce, [le]) : "string" != typeof ce ? [fe, ce, le] : fe + ce + le;
  }
  var V2 = /* @__PURE__ */ new Set(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
  function J2(e2) {
    return null !== e2 && "object" == typeof e2 && "function" == typeof e2.peek && "value" in e2;
  }
  return __toCommonJS(preact_entry_exports);
})();
// Expose as goja globals
var h=__preact.h,Fragment=__preact.Fragment,renderToString=__preact.renderToString;
