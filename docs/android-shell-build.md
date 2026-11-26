# 边小二 Android 壳构建（android-shell）

> 2026-11-24 起，Android 端使用 `android-shell` 极简工程：单个 Activity + 系统 WebView，
> 加载 `https://bianxiaoer.net/`。**不再使用 `app-v2` 的 Expo/RN 构建链**（原因见文末"坑"）。

## 1. 工程结构

```text
android-shell/
  app/src/main/java/com/bianxiaoer/app/MainActivity.java   入口：WebView + 外链分流
  app/src/main/AndroidManifest.xml                         权限、启动 Activity、主题
  app/src/main/res/values/strings.xml                      应用名「边小二」
  app/src/main/res/mipmap-*                                图标（复用旧版）
  app/src/main/res/values/styles.xml                       主题（系统 Material，无 AppCompat 依赖）
  app/build.gradle                                         compileSdk 36 / buildTools 36.0.0 / 版本号
  app/debug.keystore                                       签名（与旧版一致，保证可覆盖安装）
  local.properties                                         sdk.dir
```

## 2. 前置条件

```text
JDK        /Applications/Android Studio.app/Contents/jbr/Contents/Home（JDK 21）
Android SDK ~/Library/Android/sdk
           需已安装 platforms/android-36 与 build-tools/36.0.0
```

系统 `java` 可能未链接到 JDK，**必须显式设置 JAVA_HOME**，否则报
`Unable to locate a Java Runtime`。

## 3. 构建

```bash
cd projects/bian-xiao-er/android-shell
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew assembleRelease --console=plain --no-daemon
```

产物：`app/build/outputs/apk/release/app-release.apk`

首次构建约 2 分钟（会下载 AGP）；之后增量 20–40 秒。

## 4. 产物校验（发版前必做）

```bash
BT=~/Library/Android/sdk/build-tools/36.0.0
APK=app/build/outputs/apk/release/app-release.apk

# 包名 / 版本 / 启动 Activity
$BT/aapt2 dump badging "$APK" | grep -E "^package|launchable-activity|application-label"

# 签名证书（必须与旧版一致，否则覆盖安装会签名冲突）
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
$BT/apksigner verify --print-certs "$APK" | grep "SHA-256"
```

期望值：

```text
package          com.bianxiaoer.app
versionName      2.1.0（随 build.gradle 变更）
label            边小二
证书 SHA-256     fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c
```

证书指纹不一致时，用户必须先卸载旧版才能安装。

## 5. 发布

```bash
cp "$APK" ../release/bianxiaoer-android-v<N>-kouantong.apk
shasum -a 256 ../release/bianxiaoer-android-v<N>-kouantong.apk
```

把 APK 与 sha256 一起交付；安装时需允许「安装未知来源应用」。

## 6. 常见坑

1. **不要在 `app-v2/android` 里构建。** 那条 Expo/RN 链在本机会卡在 settings 插件阶段
   （日志停在 `processResources UP-TO-DATE` 不再推进），换 JDK 17/21、`--offline`、
   `-Dkotlin.compiler.execution.strategy=in-process`、清 Gradle 锁都无效。
2. **AGP 会尝试下载 Build-Tools 34。** 已在 `app/build.gradle` 钉死
   `compileSdk 36` + `buildToolsVersion '36.0.0'`（本机已安装版本），避免触发下载。
3. **看起来"卡住"其实是下载。** Gradle 下载依赖时默认不输出进度；
   加 `--info` 才能看到 `Downloading https://...` 行。
4. **强杀 Gradle 会留锁。** 出现无故等待时执行 `./gradlew --stop` 再重试。
5. **zsh 里 `kill -9` 后仍显示进程**：多为轮询循环的子 shell，确认 `ps -p <pid>` 为空即可。

## 7. 改哪里

| 想改 | 位置 |
|---|---|
| 站点地址 / 白名单 | `MainActivity.java` 的 `loadUrl` 与 `shouldOverrideUrlLoading` |
| 应用名 | `res/values/strings.xml` 的 `app_name` |
| 图标 | `res/mipmap-*`（含 anydpi-v26 的自适应图标） |
| 版本号 | `app/build.gradle` 的 `versionCode` / `versionName` |
| 启动主题 / 状态栏颜色 | `res/values/styles.xml` |

## 8. iOS 对照

iOS 壳在 `app-v2/ios`，入口是 `AppDelegate.swift` 里的 WKWebView（已适配 iOS 26 的
UIScene 生命周期），外链分流规则与 Android 一致。

```bash
cd app-v2
xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath /tmp/bxe-dd \
  DEVELOPMENT_TEAM=754H3T99SY CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates \
  IPHONEOS_DEPLOYMENT_TARGET=16.4 build

xcrun devicectl device install app --device <UDID> /tmp/bxe-dd/Build/Products/Release-iphoneos/app.app
```

## 8.5 定位权限（2026-11-26 补）

H5 出行页的「开启定位」走 `navigator.geolocation.getCurrentPosition`。Android WebView
默认关闭定位，且宿主不处理权限回调时**点击毫无反应**（既不弹系统框也不报错）。

壳里必须同时具备三件事，缺一不可：

```text
AndroidManifest   ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
WebSettings       setGeolocationEnabled(true)
WebChromeClient   onGeolocationPermissionsShowPrompt
                  → 已有权限：callback.invoke(origin, true, false)
                  → 无权限：requestPermissions(...)，在 onRequestPermissionsResult 里再 invoke
```

用户曾拒绝过授权时系统不再弹窗，只能引导到
「设置 → 应用 → 边小二 → 权限 → 位置」手动开启。

iOS 侧不需要额外代码：`Info.plist` 已有 `NSLocationWhenInUseUsageDescription`，
WKWebView 会自行弹出系统定位授权框（实测正常）。

## 9. 两端共同待补

`<input type="file">` 目前不会弹出相册/相机：
- Android 需要 `WebChromeClient.onShowFileChooser`
- iOS 需要 `WKUIDelegate` 的 file input 回调

等 H5 需要图片上传（如拍照识别商品）时一起补。
