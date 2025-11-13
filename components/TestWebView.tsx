import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// 测试用的简单HTML页面
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WebView 测试</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
    }
    h1 {
      color: #4CAF50;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .success {
      color: #4CAF50;
      font-size: 18px;
      margin: 20px 0;
    }
    .info {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px;
    }
    button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 WebView 测试成功！</h1>
    <div class="success">✅ 您的 WebView 工作正常</div>

    <div class="info">
      <p><strong>测试信息：</strong></p>
      <p>✅ HTML 页面正常显示</p>
      <p>✅ JavaScript 正常运行</p>
      <p>✅ React Native WebView 集成成功</p>
    </div>

    <button onclick="testPostMessage()">发送消息到 React Native</button>

    <div class="info" id="messageLog">
      <p>点击按钮测试消息传递</p>
    </div>
  </div>

  <script>
    let messageCount = 0;

    // 测试向 React Native 发送消息
    function testPostMessage() {
      messageCount++;
      const message = {
        type: 'TEST_MESSAGE',
        data: {
          count: messageCount,
          timestamp: Date.now(),
          message: '这是来自 WebView 的测试消息'
        }
      };

      // 发送消息到 React Native
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(message));

      // 更新页面显示
      const logDiv = document.getElementById('messageLog');
      logDiv.innerHTML = \`
        <p><strong>消息已发送 (\${messageCount})</strong></p>
        <p>类型: \${message.type}</p>
        <p>内容: \${message.data.message}</p>
        <p>时间: \${new Date(message.data.timestamp).toLocaleTimeString()}</p>
      \`;
      logDiv.style.background = '#c8e6c9';
    }

    // 监听来自 React Native 的消息
    window.addEventListener('message', function(e) {
      const logDiv = document.getElementById('messageLog');
      logDiv.innerHTML += '<p style="color: #1976d2;">📨 收到 React Native 消息: ' + e.data + '</p>';
      logDiv.style.background = '#fff3e0';
    });

    // 页面加载完成
    window.addEventListener('load', function() {
      console.log('✅ 测试页面加载完成');

      // 发送初始化消息
      setTimeout(function() {
        testPostMessage();
      }, 500);
    });
  </script>
</body>
</html>
`;

interface TestWebViewProps {
  onMessage?: (data: any) => void;
}

export const TestWebView: React.FC<TestWebViewProps> = ({ onMessage }) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 TestWebView 收到消息:', data);

      if (onMessage) {
        onMessage(data);
      }

      if (data.type === 'TEST_MESSAGE') {
        Alert.alert(
          '🎉 测试成功！',
          `收到 WebView 消息:\\n${JSON.stringify(data.data, null, 2)}`
        );
      }
    } catch (error) {
      console.log('原始消息:', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: TEST_HTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  },
});
