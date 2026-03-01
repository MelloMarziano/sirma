import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';

import { AppModule } from './app/app.module';


platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    if (!environment.production || !('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    });
  })
  .catch(err => console.error(err));
