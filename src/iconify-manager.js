/**
 * Iconify Icon Manager for GrapesJS Tailwind Plugin
 * Provides on-demand SVG icon loading and search functionality
 */

class IconifyManager {
  constructor(editor, options = {}) {
    console.log('🔧 IconifyManager constructor called with options:', options);
    this.editor = editor;
    this.options = {
      enabled: true,
      enableSearch: true,
      apiEndpoint: 'https://api.iconify.design',
      defaultIconSet: 'lucide',
      searchLimit: 50,
      cacheTimeout: 300000, // 5 minutes
      ...options
    };

    console.log('🔧 IconifyManager final options:', this.options);

    this.iconCache = new Map();
    this.iconSets = new Map();
    this.searchIndex = new Map();

    console.log('🔧 IconifyManager calling init...');
    this.init();
  }

  async init() {
    try {
      await this.loadIconSets();

      const initializeUI = () => {
        try {
          if (this.options.enableSearch) {
            this.addIconSearchPanel();
          }

          this.addDefaultIconBlocks();

          console.log('✅ IconifyManager initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize IconifyManager UI:', error);
        }
      };

      let initialized = false;

      const safeInitialize = () => {
        if (!initialized) {
          initialized = true;
          initializeUI();
        }
      };

      this.editor.on('load', safeInitialize);

      setTimeout(safeInitialize, 500);

    } catch (error) {
      console.error('❌ Failed to initialize IconifyManager:', error);
    }
  }

  /**
   * Load available icon sets from Iconify API
   */
  async loadIconSets() {
    try {
      const response = await fetch(`${this.options.apiEndpoint}/collections`);
      const collections = await response.json();

      Object.entries(collections).forEach(([key, info]) => {
        this.iconSets.set(key, {
          name: info.name,
          total: info.total,
          author: info.author,
          license: info.license,
          samples: info.samples || []
        });
      });

      console.log(`📦 Loaded ${this.iconSets.size} icon sets`);
    } catch (error) {
      console.error('Failed to load icon sets:', error);
    }
  }

  /**
   * Search icons by keyword
   */
  async searchIcons(query, iconSet = null, limit = 999) {
    const searchLimit = limit || this.options.maxSearchResults;
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) return [];

    try {
      let searchUrl = `${this.options.apiEndpoint}/search?query=${encodeURIComponent(searchQuery)}&limit=${searchLimit}`;

      if (iconSet) {
        searchUrl += `&prefix=${iconSet}`;
      }

      const response = await fetch(searchUrl);
      const results = await response.json();

      return results.icons || [];
    } catch (error) {
      console.error('Icon search failed:', error);
      return [];
    }
  }

  /**
   * Get SVG content for a specific icon
   */
  async getIconSVG(iconName, options = {}) {
    const cacheKey = `${iconName}-${JSON.stringify(options)}`;

    if (this.options.enableCache && this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey);
    }

    try {
      let apiUrl = `${this.options.apiEndpoint}/${iconName}.svg`;

      const params = new URLSearchParams();
      if (options.width) params.append('width', options.width);
      if (options.height) params.append('height', options.height);
      if (options.color) params.append('color', options.color);

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await fetch(apiUrl);
      const svgContent = await response.text();

      // Cache the result
      if (this.options.enableCache) {
        this.iconCache.set(cacheKey, svgContent);
      }

      return svgContent;
    } catch (error) {
      console.error(`Failed to load icon ${iconName}:`, error);
      return null;
    }
  }

  /**
   * Add icon search panel to GrapesJS
   */
  addIconSearchPanel() {
    const editor = this.editor;

    editor.Panels.addButton('options', {
      id: 'toggle-iconify-search',
      className: 'fa fa-search',
      command: 'toggle-iconify-search',
      attributes: { title: 'Toggle Icon Search Panel' }
    });

    editor.Commands.add('toggle-iconify-search', {
      run: (editor) => {
        const panel = document.querySelector('.iconify-search-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        }
      }
    });

    const searchPanel = document.createElement('div');
    searchPanel.className = 'iconify-search-panel';
    searchPanel.style.display = 'none';
    searchPanel.innerHTML = `
        <div class="iconify-search-header">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0;">🎨 Icon Search</h3>
            <button id="iconify-close-panel" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
          </div>
          <input type="text" id="iconify-search-input" placeholder="Search icons..." />
          <select id="iconify-iconset-select">
            <option value="">All Icon Sets</option>
          </select>
          <div class="iconify-controls">
            <label for="iconify-color-picker">Color:</label>
            <input type="color" id="iconify-color-picker" value="#000000" />
            <label for="iconify-size-select">Size:</label>
            <select id="iconify-size-select">
              <option value="16">16px</option>
              <option value="20">20px</option>
              <option value="24" selected>24px</option>
              <option value="32">32px</option>
              <option value="48">48px</option>
              <option value="64">64px</option>
            </select>
          </div>
        </div>
        <div class="iconify-search-results" id="iconify-search-results">
          <div class="iconify-search-placeholder">
            Enter a keyword to search for icons
          </div>
        </div>
      `;

    const editorContainer = editor.getContainer();
    editorContainer.appendChild(searchPanel);

    const closeButton = searchPanel.querySelector('#iconify-close-panel');
    closeButton.addEventListener('click', () => {
      searchPanel.style.display = 'none';
    });

    const iconSetSelect = searchPanel.querySelector('#iconify-iconset-select');
    this.iconSets.forEach((info, key) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${info.name} (${info.total})`;
      iconSetSelect.appendChild(option);
    });

    this.setupSearchHandlers(searchPanel);

    this.addSearchPanelStyles();
  }

  /**
   * Setup search event handlers
   */
  setupSearchHandlers(searchPanel) {
    const searchInput = searchPanel.querySelector('#iconify-search-input');
    const iconSetSelect = searchPanel.querySelector('#iconify-iconset-select');
    const resultsContainer = searchPanel.querySelector('#iconify-search-results');

    let searchTimeout;

    const performSearch = async () => {
      const query = searchInput.value.trim();
      const selectedIconSet = iconSetSelect.value;

      if (!query) {
        resultsContainer.innerHTML = '<div class="iconify-search-placeholder">Enter a keyword to search for icons</div>';
        return;
      }

      resultsContainer.innerHTML = '<div class="iconify-search-loading">🔄 Searching...</div>';

      try {
        const icons = await this.searchIcons(query, selectedIconSet);
        this.displaySearchResults(icons, resultsContainer);
      } catch (error) {
        resultsContainer.innerHTML = '<div class="iconify-search-error">❌ Search failed</div>';
      }
    };

    // Debounced search
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 300);
    });

    iconSetSelect.addEventListener('change', performSearch);

    // Add color and size change handlers for live preview
    const colorPicker = searchPanel.querySelector('#iconify-color-picker');
    const sizeSelect = searchPanel.querySelector('#iconify-size-select');

    const updateIconPreviews = () => {
      const iconPreviews = resultsContainer.querySelectorAll('.iconify-icon-preview svg');
      const selectedColor = colorPicker.value;
      const selectedSize = parseInt(sizeSelect.value);

      iconPreviews.forEach(svg => {
        // Update color
        svg.style.fill = selectedColor;
        svg.style.color = selectedColor;
        // Update size
        svg.style.width = `${Math.min(selectedSize, 32)}px`;
        svg.style.height = `${Math.min(selectedSize, 32)}px`;
      });
    };

    colorPicker.addEventListener('input', updateIconPreviews);
    sizeSelect.addEventListener('change', updateIconPreviews);
  }

  /**
   * Display search results
   */
  async displaySearchResults(icons, container) {
    if (!icons.length) {
      container.innerHTML = '<div class="iconify-search-empty">No icons found</div>';
      return;
    }

    container.innerHTML = '';

    // Get current color and size settings for preview
    const colorPicker = document.querySelector('#iconify-color-picker');
    const sizeSelect = document.querySelector('#iconify-size-select');
    const selectedColor = colorPicker ? colorPicker.value : '#000000';
    const previewSize = Math.min(sizeSelect ? parseInt(sizeSelect.value) : 24, 32);

    for (const iconName of icons.slice(0, this.options.maxSearchResults)) {
      const iconElement = document.createElement('div');
      iconElement.className = 'iconify-search-result';
      iconElement.title = iconName;

      try {
        const svgContent = await this.getIconSVG(iconName, { width: previewSize, height: previewSize });

        // Apply color to preview SVG
        let previewSvgContent = svgContent;
        if (selectedColor !== '#000000') {
          previewSvgContent = svgContent
            .replace(/fill="[^"]*"/g, `fill="${selectedColor}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${selectedColor}"`)
            .replace(/<svg([^>]*)>/g, (match, attrs) => {
              if (!attrs.includes('fill=')) {
                return `<svg${attrs} fill="${selectedColor}" style="width: ${previewSize}px; height: ${previewSize}px;">`;
              }
              return match.replace('>', ` style="width: ${previewSize}px; height: ${previewSize}px;">`);
            });
        } else {
          previewSvgContent = svgContent.replace(/<svg([^>]*)>/g, (match, attrs) => {
            return match.replace('>', ` style="width: ${previewSize}px; height: ${previewSize}px;">`);
          });
        }

        iconElement.innerHTML = `
            <div class="iconify-icon-preview">${previewSvgContent}</div>
            <div class="iconify-icon-name">${iconName.split(':')[1] || iconName}</div>
          `;

        // Add click handler to insert icon
        iconElement.addEventListener('click', () => {
          this.insertIconIntoEditor(iconName, svgContent);
        });

        container.appendChild(iconElement);
      } catch (error) {
        console.error(`Failed to load icon ${iconName}:`, error);
      }
    }
  }

  /**
   * Insert icon into the editor
   */
  insertIconIntoEditor(iconName, svgContent) {
    const editor = this.editor;

    // Get current color and size settings
    const colorPicker = document.querySelector('#iconify-color-picker');
    const sizeSelect = document.querySelector('#iconify-size-select');
    const selectedColor = colorPicker ? colorPicker.value : '#000000';
    const selectedSize = sizeSelect ? parseInt(sizeSelect.value) : this.options.defaultSize;

    // Apply color to SVG content
    let modifiedSvgContent = svgContent;
    if (selectedColor !== '#000000') {
      // Replace fill and stroke attributes with selected color
      modifiedSvgContent = svgContent
        .replace(/fill="[^"]*"/g, `fill="${selectedColor}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${selectedColor}"`)
        .replace(/<svg([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<svg${attrs} fill="${selectedColor}">`;
          }
          return match;
        });
    }

    // Create a component with the icon
    const iconComponent = {
      type: 'text',
      content: modifiedSvgContent,
      style: {
        display: 'inline-block',
        width: `${selectedSize}px`,
        height: `${selectedSize}px`
      },
      attributes: {
        'data-iconify': iconName,
        'data-icon-type': 'iconify',
        'data-icon-color': selectedColor,
        'data-icon-size': selectedSize
      }
    };

    // Add to canvas
    const selected = editor.getSelected();
    if (selected) {
      selected.append(iconComponent);
    } else {
      editor.getWrapper().append(iconComponent);
    }

    console.log(`✅ Inserted icon: ${iconName} (${selectedColor}, ${selectedSize}px)`);

    // Close the search panel after inserting
    const searchPanel = document.querySelector('.iconify-search-panel');
    if (searchPanel) {
      searchPanel.style.display = 'none';
    }
  }

  /**
   * Add default popular icon blocks
   */
  addDefaultIconBlocks() {
    const editor = this.editor;
    const blockManager = editor.BlockManager;

    // Popular icons to add as blocks
    const popularIcons = [
      'heroicons:home',
      'heroicons:user',
      'heroicons:envelope',
      'heroicons:phone',
      'heroicons:heart',
      'heroicons:star',
      'heroicons:shopping-cart',
      'heroicons:magnifying-glass-16-solid',
      'lucide:menu',
      'lucide:x',
      'lucide:chevron-down',
      'lucide:chevron-right',
      'tabler:brand-facebook',
      'tabler:brand-twitter',
      'tabler:brand-instagram',
      'tabler:brand-linkedin'
    ];

    popularIcons.forEach(async (iconName) => {
      try {
        const svgContent = await this.getIconSVG(iconName, { width: 24, height: 24 });
        const iconDisplayName = iconName.split(':')[1] || iconName;

        blockManager.add(`iconify-${iconName.replace(':', '-')}`, {
          label: iconDisplayName,
          category: this.options.iconCategory,
          content: {
            type: 'text',
            content: svgContent,
            style: {
              display: 'inline-block',
              width: `${this.options.defaultSize}px`,
              height: `${this.options.defaultSize}px`
            },
            attributes: {
              'data-iconify': iconName,
              'data-icon-type': 'iconify'
            }
          },
          media: svgContent
        });
      } catch (error) {
        console.error(`Failed to add icon block ${iconName}:`, error);
      }
    });
  }

  /**
   * Add CSS styles for search panel
   */
  addSearchPanelStyles() {
    const styles = `
        <style>
          .iconify-search-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 300px;
            height: 100vh;
            background: #fff;
            border-left: 1px solid #ddd;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .iconify-search-header {
            padding: 15px;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
          }
          
          .iconify-search-header h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
          }
          
          .iconify-search-header input,
          .iconify-search-header select {
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          
          .iconify-controls {
            display: grid;
            grid-template-columns: auto 1fr auto 1fr;
            gap: 8px;
            align-items: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          
          .iconify-controls label {
            font-size: 12px;
            font-weight: 500;
            color: #666;
          }
          
          .iconify-controls input[type="color"] {
            width: 40px;
            height: 30px;
            padding: 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
          }
          
          .iconify-controls select {
            padding: 4px 6px;
            font-size: 12px;
            margin-bottom: 0;
          }
          
          .iconify-search-results {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .iconify-search-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 8px;
            border: 1px solid #eee;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #fff;
            min-height: 80px;
            justify-content: center;
          }
          
          .iconify-search-result:hover {
            background-color: #f8f9fa;
            border-color: #007bff;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,123,255,0.15);
          }
          
          .iconify-icon-preview {
            width: 32px;
            height: 32px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .iconify-icon-preview svg {
            width: 100%;
            height: 100%;
          }
          
          .iconify-icon-name {
            font-size: 10px;
            color: #666;
            text-align: center;
            line-height: 1.2;
            word-break: break-word;
            max-width: 100%;
          }
          
          .iconify-search-placeholder,
          .iconify-search-loading,
          .iconify-search-error,
          .iconify-search-empty {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
            color: #999;
            font-size: 14px;
            border: 2px dashed #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
          }
          
          .iconify-search-loading {
            color: #007bff;
          }
          
          .iconify-search-error {
            color: #dc3545;
          }
        </style>
      `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Get all available icon sets
   */
  getIconSets() {
    return Array.from(this.iconSets.entries()).map(([key, info]) => ({
      id: key,
      ...info
    }));
  }

  /**
   * Clear icon cache
   */
  clearCache() {
    this.iconCache.clear();
    console.log('🗑️ Icon cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.iconCache.size,
      iconSets: this.iconSets.size
    };
  }
}

export default IconifyManager;