
class CustomComponentManager {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.options = {
      defaultCategory: 'Custom',
      cdnEndpoints: [],
      localComponents: [],
      jsonSources: [],
      ...options
    };

    this.loadedComponents = new Map();
    this.init();
  }

  init() {
    this.loadAllComponents();
  }

  /**
   * Load components from multiple sources
   */
  async loadAllComponents() {
    if (this.options.localComponents.length > 0) {
      this.loadLocalComponents(this.options.localComponents);
    }

    if (this.options.jsonSources.length > 0) {
      await this.loadJSONComponents(this.options.jsonSources);
    }


    if (this.options.cdnEndpoints.length > 0) {
      await this.loadCDNComponents(this.options.cdnEndpoints);
    }
  }

  /**
   * Load components from local JS objects
   * @param {Array} components - Array of component objects
   */
  loadLocalComponents(components) {
    components.forEach(component => {
      this.registerComponent(component);
    });
  }

  /**
   * Load components from JSON sources
   * @param {Array} jsonSources - Array of JSON URLs or objects
   */
  async loadJSONComponents(jsonSources) {
    for (const source of jsonSources) {
      try {
        let data;

        if (typeof source === 'string') {
          const response = await fetch(source);
          data = await response.json();
        } else {
          data = source;
        }

        const components = Array.isArray(data) ? data : [data];
        components.forEach(component => {
          this.registerComponent(component);
        });

      } catch (error) {
        console.error(`Failed to load JSON components from ${source}:`, error);
      }
    }
  }

  /**
   * Load components from CDN endpoints
   * @param {Array} cdnEndpoints - Array of CDN URLs
   */
  async loadCDNComponents(cdnEndpoints) {
    for (const endpoint of cdnEndpoints) {
      try {
        await this.loadScript(endpoint);

        if (window.customTailwindComponents) {
          const components = window.customTailwindComponents;
          components.forEach(component => {
            this.registerComponent(component);
          });

          delete window.customTailwindComponents;
        }
      } catch (error) {
        console.error(`Failed to load CDN components from ${endpoint}:`, error);
      }
    }
  }

  /**
   * Load external script
   * @param {string} src - Script source URL
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Register a single component to GrapesJS
   * @param {Object} component - Component definition
   */
  registerComponent(component) {
    try {
      if (!this.validateComponent(component)) {
        console.warn('Invalid component structure:', component);
        return;
      }

      if (!component.id) {
        component.id = this.generateComponentId(component.label || 'custom-component');
      }

      if (!component.category) {
        component.category = this.options.defaultCategory;
      }

      this.editor.BlockManager.add(component.id, {
        label: component.label || component.id,
        content: component.content || component.html || '',
        category: component.category,
        attributes: {
          class: component.class || 'custom-block',
          title: component.description || component.label || component.id
        },
        media: component.media || component.icon || component.preview || this.generateSVGIcon(component.label)
      });

      this.loadedComponents.set(component.id, component);

      console.log(`✅ Registered component: ${component.id}`);

    } catch (error) {
      console.error('Failed to register component:', component, error);
    }
  }

  /**
   * Validate component structure
   * @param {Object} component - Component to validate
   */
  validateComponent(component) {
    return component &&
      (component.content || component.html) &&
      (component.label || component.id);
  }

  /**
   * Generate unique component ID
   * @param {string} baseName - Base name for ID
   */
  generateComponentId(baseName) {
    const sanitized = baseName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let counter = 1;
    let id = `custom-${sanitized}`;

    while (this.loadedComponents.has(id)) {
      id = `custom-${sanitized}-${counter}`;
      counter++;
    }

    return id;
  }

  /**
   * Generate default SVG icon for component
   * @param {string} text - Text to display in icon
   */
  generateSVGIcon(text = '□') {
    const firstChar = text.charAt(0).toUpperCase();
    return `
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
        <text x="12" y="16" text-anchor="middle" fill="#6b7280" font-size="10" font-family="Arial, sans-serif">
          ${firstChar}
        </text>
      </svg>
    `;
  }

  /**
   * Add single component dynamically
   * @param {Object} component - Component definition
   */
  addComponent(component) {
    this.registerComponent(component);
  }

  /**
   * Add multiple components dynamically
   * @param {Array} components - Array of component definitions
   */
  addComponents(components) {
    components.forEach(component => {
      this.registerComponent(component);
    });
  }

  /**
   * Remove component
   * @param {string} componentId - Component ID to remove
   */
  removeComponent(componentId) {
    this.editor.BlockManager.remove(componentId);
    this.loadedComponents.delete(componentId);
    console.log(`🗑️ Removed component: ${componentId}`);
  }

  /**
   * Get loaded component by ID
   * @param {string} componentId - Component ID
   */
  getComponent(componentId) {
    return this.loadedComponents.get(componentId);
  }

  /**
   * Get all loaded components
   */
  getAllComponents() {
    return Array.from(this.loadedComponents.values());
  }

  /**
   * Load components from remote JSON URL
   * @param {string} url - JSON URL
   */
  async loadFromURL(url) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const components = Array.isArray(data) ? data : [data];
      this.addComponents(components);

      return components.length;
    } catch (error) {
      console.error(`Failed to load components from URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Export current components as JSON
   */
  exportComponents() {
    return JSON.stringify(this.getAllComponents(), null, 2);
  }
}

export default CustomComponentManager; 