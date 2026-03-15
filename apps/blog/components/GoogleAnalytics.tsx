'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = 'G-SXYY6Z978M';

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
      });
    }
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
