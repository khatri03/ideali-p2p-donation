/**
 * Utility to dynamically load external scripts and styles
 */

export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

export const loadStyle = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if style already exists
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
    document.head.appendChild(link);
  });
};

/**
 * Specifically load Summernote and its dependency jQuery
 */
export const loadSummernote = async (): Promise<void> => {
  try {
    // Load jQuery first
    await loadScript('https://code.jquery.com/jquery-3.7.1.min.js');
    
    // Load Summernote CSS and JS in parallel
    await Promise.all([
      loadStyle('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.css'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.js')
    ]);
  } catch (error) {
    console.error('Error loading Summernote:', error);
    throw error;
  }
};
