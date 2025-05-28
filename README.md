# Grapesjs Tailwind with custom block + Iconify

[DEMO](https://herbras.github.io/grapesjs-tailwind/)

> 🚀 **Enhanced fork** of [Ju99ernaut/grapesjs-tailwind](https://github.com/Ju99ernaut/grapesjs-tailwind) with added **Custom Components Manager** and **Iconify Icons** support.

Tailwind CSS integration for GrapesJS with **Custom Components Manager** and **Iconify Icons** support.

**Key Features:**
- 🎨 Complete Tailwind CSS integration with custom config support  
- 🧩 **NEW:** Custom Component Manager for loading external blocks
- 🔥 **NEW:** Iconify integration with 150,000+ icons from 120+ icon sets
- 📦 **NEW:** Load components from CDN, JSON, or local sources
- ⚡ Built-in Tailblocks.cc components (from original)

> Requires [`grapesjs-plugin-forms`](https://github.com/artf/grapesjs-plugin-forms)

## 🚀 Quick Start

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/grapesjs-tailwind-iconify"></script>

<div id="gjs"></div>
```

### JS
```js
// Handle tailwind's use of slashes in css names
const escapeName = (name) => `${name}`.trim().replace(/([^a-z0-9\w-:/]+)/gi, '-');

const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  selectorManager: { escapeName },
  plugins: ['grapesjs-tailwind-iconify'],
  pluginsOpts: {
    'grapesjs-tailwind-iconify': {
      // Load custom components from external sources
      customComponents: {
        enabled: true,
        cdnEndpoints: [
          'https://cdn.example.com/my-custom-blocks.js'
        ],
        jsonSources: [
          'https://api.example.com/blocks.json'
        ]
      }
    }
  }
});
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}

.change-theme-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 5px;
}

.change-theme-button:focus {
  outline: none;
  box-shadow: 0 0 0 2pt #c5c5c575;
}

/* Make blocks full width */
.gjs-block {
    padding: 0 !important;
    width: 100% !important;
    min-height: auto !important;
}

/* Fit icons properly */
.gjs-block svg {
    width: 100%;
}
```

## 🧩 Custom Components Manager

Load custom blocks from external sources:

```js
// Add components from CDN
editor.CustomComponents.loadFromURL('https://cdn.example.com/blocks.js');

// Add local component
editor.CustomComponents.addComponent({
  id: 'my-hero',
  label: 'Custom Hero',
  category: 'Headers',
  content: `<section class="bg-blue-500 text-white p-8">
    <h1 class="text-4xl font-bold">Hello World</h1>
  </section>`
});

// Export all components
const allComponents = editor.CustomComponents.exportComponents();
```

### Component Format
```js
{
  "id": "unique-component-id",
  "label": "Component Name",
  "category": "Category Name",
  "content": "<div class='tailwind-html'>Content</div>",
  "media": "data:image/svg+xml;base64,..." // Optional preview icon
}
```

## 🔥 Iconify Integration

Access 150,000+ icons from 120+ icon sets:

```js
// Search icons
const icons = await editor.Iconify.searchIcons('arrow');

// Get specific icon SVG
const iconSVG = await editor.Iconify.getIconSVG('heroicons:arrow-right');

// Available icon sets
const iconSets = editor.Iconify.getIconSets();
```

## 🎛️ Plugin Options

| Option | Description | Default |
|-|-|-
| `tailwindPlayCdn` | Tailwind CSS CDN URL | `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` |
| `plugins` | Tailwind plugins array | `[]` |
| `config` | Custom Tailwind config | `{}` |
| `customComponents.enabled` | Enable custom components | `true` |
| `customComponents.cdnEndpoints` | CDN URLs for components | `[]` |
| `customComponents.jsonSources` | JSON sources for components | `[]` |
| `iconify.enabled` | Enable Iconify integration | `true` |
| `iconify.defaultIconSets` | Default icon sets to load | `['heroicons', 'lucide', 'tabler']` |

## 📦 Commands

| Command | Description |
|-|-|
| `get-tailwindCss` | Extract optimized Tailwind CSS |
| `open-update-theme` | Open theme customization modal |

```js
// Get optimized CSS
editor.runCommand('get-tailwindCss', {
  callback: (css) => console.log(css)
});
```

## 🌐 CDN Usage

```html
<!-- Main plugin -->
<script src="https://unpkg.com/grapesjs-tailwind-iconify"></script>

<!-- Or via JSDelivr -->
<script src="https://cdn.jsdelivr.net/npm/grapesjs-tailwind-iconify"></script>

<!-- Standalone Custom Component Manager -->
<script src="https://unpkg.com/grapesjs-tailwind-iconify/dist/cdn/custom-component-manager.min.js"></script>
```

## 📥 Installation

```bash
# NPM
npm i grapesjs-tailwind-iconify

# CDN
# See CDN usage above
```

## 🔧 Development

```bash
git clone https://github.com/herbras/grapesjs-tailwind.git
cd grapesjs-tailwind
npm install
npm start
```

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

**Original Author:** [Ju99ernaut](https://github.com/Ju99ernaut) - [grapesjs-tailwind](https://github.com/Ju99ernaut/grapesjs-tailwind)  
**Enhanced by:** [Ibrahim Nurul Huda](https://github.com/herbras) - [Sarbeh](https://sarbeh.com)

This project is a fork of the original grapesjs-tailwind with additional features:
- Custom Components Manager for external block loading
- Iconify integration with 150,000+ icons
- Enhanced CDN distribution

Both original and enhanced versions are under MIT License.

---

*Powered by [GrapesJS](https://grapesjs.com/) • [Tailwind CSS](https://tailwindcss.com/) • [Iconify](https://iconify.design/)*
