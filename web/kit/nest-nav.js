/*
 * nest-nav.js: the top bar every Nests Hostels tool shares, and the list of those tools.
 *
 * Served from https://nestpass.ai/kit/nest-nav.js; each tool loads it with
 *   <script async src="https://nestpass.ai/kit/nest-nav.js"></script>
 *   <nest-nav tool="flyers"><a slot="fallback" href="…">Flyers</a> …the tool's own actions… </nest-nav>
 * so one upload of this file changes the links in every tool. README.md holds the contract.
 *
 * A classic script, not a module: a module loaded from another origin (the QR subdomain)
 * would need CORS headers. The bar lives in a shadow root and uses literal values only
 * (no custom properties, no @font-face): the tools' own CSS (.btn, `*` resets, --nest-*
 * variables) must not reach the bar, and the bar must not reach them. The Flyers editor
 * exports its flyer from the same document.
 */
(function () {
  'use strict';

  if (window.customElements.get('nest-nav')) return; // included twice: the first copy wins

  // currentScript is only set while this file runs. The logo sits beside it; the hub is the
  // folder above it, so a local copy of web/ links to itself rather than to production.
  var here = document.currentScript && document.currentScript.src;
  var KIT = here ? new URL('.', here).href : 'https://nestpass.ai/kit/';
  var HUB = new URL('..', KIT).href;

  function icon(paths) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
    );
  }

  // The tools, in bar order. Adding a tool, or moving one to a new address, is this list only.
  // `bar: false` keeps a tool to its card on the tools page: a dashboard people look at, not a
  // tool they switch between, would only crowd the bar.
  var TOOLS = [
    {
      id: 'flyers',
      name: 'Flyers',
      href: 'https://nestpass.ai/activities/',
      blurb: 'Activity flyers as Instagram stories and WhatsApp images.',
      icon: icon('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 16l3.5-3.5 3 3 2-2L18 17"/><circle cx="14.5" cy="8" r="1.5"/>'),
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      href: 'https://nestpass.ai/newsletter/',
      blurb: 'Branded header images for the newsletter.',
      icon: icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'),
    },
    {
      id: 'qr',
      name: 'QR codes',
      href: 'https://qr.nestshostels.com/',
      blurb: 'QR codes whose link you can change after printing.',
      icon: icon(
        '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/>' +
          '<rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5h2.5v2.5h-2.5zM18.5 18.5h2v2h-2zM14.5 20.5H16M20.5 14.5V16"/>',
      ),
    },
    {
      id: 'vanity',
      name: 'Social vanity URLs',
      href: 'https://nestpass.ai/vanity/',
      blurb: 'Short tracked links for Instagram and TikTok stories, posts and influencers.',
      icon: icon('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
    },
    {
      id: 'occupancy',
      name: 'Occupancy',
      href: 'https://reliable-donut-42d1fb.netlify.app/',
      blurb: 'Occupancy across the hostels, at a glance.',
      icon: icon('<path d="M3 20V9l9-5 9 5v11"/><path d="M3 20h18"/><path d="M8 20v-5h8v5"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>'),
      bar: false,
    },
  ].map(Object.freeze);

  // What the bar lists: every tool but the ones kept to the tools page.
  var BAR = TOOLS.filter((tool) => tool.bar !== false);

  // The Nests apps beyond the staff tools: other people, other jobs, their own logins. Only the
  // tools page lists them, in their own row; the bar stays the switcher between the tools above.
  // `preview` is a screenshot on the hub, relative to it. Without one the page draws the icon.
  var APPS = [
    {
      id: 'analytics',
      name: 'Nests Analytics',
      href: 'https://analytics.nestshostels.com/',
      blurb: 'Hostel performance dashboard.',
      icon: icon('<path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/>'),
    },
    {
      id: 'wsuite',
      name: 'wSuite Chatbot',
      href: 'https://nest-mind.laravel.cloud/',
      blurb: 'The wSuite chatbot.',
      icon: icon('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>'),
    },
  ].map(Object.freeze);

  window.NestTools = Object.freeze({ hub: HUB, tools: Object.freeze(TOOLS), apps: Object.freeze(APPS) });

  // Measured from the Flyers top bar this design comes from: 10 px + a 34 px pill button + 10 px.
  // Every tool styles its `nest-nav:not(:defined)` fallback at this same height, so the upgrade
  // swaps the content without moving the page.
  var CSS = [
    ':host{display:block;position:relative;z-index:30}',
    ':host([hidden]){display:none}',
    '*{box-sizing:border-box}',
    // Inherited properties do cross into a shadow root, so every one a page might set is pinned here.
    '.bar{display:flex;align-items:center;gap:10px;height:54px;margin:0;padding:0 20px;background:#083344;color:#fff;' +
      "font:normal 600 13px/1.25 Montserrat,system-ui,-apple-system,'Segoe UI',sans-serif;" +
      'letter-spacing:normal;word-spacing:normal;text-transform:none;text-align:left;text-indent:0;' +
      'text-shadow:none;white-space:nowrap;visibility:visible;cursor:auto}',
    '.logo{display:flex;flex:none;align-items:center;border-radius:6px}',
    '.logo img{display:block;width:auto;height:30px}',
    '.rule{flex:none;width:1px;height:18px;background:rgba(255,255,255,.25)}',
    'nav{display:flex;align-items:center;min-width:0}',
    'ul{margin:0;padding:0;list-style:none}',
    'a{text-decoration:none}',
    '.links{display:flex;align-items:center;gap:2px}',
    '.links a{display:block;padding:6px 12px;border-radius:999px;color:rgba(255,255,255,.75);transition:color .15s,background-color .15s}',
    '.links a:hover{color:#fff;background:rgba(255,255,255,.08)}',
    // The current tool: the same teal pill as the Flyers editor's selected segment.
    ".links a[aria-current='page']{background:#53CED1;color:#083344}",
    '.menu{display:none;align-items:center;gap:6px;margin:0;padding:6px 4px;border:0;border-radius:6px;background:none;' +
      'color:#53CED1;font:inherit;font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}',
    '.menu svg{width:12px;height:12px;transition:transform .15s}',
    ".menu[aria-expanded='true'] svg{transform:rotate(180deg)}",
    '.panel{position:absolute;top:calc(100% + 6px);left:12px;width:min(340px,calc(100vw - 24px));padding:6px;' +
      'border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#083344;box-shadow:0 18px 50px rgba(0,0,0,.45);white-space:normal}',
    '.panel[hidden]{display:none}',
    '.tool{display:grid;grid-template-columns:32px 1fr;column-gap:12px;align-items:center;padding:10px;border-radius:10px;color:#fff}',
    '.tool:hover{background:rgba(255,255,255,.06)}',
    ".tool[aria-current='page']{background:rgba(83,206,209,.14)}",
    '.icon{grid-row:span 2;display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:rgba(83,206,209,.14);color:#53CED1}',
    '.icon svg{width:18px;height:18px}',
    '.name{font-size:14px}',
    '.blurb{font-size:12px;font-weight:500;line-height:1.35;color:rgba(255,255,255,.7)}',
    '.all{display:block;margin-top:4px;padding:12px 10px 8px;border-top:1px solid rgba(255,255,255,.12);' +
      'color:#53CED1;font-size:12px;letter-spacing:.08em;text-transform:uppercase}',
    '.all:hover{color:#fff}',
    // `safe`: if a tool's actions are ever too wide, they overflow off the right edge instead of
    // sliding under the menu button.
    '.actions{display:flex;flex:1 1 auto;align-items:center;justify-content:flex-end;justify-content:safe flex-end;min-width:0}',
    'a:focus-visible,button:focus-visible{outline:2px solid #53CED1;outline-offset:2px}',
    // Below 900 px the tool links fold into the menu: four links plus a tool's three actions
    // (QR's Dashboard, + New QR code, Sign out) need about 900 px side by side.
    '@media (max-width:899px){.links{display:none}.menu{display:inline-flex}}',
    '@media (min-width:900px){.panel{display:none!important}}',
    // A phone also gets a smaller logo and tighter spacing, so the menu and a tool's two or
    // three actions fit side by side at 360 px.
    '@media (max-width:719px){.bar{gap:8px;padding:0 14px}.logo img{height:26px}.menu{letter-spacing:.1em}}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important}}',
  ].join('');

  var SKELETON =
    '<header class="bar">' +
    '<a class="logo"><img alt="Nests Hostels tools" width="80" height="30"></a>' +
    '<span class="rule" aria-hidden="true"></span>' +
    '<nav aria-label="Nests tools">' +
    '<ul class="links"></ul>' +
    '<button class="menu" type="button" aria-expanded="false" aria-controls="panel"><span class="label">Tools</span>' +
    '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="panel" id="panel" hidden><ul class="list"></ul><a class="all">All tools →</a></div>' +
    '</nav>' +
    // The tool's own actions. Children marked slot="fallback" match no slot, so they only show
    // while this element is undefined (the script not loaded yet, or nestpass.ai unreachable).
    '<div class="actions"><slot></slot></div>' +
    '</header>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function link(tool, current, rich) {
    var a = el('a', rich ? 'tool' : '');
    a.href = tool.href;
    if (current) a.setAttribute('aria-current', 'page');
    if (!rich) {
      a.textContent = tool.name;
      return a;
    }
    var mark = el('span', 'icon');
    mark.innerHTML = tool.icon; // a constant of this file, never page input
    a.append(mark, el('span', 'name', tool.name), el('span', 'blurb', tool.blurb));
    return a;
  }

  function item(child) {
    var li = el('li');
    li.append(child);
    return li;
  }

  class NestNav extends HTMLElement {
    static get observedAttributes() {
      return ['tool'];
    }

    constructor() {
      super();
      // The whole skeleton, slot included, exists before anything can fail: the tool's own
      // actions show even if rendering the links throws.
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style>' + SKELETON;
      root.querySelector('.logo').href = HUB;
      root.querySelector('.logo img').src = KIT + 'nest-logo-white.png';
      root.querySelector('.all').href = HUB;
      this._nav = root.querySelector('nav');
      this._links = root.querySelector('.links');
      this._list = root.querySelector('.list');
      this._button = root.querySelector('.menu');
      this._label = root.querySelector('.label');
      this._panel = root.querySelector('.panel');
      this._open = false;
      this._onOutside = this._onOutside.bind(this);
      this._onKey = this._onKey.bind(this);
      this._button.addEventListener('click', () => this._setOpen(!this._open));
    }

    connectedCallback() {
      this._render();
    }

    disconnectedCallback() {
      this._setOpen(false);
    }

    attributeChangedCallback() {
      this._render();
    }

    // `tool` stays an attribute only: React sets unknown props as attributes, and a getter-only
    // property would make its assignment throw.
    _render() {
      var id = this.getAttribute('tool');
      var current = BAR.find((tool) => tool.id === id);
      this._links.replaceChildren(...BAR.map((tool) => item(link(tool, tool === current, false))));
      this._list.replaceChildren(...BAR.map((tool) => item(link(tool, tool === current, true))));
      this._label.textContent = current ? current.name : 'Tools';
    }

    // The document listeners exist only while the menu is open.
    _setOpen(open) {
      if (open === this._open) return;
      this._open = open;
      this._button.setAttribute('aria-expanded', String(open));
      this._panel.hidden = !open;
      var method = open ? 'addEventListener' : 'removeEventListener';
      document[method]('click', this._onOutside, true);
      document[method]('keydown', this._onKey, true);
    }

    _onOutside(event) {
      if (!event.composedPath().includes(this._nav)) this._setOpen(false);
    }

    _onKey(event) {
      if (event.key !== 'Escape') return;
      var focusInside = this.shadowRoot.activeElement !== null;
      this._setOpen(false);
      if (focusInside) this._button.focus();
    }
  }

  window.customElements.define('nest-nav', NestNav);
})();
