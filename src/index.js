import en from './locale/en';
import loadBlocks from './blocks';
import loadCommands from './commands';
import CustomComponentManager from './custom-component-manager';
import IconifyManager from './iconify-manager';

export default (editor, opts = {}) => {
  const options = {
    ...{
      i18n: {},
      // default options
      tailwindPlayCdn: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
      plugins: [],
      config: {},
      cover: `.object-cover { filter: sepia(1) hue-rotate(190deg) opacity(.46) grayscale(.7) !important; }`,
      changeThemeText: 'Change Theme',
      openCategory: 'Blog',

      // Custom Component Manager options
      customComponents: {
        enabled: true,
        defaultCategory: 'Custom',
        // Array of local component objects
        localComponents: [],
        // Array of JSON sources (URLs or objects)
        jsonSources: [],
        // Array of CDN endpoints
        cdnEndpoints: []
      },

      // Iconify Manager options
      iconify: {
        enabled: true,
        // Iconify API endpoint
        apiEndpoint: 'https://api.iconify.design',
        // Default icon sets to load
        defaultIconSets: ['heroicons', 'lucide', 'tabler', 'phosphor', 'feather'],
        // Cache icons locally
        enableCache: true,
        // Maximum icons to show in search results
        maxSearchResults: 50,
        // Icon category in blocks panel
        iconCategory: 'Icons',
        // Default icon size
        defaultSize: 24,
        // Enable search functionality
        enableSearch: true
      }
    }, ...opts
  };

  // Initialize Custom Component Manager first (before other initializations)
  let customComponentManager = null;
  if (options.customComponents.enabled) {
    try {
      customComponentManager = new CustomComponentManager(editor, options.customComponents);
      console.log('✅ CustomComponentManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize CustomComponentManager:', error);
      customComponentManager = {
        getAllComponents: () => [],
        addComponent: () => console.warn('CustomComponentManager not available'),
        addComponents: () => console.warn('CustomComponentManager not available'),
        removeComponent: () => console.warn('CustomComponentManager not available'),
        getComponent: () => null,
        loadFromURL: () => Promise.reject('CustomComponentManager not available'),
        exportComponents: () => '[]'
      };
    }
  } else {
    // Provide stub implementation when disabled
    customComponentManager = {
      getAllComponents: () => [],
      addComponent: () => console.warn('CustomComponents disabled'),
      addComponents: () => console.warn('CustomComponents disabled'),
      removeComponent: () => console.warn('CustomComponents disabled'),
      getComponent: () => null,
      loadFromURL: () => Promise.reject('CustomComponents disabled'),
      exportComponents: () => '[]'
    };
  }

  // Expose Custom Component Manager API immediately
  editor.CustomComponents = customComponentManager;

  // Initialize Iconify Manager
  let iconifyManager = null;
  if (options.iconify.enabled) {
    try {
      iconifyManager = new IconifyManager(editor, options.iconify);
      console.log('✅ IconifyManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize IconifyManager:', error);
      iconifyManager = {
        searchIcons: () => Promise.resolve([]),
        getIconSVG: () => Promise.resolve(null),
        getIconSets: () => [],
        clearCache: () => console.warn('IconifyManager not available'),
        getCacheStats: () => ({ size: 0, iconSets: 0 })
      };
    }
  } else {
    // Provide stub implementation when disabled
    iconifyManager = {
      searchIcons: () => Promise.resolve([]),
      getIconSVG: () => Promise.resolve(null),
      getIconSets: () => [],
      clearCache: () => console.warn('Iconify disabled'),
      getCacheStats: () => ({ size: 0, iconSets: 0 })
    };
  }

  // Expose Iconify Manager API
  editor.Iconify = iconifyManager;

  // Add blocks
  loadBlocks(editor, options);
  // Add commands
  loadCommands(editor, options);
  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
    en,
    ...options.i18n,
  });

  const appendTailwindCss = async (frame) => {
    const iframe = frame.view.getEl();

    if (!iframe) return;

    const { tailwindPlayCdn, plugins, config, cover } = options;
    const init = () => {
      if (iframe.contentWindow && iframe.contentWindow.tailwind) {
        iframe.contentWindow.tailwind.config = config;
      } else {
        console.warn('Tailwind CSS not loaded yet, retrying...');
        setTimeout(() => {
          if (iframe.contentWindow && iframe.contentWindow.tailwind) {
            iframe.contentWindow.tailwind.config = config;
          }
        }, 100);
      }
    }

    const script = document.createElement('script');
    script.src = tailwindPlayCdn + (plugins.length ? `?plugins=${plugins.join()}` : '');
    script.onload = init;

    const cssStyle = document.createElement('style');
    cssStyle.innerHTML = cover;

    // checks iframe is ready before loading Tailwind CSS - issue with firefox
    const f = setInterval(() => {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState && doc.readyState === 'complete') {
        doc.head.appendChild(script);
        doc.head.appendChild(cssStyle);
        clearInterval(f);
      }
    }, 100)
  }

  editor.Canvas.getModel()['on']('change:frames', (m, frames) => {
    frames.forEach(frame => frame.once('loaded', () => appendTailwindCss(frame)));
  });
};
