internal import Expo
import React
import ReactAppDependencyProvider
import WebKit

@main
class AppDelegate: ExpoAppDelegate, UIWindowSceneDelegate, WKNavigationDelegate, WKUIDelegate {
  var window: UIWindow?
  /// iOS 26 场景生命周期：launchOptions 需从 didFinishLaunching 传给 scene 回调。
  private var pendingLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // iOS 26 起窗口必须在 scene 回调里创建（UIWindow(windowScene:)），
    // 这里只保留 launchOptions，React Native 在 scene 连接后启动。
    pendingLaunchOptions = launchOptions

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }

  // MARK: - UIScene 生命周期（iOS 26 必需）
  // 应用仍是窗口型启动（didFinishLaunching 里创建 window），这里声明单场景并
  // 把已有 window 挂到该 scene 上，属于 Apple 文档中的兼容迁移路径。

  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = AppDelegate.self
    return configuration
  }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    let window = UIWindow(windowScene: windowScene)
    window.backgroundColor = .white
    self.window = window

    // 口岸通容器：直接使用系统 WKWebView 承载站点。
    // 不经过 React Native / JS bundle，避免 RN 启动期问题导致白屏；
    // 产品本身就是响应式 H5，原生壳只负责显示与导航。
    let controller = UIViewController()
    controller.view.backgroundColor = .white
    let webView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.allowsBackForwardNavigationGestures = true
    webView.navigationDelegate = self
    webView.uiDelegate = self
    controller.view.addSubview(webView)
    NSLayoutConstraint.activate([
      webView.topAnchor.constraint(equalTo: controller.view.topAnchor),
      webView.bottomAnchor.constraint(equalTo: controller.view.bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: controller.view.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: controller.view.trailingAnchor),
    ])
    if let url = URL(string: "https://bianxiaoer.net/") {
      webView.load(URLRequest(url: url))
    }
    window.rootViewController = controller
    window.makeKeyAndVisible()
  }

  // MARK: - WKNavigationDelegate / WKUIDelegate
  // 站点页面留在应用内；外部链接（高德导航、拨号、支付、分享）交给系统打开，
  // WebView 保持在当前页 —— 否则导航会在壳内把页面替换掉且没有返回按钮。

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.allow)
      return
    }
    let scheme = url.scheme?.lowercased() ?? ""
    if scheme == "about" || scheme == "data" || scheme == "blob" {
      decisionHandler(.allow)
      return
    }
    let host = url.host?.lowercased() ?? ""
    if host == "bianxiaoer.net" || host == "www.bianxiaoer.net" {
      decisionHandler(.allow)
      return
    }
    UIApplication.shared.open(url, options: [:], completionHandler: nil)
    decisionHandler(.cancel)
  }

  /// target="_blank" / window.open：同样交给系统，不在壳内新开 WebView。
  func webView(
    _ webView: WKWebView,
    createWebViewWith configuration: WKWebViewConfiguration,
    for navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    if let url = navigationAction.request.url {
      UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
    return nil
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
