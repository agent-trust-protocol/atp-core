'use client';

import { useEffect } from 'react';

export default function TallyForm() {
  useEffect(() => {
    // Load Tally embed script once
    const existing = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      script.onload = () => {
        // @ts-expect-error Tally global injected by embed script
        if (typeof window.Tally !== 'undefined') {
          // @ts-expect-error
          window.Tally.loadEmbeds();
        }
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded — just trigger loadEmbeds
      // @ts-expect-error
      if (typeof window.Tally !== 'undefined') {
        // @ts-expect-error
        window.Tally.loadEmbeds();
      }
    }
  }, []);

  return (
    <iframe
      data-tally-src="https://tally.so/embed/9q6XK4?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
      loading="lazy"
      width="100%"
      height="284"
      frameBorder={0}
      marginHeight={0}
      marginWidth={0}
      title="ATP Access Request Form"
      className="w-full"
      style={{ minHeight: '284px' }}
    />
  );
}
