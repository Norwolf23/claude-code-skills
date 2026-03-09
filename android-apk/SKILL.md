---
name: android-apk
description: Build native Android APKs without Android Studio using raw SDK tools (javac, d8, aapt, apksigner). Produces tiny APKs (~30KB) that build in under 2 seconds.
---

# /android-apk -- Build Native Android APKs Without Android Studio

Build minimal Android APKs using raw SDK tools (javac, d8, aapt, apksigner). No Gradle, no Android Studio, no bloat. Produces tiny APKs (~30KB) that build in <2s.

## Origin

Extracted from a real session building a share-sheet APK for posting URLs to a Cloudflare Access-protected API. (Mar 2026)

## When to Use

- Android share sheet integration (ACTION_SEND intent)
- Lightweight companion APKs for web tools
- Any Android app that just needs to POST data to an API
- When you need an APK and don't want 500MB of Gradle overhead

## Prerequisites

Android SDK command-line tools installed:

```
ANDROID_HOME=~/android-sdk
JAVA_HOME=~/android-sdk/jdk-17
Build tools: 34.0.0
Platform: android-34
```

If missing, install:
```bash
# JDK 17 (portable, no sudo)
cd ~/android-sdk
wget https://download.oracle.com/java/17/archive/jdk-17.0.12_linux-x64_bin.tar.gz
tar xf jdk-17.0.12_linux-x64_bin.tar.gz

# Android SDK command-line tools
mkdir -p cmdline-tools/latest
# Download from https://developer.android.com/studio#command-line-tools-only
unzip commandlinetools-linux-*.zip -d cmdline-tools/latest
cmdline-tools/latest/bin/sdkmanager "build-tools;34.0.0" "platforms;android-34"
```

---

## Procedure

### Step 1: Scaffold Project

```
$PROJECT/
  AndroidManifest.xml
  build.sh
  java/$PACKAGE_PATH/$ACTIVITY.java
  res/
    mipmap-hdpi/ic_launcher.png      (48x48)
    mipmap-xhdpi/ic_launcher.png     (96x96)
    mipmap-xxhdpi/ic_launcher.png    (144x144)
    mipmap-xxxhdpi/ic_launcher.png   (192x192)
```

### Step 2: AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="$PACKAGE"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34"/>
    <uses-permission android:name="android.permission.INTERNET"/>

    <application android:label="$APP_NAME" android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".$ACTIVITY"
            android:exported="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">

            <!-- Share sheet integration -->
            <intent-filter>
                <action android:name="android.intent.action.SEND"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <data android:mimeType="text/plain"/>
            </intent-filter>

            <!-- App launcher icon -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

**Key decisions:**
- `Theme.Translucent.NoTitleBar` -- no visible window, just toast + finish
- Both SEND and MAIN intent-filters -- share sheet AND launcher icon
- LAUNCHER opens web UI via `Intent.ACTION_VIEW` (no need for a full Android UI)

### Step 3: Java Activity

Template for share-to-API pattern:

```java
package $PACKAGE;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class $ACTIVITY extends Activity {

    private static final String API_URL = "$API_ENDPOINT";
    // Auth headers (if using Cloudflare Access or similar)
    private static final String AUTH_CLIENT_ID = "$AUTH_CLIENT_ID";
    private static final String AUTH_CLIENT_SECRET = "$AUTH_CLIENT_SECRET";
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[^\\s]+");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String sharedText = null;
        Intent intent = getIntent();

        if (Intent.ACTION_SEND.equals(intent.getAction())
                && "text/plain".equals(intent.getType())) {
            sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        }

        if (sharedText == null || sharedText.isEmpty()) {
            // Launched from app list -- open web UI
            startActivity(new Intent(Intent.ACTION_VIEW,
                Uri.parse("$WEB_UI_URL")));
            finish();
            return;
        }

        // Extract URL from shared text (apps often share "Title - URL")
        String url = sharedText.trim();
        Matcher matcher = URL_PATTERN.matcher(sharedText);
        if (matcher.find()) {
            url = matcher.group();
        }

        String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (title == null) title = "";
        String note = sharedText.replace(url, "").trim();

        final String finalUrl = url;
        final String finalTitle = title;
        final String finalNote = note;

        new Thread(() -> {
            boolean success = postData(finalUrl, finalTitle, finalNote);
            runOnUiThread(() -> {
                Toast.makeText(this,
                    success ? "Saved" : "Failed",
                    Toast.LENGTH_SHORT).show();
                finish();
            });
        }).start();
    }

    private boolean postData(String linkUrl, String title, String note) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(API_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false);  // CRITICAL for CF Access
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            // Auth headers (adapt to your auth system)
            conn.setRequestProperty("CF-Access-Client-Id", AUTH_CLIENT_ID);
            conn.setRequestProperty("CF-Access-Client-Secret", AUTH_CLIENT_SECRET);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);

            String json = "{\"url\":" + jsonString(linkUrl)
                + ",\"title\":" + jsonString(title)
                + ",\"text\":" + jsonString(note) + "}";

            byte[] body = json.getBytes(StandardCharsets.UTF_8);
            OutputStream os = conn.getOutputStream();
            os.write(body);
            os.flush();
            os.close();

            return (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300);
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String jsonString(String s) {
        if (s == null || s.isEmpty()) return "\"\"";
        return "\"" + s.replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t") + "\"";
    }
}
```

### Step 4: build.sh

```bash
#!/bin/bash
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
JAVA_HOME="${JAVA_HOME:-$ANDROID_HOME/jdk-17.0.12}"
BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
PLATFORM="$ANDROID_HOME/platforms/android-34/android.jar"
OUT="build"
APP_NAME="$APP_NAME_KEBAB"    # e.g., "my-app"
KEY_ALIAS="$KEY_ALIAS"        # e.g., "my-app"
PACKAGE_PATH="$PACKAGE_SLASH" # e.g., "com/example/app"

export PATH="$JAVA_HOME/bin:$BUILD_TOOLS:$PATH"

rm -rf "$OUT"
mkdir -p "$OUT/obj" "$OUT/gen"

echo "1/6 Compiling resources..."
"$BUILD_TOOLS/aapt" package -f -m \
    -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$PLATFORM"

echo "2/6 Compiling Java..."
javac --release 11 -classpath "$PLATFORM" -d "$OUT/obj" \
    -sourcepath "$OUT/gen:java" \
    $OUT/gen/$PACKAGE_PATH/R.java \
    java/$PACKAGE_PATH/*.java

echo "3/6 Converting to DEX..."
"$BUILD_TOOLS/d8" --release --lib "$PLATFORM" --output "$OUT/" \
    $(find "$OUT/obj" -name '*.class')

echo "4/6 Packaging APK..."
"$BUILD_TOOLS/aapt" package -f \
    -M AndroidManifest.xml -S res -I "$PLATFORM" \
    -F "$OUT/$APP_NAME.unsigned.apk" "$OUT/"

echo "5/6 Aligning..."
"$BUILD_TOOLS/zipalign" -f -p 4 \
    "$OUT/$APP_NAME.unsigned.apk" "$OUT/$APP_NAME.aligned.apk"

if [ ! -f keystore.jks ]; then
    echo "    Generating signing key..."
    keytool -genkeypair -keystore keystore.jks -alias "$KEY_ALIAS" \
        -dname "CN=Developer, O=Development" -validity 10000 \
        -keyalg RSA -keysize 2048 -storepass android -keypass android
fi

echo "6/6 Signing..."
"$BUILD_TOOLS/apksigner" sign --ks keystore.jks --ks-key-alias "$KEY_ALIAS" \
    --ks-pass pass:android --key-pass pass:android \
    --out "$OUT/$APP_NAME.apk" "$OUT/$APP_NAME.aligned.apk"

rm -f "$OUT/$APP_NAME.unsigned.apk" "$OUT/$APP_NAME.aligned.apk"
rm -rf "$OUT/obj" "$OUT/gen" "$OUT/classes.dex"

echo ""
echo "Built: $OUT/$APP_NAME.apk"
ls -lh "$OUT/$APP_NAME.apk"
```

### Step 5: Build and Deploy

```bash
# Build
chmod +x build.sh
bash build.sh

# Deploy to web server for download
scp build/$APP_NAME.apk yourserver:/path/to/static/
# Or serve directly via any HTTPS endpoint
```

### Step 6: Install on Android

Download APK via browser or `adb install build/$APP_NAME.apk`.

---

## Gotchas (Discovered in Production)

### 1. Cloudflare Access 302 Redirect
`HttpURLConnection` follows redirects by default. CF Access returns 302 to login page, which returns 200 HTML. Your app sees "200 OK" but it's the login page, not your API.

**Fix:** `conn.setInstanceFollowRedirects(false)` -- then a 302 means auth failed.

### 2. CF Service Token Policy
Creating a Service Auth policy via Cloudflare Dashboard may silently fail. Use the API:

```bash
CF_TOKEN="your-api-token"
APP_ID="your-access-app-id"
ACCOUNT_ID="your-account-id"

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/access/apps/$APP_ID/policies" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "APK Service Token",
    "decision": "non_identity",
    "include": [{"service_token": {"token_id": "YOUR_SERVICE_TOKEN_UUID"}}],
    "precedence": 1
  }'
```

**Key:** `decision: "non_identity"` (not "allow"). `precedence: 1` to evaluate before identity policies.

### 3. build.sh Line Endings
If build.sh is created with Write tool or on Windows, it may have `\r\n` line endings.

**Fix:** `sed -i 's/\r$//' build.sh`

### 4. JAVA_HOME Tilde Expansion
`~/android-sdk/jdk-17.0.12` does NOT expand in all contexts. Always use `$HOME/android-sdk/jdk-17.0.12` or the absolute path.

### 5. APK Caching
Cloudflare and browser cache APKs aggressively. When deploying updates, rename the file (e.g., `app-v2.apk`) to bust cache.

### 6. Unicode Surrogates in API Payloads
If your app processes text containing emoji (e.g., from Twitter), unpaired Unicode surrogates can break JSON APIs. Strip them:

```javascript
function sanitizeText(str) {
  if (!str) return "";
  return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
            .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
```

### 7. Launcher Visibility
Without `android.intent.action.MAIN` + `android.intent.category.LAUNCHER` intent-filter, the app won't appear in app drawers (including minimal launchers like Niagara). Always include both SEND and MAIN filters.

---

## Cloudflare Access Service Token Pattern

For any APK hitting a CF Access-protected API:

1. Create Service Token in CF dashboard (Access > Service Auth > Create)
2. Create policy via API with `decision: "non_identity"`
3. Add headers to Java HTTP client:
   ```java
   conn.setRequestProperty("CF-Access-Client-Id", CLIENT_ID);
   conn.setRequestProperty("CF-Access-Client-Secret", CLIENT_SECRET);
   ```
4. Store credentials securely (not hardcoded in source for production)

---

## Build Pipeline Summary

```
aapt package -m   (generate R.java from resources)
    |
javac --release 11  (compile Java to .class files)
    |
d8 --release       (convert .class to DEX bytecode)
    |
aapt package -f    (package DEX + resources into unsigned APK)
    |
zipalign -p 4      (align for memory-mapped access)
    |
apksigner sign     (sign with keystore for Android install)
    |
~30KB APK, builds in <2s
```

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
