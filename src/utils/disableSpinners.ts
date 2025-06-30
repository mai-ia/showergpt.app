/**
 * Utility to disable all spinner and loading animations
 */

export function disableSpinners() {
  console.log('Disabling all spinners and loading animations');
  
  // Add the no-spinners class to the document body
  document.body.classList.add('no-spinners');
  
  // Find and remove all spinner elements
  const removeSpinners = () => {
    // Target common spinner class names and elements
    const spinnerSelectors = [
      '.animate-spin',
      '.animate-pulse',
      '.animate-bounce',
      '.animate-shimmer',
      '.mobile-shimmer',
      '.mobile-skeleton',
      '.loading-skeleton',
      '[class*="loader"]',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[aria-busy="true"]',
      '.Loader2',
      'svg.lucide-loader',
      'svg.lucide-loader-2',
      'svg.lucide-refresh-cw[class*="animate-"]',
      'svg.lucide-rotate-cw[class*="animate-"]'
    ];
    
    // Find all elements matching our selectors
    const spinnerElements = document.querySelectorAll(spinnerSelectors.join(', '));
    
    // Hide them
    spinnerElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
        element.style.opacity = '0';
        element.style.animation = 'none';
        element.style.visibility = 'hidden';
      }
    });
    
    // Replace loading text in buttons
    document.querySelectorAll('button:disabled').forEach(button => {
      const span = button.querySelector('span');
      if (span) {
        const text = span.textContent || '';
        if (text.includes('Loading') || text.includes('Saving') || text.includes('Processing')) {
          span.textContent = 'Please wait';
        }
      }
    });
  };
  
  // Run immediately
  removeSpinners();
  
  // Set up a MutationObserver to catch dynamically added spinners
  const observer = new MutationObserver((mutations) => {
    let shouldRemove = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldRemove = true;
      } else if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' || 
                 mutation.attributeName === 'style')) {
        shouldRemove = true;
      }
    });
    
    if (shouldRemove) {
      removeSpinners();
    }
  });
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Return a function to stop observing if needed
  return () => observer.disconnect();
}

export default disableSpinners;