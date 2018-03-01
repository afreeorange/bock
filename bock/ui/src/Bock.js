/*
TODO:

- Fix flash of older dom state
- Add loading bar to top-level bockComponent
- Versioning
- JSX (?)
*/

// Don't need the whole darn thing to highlight just Markdown. Let
// Webpack's tree-shaking remove all other unnecessary syntaxes.
// https://bjacobel.com/2016/12/04/highlight-bundle-size
import hljs from 'highlight.js/lib/highlight';
import markdown from 'highlight.js/lib/languages/markdown';
import m from 'mithril';
import Diff2Html from 'diff2html';
import 'diff2html/src/ui/css/diff2html.css';
import Analytics from 'universal-ga';
import './styles/Bock.sass';

const version = '2.0.1';
const upstreamAPI = '/api';

// Set up Google Analytics
const googleAnalyticsToken = process.env.WIKI_GA_TOKEN;
Analytics.initialize(googleAnalyticsToken);
Analytics.pageview('/');

// Register Highlight.js syntax
hljs.registerLanguage('markdown', markdown);

// Why is this not in the standard lib?
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Because I don't want to include a 17Kb library to do this...
const formatTimestamp = (timestamp) => {
  const t = new Date(timestamp);

  // Use 12-hour time
  let meridien = 'am';
  let hour = t.getHours();
  if (t.getHours() > 11) {
    meridien = 'pm';
    hour -= 12;
  }

  // Determine a suffix for date
  const date = t.getDate();
  const dateMod = date % 10;
  const dateSuffixMap = {
    1: 'st',
    2: 'nd',
    3: 'rd',
  };
  const dateSuffix = Object.keys(dateSuffixMap).includes(dateMod) ? dateSuffixMap[dateMod] : 'th';

  return `${hour}:${t.getMinutes()}${meridien} on ${monthNames[t.getMonth()]} ${date}${dateSuffix} ${t.getFullYear()}`;
};

const underscoreTitle = title => title.replace(/\s+/g, '_');
const deUnderscoreTitle = title => title.replace(/_/g, ' ');

// Article model
const Articles = {
  current: {}, // For simplicity, store both the article and the revision in this key
  error: false,

  getOne: key => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles/${key}`,
  }).then((response) => {
    Articles.current = response;
    return response;
  }).catch(() => {
    Articles.error = true;
  }),

  list: [], // I don't mutate this.
  listCache: [], // I mutate this.

  getList: () => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles?alphabetized`,
  }).then((response) => {
    Articles.list = response;
    Object.assign(Articles.listCache, Articles.list);
    return response;
  }),

  revisions: [],

  getRevisions: key => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles/${key}/revisions`,
  }).then((response) => {
    Articles.revisions = response.revisions;
    Articles.current.title = response.title;
    Articles.revisionComparisons = [];
    return response;
  }),

  getRevision: (key, revisionID) => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles/${key}/revisions/${revisionID}`,
  }).then((response) => {
    Articles.current = response;
    Articles.revisionComparisons = [];
    return response;
  }),

  revisionComparisons: [],

  collectRevisionComparisons: (event) => {
    // Remove when revision is unchecked
    if (event.target.checked === false) {
      // Could use .splice(.indexOf, 1) here but meh
      Articles.revisionComparisons = Articles.revisionComparisons.filter(comparisonID => comparisonID !== event.target.id);
    } else {
    // Deal with user checking revisions. Allow only
    // two for comparison submission
      Articles.revisionComparisons.unshift(event.target.id);

      if (Articles.revisionComparisons.length > 2) {
        document.getElementById(Articles.revisionComparisons.pop()).checked = false;
      }
    }
  },

  comparisonDiff: null,

  getComparison: (key, a, b) => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles/${key}/compare?a=${a}&b=${b}`,
  }).then((response) => {
    Articles.comparisonDiff = response.diff;
    return response;
  }),

  getRandomTitle: () => m.request({
    method: 'GET',
    url: `${upstreamAPI}/articles/random`,
  }).then(response => response.title),

  searchTerm: null,
  searchResults: [],

  search: (key) => {
    Articles.searchResults = null;
    Articles.searchTerm = key;

    m.request({
      method: 'GET',
      url: `${upstreamAPI}/search/${key}`,
    }).then((response) => {
      Articles.searchResults = response.results;
      return response;
    });
  },
};

const modalState = {
  hidden: true,

  getState: () => modalState.hidden,

  show: () => {
    modalState.hidden = false;
  },

  hide: () => {
    modalState.hidden = true;
  },

  toggle: () => {
    modalState.hidden = !modalState.hidden;
    return true;
  },
};

const searchModalComponent = {
  search: (event) => {
    event.preventDefault();
    const term = document.getElementById('search-term').value;

    if (term.length > 2) {
      modalState.hide();
      m.route.set(`/search/${term}`);
    }
  },

  oninit: modalState.getState,

  onupdate: () => {
    document.getElementById('search-term').focus();
  },

  view: () => m(modalState.hidden ? '#search-overlay.hide' : '#search-overlay', [
    m('#search-form', [
      m('h1', [m('i.ion-search', ' '), 'Search']),
      m('form',
        { onsubmit: searchModalComponent.search },
        m('input#search-term', { type: 'text', autoFocus: 'auto-focus' }),
      ),
      m('a', [
        m('i.ion-ios-close-outline', { onclick: () => { modalState.toggle(); } }, null),
        m('span', 'Close'),
      ]),
      m('ul', [
        m('li', m.trust('Use boolean operators <span>AND</span>, <span>OR</span>, and <span>NOT</span>')),
        m('li', m.trust('Asterisks for wildcards: <span>term*</span>, <span>*term*</span>, and <span>*term</span>')),
        m('li', m.trust('Fuzzy searches with a tilde, like <span>term~</span>')),
      ]),
    ]), // search-form
  ]), // view
};

// A topmost, wrapper component I'm going to use for
// common page elements and animations and shit
const bockComponent = {
  oninit: () => {
    document.getElementById('loading').classList.add('show-progress');
  },

  onupdate: () => {
    document.getElementById('loading').classList.add('show-progress');
  },

  onremove: (vnode) => {
    window.scrollTo(0, 0);
    document.getElementById('loading').classList.remove('show-progress');
    vnode.dom.classList.add('fade-out');
  },

  view: vnode => m('#top.fade-in', [
    m(searchModalComponent, { hidden: true }),
    vnode.children,
  ]),
};

const navigationComponent = {
  /*  This is frustrating (but not impossible) to write
      given the state transitions
  */

  view: () => {
    const navItemsList = [
      // [Link, Title, link ionicon, list item class, attributes]
      // ^ lame, but works fine for me
      [null, 'Search Articles', 'ion-ios-search', null, { onclick: () => { modalState.toggle(); } }],
      ['/Home', 'Home', 'ion-ios-home-outline', null, {}],
      ['/articles', 'All Articles', 'ion-ios-copy-outline', null, {}],
      ['/random', 'Random Article', 'ion-ios-shuffle', null, {}],
    ];

    const route = m.route.get();
    const routeChunks = route.split('/');

    /*
      Figure out what kind of a route this is.
      TODO: consolidate this logic...

      Article
      /Some_Article
      chunks.length == 2

      Article - Raw
      /Some_Article/raw
      chunks.length == 3 and 'raw' in chunks

      List of Article Revisions
      /Some_Article/revisions
      chunks.length == 3 and 'revisions' in chunks

      Single Article Revision
      /Some_Article/revisions/c8fa4855ee00d175b9af52362244fc7cddc94dd0
      chunks.length == 4 and 'revisions' in chunks

      Single Article Revision - Raw
      /Some_Article/revisions/c8fa4855ee00d175b9af52362244fc7cddc94dd0/raw
      chunks.length == 5 and 'revisions' in chunks and 'raw' in chunks
    */

    // Logic to push raw and revision nav links
    if (routeChunks[1] !== 'search' && routeChunks[1] !== 'articles' && routeChunks[1] !== 'compare') {
      // Don't want to show revisions link on revisions page
      if (routeChunks.length === 3 && routeChunks.includes('revisions')) {
        navItemsList.push([`/${routeChunks[1]}`, 'Original Article', 'ion-ios-paper-outline', null, {}]);
      } else {
        // Either an article or a revision at this point so draw the revisions link
        navItemsList.push([`/${routeChunks[1]}/revisions`, 'Article Revisions', 'ion-ios-undo-outline', null, {}]);
      }

      // Stuff to show if an article
      if (routeChunks.length === 2) {
        navItemsList.push([`/${routeChunks[1]}/raw`, 'Raw Article', 'ion-social-markdown', 'source-html-link', {}]);
      }

      // Stuff to show if a raw article
      if (routeChunks.length === 3 && routeChunks.includes('raw')) {
        navItemsList.push([`/${routeChunks[1]}`, 'Rendered Article', 'ion-code-working', 'source-html-link', {}]);
      }

      // Stuff to show if an articleRevision
      if (routeChunks.length === 4 && routeChunks.includes('revisions')) {
        navItemsList.push([`/${routeChunks[1]}/revisions/${routeChunks[3]}/raw`, 'Raw Article Revision', 'ion-social-markdown', 'source-html-link', {}]);
      }

      // Stuff to show if a raw articleRevision
      if (routeChunks.length === 5 && routeChunks.includes('revisions') && routeChunks.includes('raw')) {
        navItemsList.push([`/${routeChunks[1]}/revisions/${routeChunks[3]}`, 'Rendered Article Revision', 'ion-ios-paper-outline', 'source-html-link', {}]);
      }
    }

    // AND FINALLY!
    return m('nav',
      m('ul', [
        navItemsList.map(item =>
          m('li', { class: item[3] },
            m('a',
              Object.assign({ href: item[0] ? item[0] : '#', oncreate: m.route.link }, item[4]),
              [
                m('i', { class: item[2] }),
                m('span', item[1]),
              ],
            ), // a
          ),
        ),
      ]), // ul
    ); // nav
  }, // view
};

const footerComponent = {
  view: (vnode) => {
    let timestampInfo = null;

    // Populate article/revision timestamp information
    if (vnode.attrs.modified) {
      timestampInfo = `Last modified ${vnode.attrs.modified.humanized}, at ${formatTimestamp(vnode.attrs.modified.timestamp)}`;
    } else if (vnode.attrs.committed) {
      timestampInfo = `Committed ${vnode.attrs.committed.humanized}, at ${formatTimestamp(vnode.attrs.committed.timestamp)}`;
    }

    return m(
      'footer',
      m('p', [
        m('span', timestampInfo),
        m('br'),
        m('a', { href: 'https://nikhil.io' }, 'Nikhil Anand'),
        m('i.ion-more', m.trust('&nbsp;&nbsp;')),
        m('a', { href: 'https://github.com/afreeorange/bock' }, [m('i.ion-beer'), m.trust(` v${version}`)]),
      ]),
    );
  },
};

const randomArticleComponent = {
  // Just resolve the promise and redirect. Done as a separate
  // component so the view wouldn't 'blink' twice with the
  // CSS transitions
  oninit: () => {
    Articles.getRandomTitle().then((randomTitle) => {
      m.route.set(`/${underscoreTitle(randomTitle)}`);
    });
  },
  view: () => {}, // Here because it's required for a Mithril component
};

const articleComponent = {
  oninit: (vnode) => {
    if (vnode.attrs.revisionID) {
      Articles.getRevision(deUnderscoreTitle(vnode.attrs.key), vnode.attrs.revisionID);
    } else {
      Articles.getOne(deUnderscoreTitle(vnode.attrs.key));
    }
  },

  // Render Markdown if a raw article
  onupdate: () => {
    if (m.route.get().split('/').includes('raw')) {
      hljs.highlightBlock(document.getElementsByClassName('markdown')[0]);
    }

    if (Articles.error === true) {
      m.route.set('/oops');
    }
  },

  view: () => {
    let articleWrapper = null;
    let articleContentComponent = null;
    let rawArticle = null;

    if (m.route.get().split('/').includes('raw')) {
      articleWrapper = '#raw';
      articleContentComponent = m('pre', m('code', { class: 'markdown' }, Articles.current.raw));
      rawArticle = true;
    } else {
      articleWrapper = 'article';
      articleContentComponent = m('article', m.trust(Articles.current.html));
      rawArticle = false;
    }

    // Article or revision timestamps in the footer
    const articleTimestamp = {
      // Yeah this is pretty lazy. Articles have the "modified" key
      // set, whereas revisions have the "committed" key. Bah.
      modified: Articles.current.modified ?
        {
          timestamp: Articles.current.modified,
          humanized: Articles.current.modified_humanized,
        } : null,
      committed: Articles.current.committed ?
        {
          timestamp: Articles.current.committed || null,
          humanized: Articles.current.committed_humanized || null,
        } : null,
    };

    return m(bockComponent, [
      m(navigationComponent, { rawArticle }),
      m(
        articleWrapper,
        [
          m('h1', [
            Articles.current.title,
            Articles.current.uncommitted ? m('i.ion-edit.red') : null,
          ]),
          articleContentComponent,
        ],
      ),
      m(footerComponent, articleTimestamp),
    ]);
  }, // view
};

const articleListComponent = {
  oninit: Articles.getList,

  // Update the list of articles when user types stuff
  updateList: (event) => {
    const searchTerm = event.target.value.toLowerCase();

    Object.assign(Articles.listCache, Articles.list);

    if (searchTerm.length >= 2) {
      Object.keys(Articles.list).forEach((key) => {
        const results = Articles.listCache[key].filter(article => article.title.toLowerCase().includes(searchTerm) === true);

        if (results.length !== 0) {
          Articles.listCache[key] = results;
        } else {
          delete Articles.listCache[key];
        }
      });
    } else {
      Articles.listCache = {};
      Object.assign(Articles.listCache, Articles.list);
    }
  },

  onupdate: () => {
    document.getElementById('search-list').focus();
  },

  view: () => m(bockComponent, [
    m(navigationComponent),
    m('#articles', [
      m('h1', 'List of Articles'),
      m('input#search-list', { placeholder: 'Filter by title', onkeyup: articleListComponent.updateList }),
      m('#articles-list', [
        Object.entries(Articles.listCache).map(letterList =>
          m('div', [
            m('h2', [letterList[0], m('span', letterList[1].length)]),
            m('ul', [
              letterList[1].map(article =>
                /*  You deserve this:
                    https://www.youtube.com/watch?v=emGri7i8Y2Y
                */
                m('li', [
                  m('a', { href: `/${underscoreTitle(article.title)}`, oncreate: m.route.link }, article.title),
                  article.uncommitted ? m('i.ion-edit.red') : null,
                ])), // end inner map
            ]),
          ])), // end outer map
      ]), // articles-list
    ]),
    m(footerComponent),
  ]), // bockComponent
};

const compareComponent = {
  oninit: (vnode) => {
    Articles.getComparison(deUnderscoreTitle(vnode.key), vnode.attrs.a, vnode.attrs.b);
  },

  // TODO: Fix this; does it have to be onupdate?
  onupdate: () => {
    document.getElementById('line-compare').innerHTML = Diff2Html.Diff2Html.getPrettyHtml(Articles.comparisonDiff);
    document.getElementById('side-compare').innerHTML = Diff2Html.Diff2Html.getPrettyHtml(Articles.comparisonDiff, { outputFormat: 'side-by-side' });
  },

  view: vnode => m(bockComponent, [
    m(navigationComponent),
    m('#compare', [
      m('h1', deUnderscoreTitle(vnode.key)),
      m('#side-compare'),
      m('#line-compare'),
    ]), // #compare
    m(footerComponent),
  ]),
};

const revisionListComponent = {
  oninit: (vnode) => {
    Articles.getRevisions(deUnderscoreTitle(vnode.attrs.key));
  },

  // I know/hope that the selectRevisions function has done
  // its job of ensuring exactly two revisions being selected
  submitRevisions: () => {
    const revisions = Array.from(document.getElementsByTagName('input')).filter(e => e.checked === true);
    const revisionA = revisions[0].id.replace('revision-', '');
    const revisionB = revisions[1].id.replace('revision-', '');

    m.route.set(`/${Articles.current.title}/compare?a=${revisionA}&b=${revisionB}`);
  },

  onupdate: () => {
    // Enable the compare submission button only if there
    // are exactly two revisions selected
    if (Articles.revisionComparisons.length > 1) {
      if (Articles.revisionComparisons.length === 2) {
        document.getElementsByTagName('button')[0].disabled = false;
      } else {
        document.getElementsByTagName('button')[0].disabled = true;
      }
    }
  },

  view: (vnode) => {
    const route = m.route.get();

    const revisionRows = Articles.revisions.map(revision =>
      m('.revision-row',
        m('label', { for: `revision-${revision.id}` }, [
          m('input', { type: 'checkbox', id: `revision-${revision.id}`, onchange: Articles.collectRevisionComparisons }),
          m('.link', [
            m('i.ion-ios-paper-outline', ' '),
            m('a.revision-sha', { href: `${route}/${revision.id}`, oncreate: m.route.link }, revision.id.substring(0, 9)),
          ]),
          m('.notes', m('i', revision.message)),
          m('.committer', [
            m('i.ion-ios-person-outline', ' '),
            m('a', { href: `mailto:${revision.email}` }, `${revision.author} `),
            m('i.ion-ios-clock-outline', ' '),
            m('span', `${revision.committed_humanized}, at ${formatTimestamp(revision.committed)}`),
          ]),
        ]), // label
      ),
    ); // Articles.revisions.map

    return m(bockComponent, [
      m(navigationComponent),
      m('#revisions', [
        m('h1', deUnderscoreTitle(vnode.key)),
        Articles.revisions.length === 1 ? m('h2#single-version', 'This article has just one version') : null,
        m('#revision-list', [revisionRows]),
        Articles.revisions.length > 1 ? m('button', { type: 'Submit', disabled: true, onclick: revisionListComponent.submitRevisions }, 'Compare Revisions') : null,
      ]),
      m(footerComponent),
    ]); // bockComponent
  }, // view
};

const searchResultsComponent = {
  oninit: (vnode) => {
    Articles.search(vnode.attrs.key);
  },

  noResults: () => m(
    '#search-no-results',
    m('h1', [
      m('i.ion-sad-outline'),
      m('Sorry'),
      m('small', [
        m.trust('Didn&#8217;t find anything with &#8220;'),
        m('span', Articles.searchTerm),
        m.trust('&#8221;'),
      ]),
    ]),
  ),

  withResults: () => m('#search-results', [
    m('h1', [
      m('span', Articles.searchResults.length),
      ' results ',
      ' for ',
      m('span', Articles.searchTerm),
    ]),
    m('ul', [
      Articles.searchResults.map(result => m('li', [
        m('a', { href: `/${underscoreTitle(result.title)}`, oncreate: m.route.link }, result.title),
        m('div', m.trust(result.content_matches)),
      ])),
    ]),

  ]),

  view: () => {
    const results = Articles.searchResults;

    return m(bockComponent, [
      m(navigationComponent),
      results ? searchResultsComponent.withResults() : searchResultsComponent.noResults(),
      m(footerComponent),
    ]);
  },
};

const errorComponent = {
  view: () => m('#error',
    m('h1', [
      m('i.ion-sad-outline'),
      'Uh-oh',
      m('small', 'I could not find that'),
    ],
    ),
  ),
};

/* Set up routing */
m.route.prefix('');
m.route(document.getElementById('container'), '/Home', {
  '/articles': {
    render: () => {
      document.title = 'List of Articles';
      return m(articleListComponent);
    },
  },
  '/search/:key': {
    render: (vnode) => {
      document.title = 'Search Articles';
      return m(searchResultsComponent, vnode.attrs);
    },
  },
  '/random': {
    render: () => {
      document.title = 'Random Articles...';
      return m(randomArticleComponent);
    },
  },
  '/oops': {
    render: () => {
      document.title = 'Oops';
      return m(errorComponent);
    },
  },
  '/:key': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)}`;
      return m(articleComponent, vnode.attrs);
    },
  },
  '/:key/raw': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)} - Raw`;
      return m(articleComponent, vnode.attrs);
    },
  },
  '/:key/revisions': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)} - Revisions`;
      return m(revisionListComponent, vnode.attrs);
    },
  },
  '/:key/revisions/:revisionID': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)} - Revision ${vnode.attrs.revisionID}`;
      return m(articleComponent, vnode.attrs);
    },
  },
  '/:key/revisions/:revisionID/raw': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)} - Revisions ${vnode.attrs.revisionID} - Raw`;
      return m(articleComponent, vnode.attrs);
    },
  },
  '/:key/compare': {
    render: (vnode) => {
      document.title = `${deUnderscoreTitle(vnode.attrs.key)} - Revisions`;
      return m(compareComponent, vnode.attrs);
    },
  },
});
