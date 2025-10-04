import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  ActivityIndicator,
  Alert,
  Platform,
  BackHandler,
  Share,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

const WEBSITE_URL = 'https://israeliparliament.org/boca/user/';

const App = () => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(WEBSITE_URL);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      if (!state.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Notification setup removed - can be added later with Firebase configuration

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [canGoBack]);


  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  const handleError = () => {
    Alert.alert(
      'Connection Error',
      'Unable to load the website. Please check your internet connection.',
      [
        { text: 'Retry', onPress: () => webViewRef.current?.reload() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  // Handle share functionality
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out Boca Parliament: ${currentUrl}`,
        url: currentUrl,
        title: 'Boca Parliament',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url.replace('bocaparliament://', WEBSITE_URL);
      webViewRef.current?.injectJavaScript(
        `window.location.href = "${url}";`
      );
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        const webUrl = url.replace('bocaparliament://', WEBSITE_URL);
        setCurrentUrl(webUrl);
      }
    });

    return () => subscription.remove();
  }, []);

  // Inject JavaScript for enhanced features
  const injectedJavaScript = `
    (function() {
      // Improve mobile experience
      const style = document.createElement('style');
      style.innerHTML = \`
        * {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        body {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
      \`;
      document.head.appendChild(style);

      // Add share button functionality
      window.addEventListener('load', function() {
        // Intercept share buttons if they exist
        document.querySelectorAll('[data-share]').forEach(button => {
          button.addEventListener('click', function(e) {
            e.preventDefault();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'share',
              url: window.location.href,
              title: document.title
            }));
          });
        });

        // Add calendar event functionality
        document.querySelectorAll('[data-add-to-calendar]').forEach(button => {
          button.addEventListener('click', function(e) {
            const eventData = {
              type: 'addToCalendar',
              title: button.dataset.title,
              startDate: button.dataset.startDate,
              endDate: button.dataset.endDate,
              location: button.dataset.location,
              notes: button.dataset.notes
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(eventData));
          });
        });
      });

      // Notify app when page is loaded
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pageLoaded',
        url: window.location.href
      }));
    })();
    true;
  `;

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'share':
          handleShare();
          break;
        case 'addToCalendar':
          // This will be handled by the calendar integration
          console.log('Add to calendar:', data);
          // addEventToCalendar(data);
          break;
        case 'pageLoaded':
          console.log('Page loaded:', data.url);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // Offline page HTML
  const offlineHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .offline-icon {
            font-size: 80px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 30px;
          }
          button {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="offline-icon">📡</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="location.reload()">Retry</button>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      )}

      {isConnected ? (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onLoadEnd={handleLoadEnd}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={true}
          allowsBackForwardNavigationGestures={true}
          mixedContentMode="compatibility"
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          // iOS specific
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Android specific
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
        />
      ) : (
        <WebView
          source={{ html: offlineHtml }}
          style={styles.webview}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 999,
  },
});

export default App;