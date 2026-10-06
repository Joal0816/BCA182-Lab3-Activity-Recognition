# Android APK Generation Guide (Bubblewrap / TWA & Capacitor)

The Kinesis PWA satisfies all Progressive Web App criteria (installable manifest, service worker caching offline shell, responsive viewports, maskable icons, and valid asset links).

## Method 1: Google Bubblewrap CLI (Trusted Web Activity - Recommended)

Bubblewrap compiles the PWA directly into an Android Studio APK / AAB container using Google's official Trusted Web Activity standard:

```bash
# 1. Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize from the deployed PWA domain
bubblewrap init --manifest https://kinesis.joalvergs.tech/manifest.webmanifest

# 3. Build APK
bubblewrap build
```

This generates `app-release-signed.apk` ready for sideloading on your Android device.

## Method 2: PWABuilder (Zero Toolchain)
1. Navigate to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your live domain: `https://kinesis.joalvergs.tech`
3. Click **Package for Android** -> Download Signed APK package.
