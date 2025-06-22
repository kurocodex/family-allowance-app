# Deployment Guide - Browser Compatibility & Cache Management

This guide explains the enhanced deployment process that automatically handles browser compatibility and caching issues.

## Overview

The application now includes comprehensive solutions for:
- ✅ Automatic cache invalidation on deployments
- ✅ Browser compatibility polyfills
- ✅ Service Worker cache strategies
- ✅ MIME type handling
- ✅ Asset versioning and cache busting
- ✅ Chunk loading error recovery
- ✅ PWA manifest optimization

## Quick Deployment

```bash
# Enhanced deployment with automatic cache busting
npm run build:deploy

# Or deploy directly to Vercel with cache invalidation
npm run deploy
```

## What the Enhanced System Does

### 1. **Automatic Cache Invalidation**
- Generates unique deployment IDs for each build
- Updates service worker versions automatically
- Creates build hash files for runtime detection
- Invalidates all cache layers on deployment

### 2. **Browser Compatibility**
- Polyfills for older browsers (Promise, fetch, Object.assign, etc.)
- Feature detection and graceful degradation
- CSS compatibility classes
- Fallback mechanisms for unsupported features

### 3. **Service Worker Enhancements**
- Dynamic cache versioning
- Multiple cache strategies (Network First, Cache First, Stale While Revalidate)
- Automatic old cache cleanup
- Chunk loading error recovery

### 4. **Vercel Configuration**
- Comprehensive HTTP headers for caching
- Proper MIME type declarations
- Security headers (CSP, X-Frame-Options, etc.)
- Asset-specific cache policies

### 5. **Runtime Cache Management**
- Automatic update detection
- Smart cache refresh
- Cache health monitoring
- User-friendly update notifications

## Deployment Commands

### Standard Build
```bash
npm run build
```

### Enhanced Deployment Build
```bash
npm run build:deploy
```
This command:
1. Updates cache-busting files
2. Generates unique deployment IDs
3. Updates service worker versions
4. Builds the application
5. Applies post-build optimizations

### Clear Cache (Manual)
```bash
npm run cache:clear
```

### Deploy to Vercel
```bash
npm run deploy
```

## File Structure

### New Files Created:
- `/scripts/deploy-with-cache-bust.js` - Deployment automation script
- `/src/utils/polyfills.ts` - Browser compatibility polyfills
- `/src/utils/cacheInvalidation.ts` - Runtime cache management
- `/DEPLOYMENT-GUIDE.md` - This guide

### Enhanced Files:
- `/vite.config.ts` - Improved build configuration
- `/vercel.json` - Comprehensive headers and caching
- `/public/sw.js` - Advanced service worker
- `/src/utils/pwa.ts` - Enhanced PWA utilities
- `/src/main.tsx` - Error handling and compatibility checks
- `/src/App.tsx` - Cache management integration
- `/package.json` - New deployment scripts

## Browser Support

### Minimum Supported Browsers:
- Chrome 87+
- Firefox 78+
- Safari 13.1+
- Edge 88+

### Polyfill Coverage:
- Promise API
- Fetch API
- Object.assign
- Array methods (includes, from)
- String methods (includes, startsWith, endsWith)
- Map and Set (simplified)
- CustomEvent
- RequestAnimationFrame

## Cache Strategies

### Static Assets (`/assets/**`)
- **Strategy**: Cache First
- **Cache Time**: 1 year (immutable)
- **Versioning**: Hash-based filenames

### HTML Files
- **Strategy**: Network First
- **Cache Time**: No cache (always fresh)
- **Revalidation**: On every request

### Service Worker (`/sw.js`)
- **Strategy**: Network First
- **Cache Time**: No cache
- **Versioning**: Query parameter based

### API Requests
- **Strategy**: Network First
- **Fallback**: Cached response if network fails
- **Cache Time**: Dynamic based on content

## Troubleshooting

### Common Issues and Solutions

#### 1. **Chunk Loading Errors**
**Solution**: Automatic detection and reload prompt
```javascript
// Automatically handled by the system
// Users see: "アプリケーションが更新されました。最新バージョンを読み込むため、ページを再読み込みします。"
```

#### 2. **Service Worker Not Updating**
**Solution**: Dynamic versioning with timestamp
```bash
# Force service worker update
npm run cache:clear
npm run build:deploy
```

#### 3. **Browser Compatibility Issues**
**Solution**: Automatic feature detection and warnings
```javascript
// Shows warning banner for unsupported browsers
// Provides fallback functionality where possible
```

#### 4. **Cache Not Invalidating**
**Solution**: Multiple cache-busting strategies
```bash
# Manual cache invalidation
npm run cache:clear
```

### Debug Information

Enable debug logging in browser console:
```javascript
// Browser compatibility info
console.log('[Polyfills] Detected features:', features);

// Cache management logs
console.log('[Cache] Cache system healthy');

// Service worker logs
console.log('[SW] Installing version:', APP_VERSION);
```

## Production Checklist

Before deploying to production:

1. ✅ Run `npm run build:deploy` instead of `npm run build`
2. ✅ Verify service worker registers correctly
3. ✅ Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. ✅ Test offline functionality
5. ✅ Verify cache invalidation works
6. ✅ Check console for errors
7. ✅ Test PWA installation
8. ✅ Verify update notifications work

## Monitoring

### Runtime Monitoring
The system automatically logs:
- Browser capability detection
- Cache health status
- Service worker updates
- Performance metrics
- Error conditions

### Key Metrics to Watch:
- Chunk loading errors
- Service worker registration failures
- Cache invalidation events
- Browser compatibility warnings

## Manual Cache Management

### For Developers:
```javascript
// Clear all caches
import { clearAllApplicationCaches } from './src/utils/cacheInvalidation';
await clearAllApplicationCaches();

// Force app update
import { manualCacheRefresh } from './src/utils/cacheInvalidation';
await manualCacheRefresh();

// Check for updates
import { checkForAppUpdates } from './src/utils/cacheInvalidation';
const { hasUpdate } = await checkForAppUpdates();
```

### For End Users:
No manual action required! The system automatically:
- Detects updates
- Shows update notifications
- Handles cache invalidation
- Provides reload prompts when needed

## Security Considerations

The enhanced configuration includes:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy restrictions

## Performance Optimizations

- Hash-based asset versioning for optimal caching
- Code splitting by vendor libraries
- Automatic image optimization
- Font preloading
- DNS prefetching for external resources
- Chunk size optimization
- Tree shaking for smaller bundles

## Next Steps

1. Deploy using `npm run deploy`
2. Monitor browser console for any compatibility warnings
3. Test the update notification system
4. Verify cache invalidation works correctly
5. Set up monitoring for chunk loading errors

The system is now production-ready with automatic cache management and broad browser compatibility!