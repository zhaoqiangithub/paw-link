// 高德地图 JavaScript 桥接工具
// 处理 React Native 与 WebView 中的 JavaScript 通信

/**
 * 向 WebView 注入 JavaScript 代码
 */
export const injectJavaScript = (script: string): string => {
  return `
    (function() {
      ${script}
    })();
  `;
};

/**
 * 初始化高德地图的 JavaScript 代码
 */
export const getInitMapScript = (
  apiKey: string,
  center: { longitude: number; latitude: number },
  zoom: number = 15
): string => {
  return `
    window.AMapReady = false;
    window.PetMarkers = [];

    // 高德地图加载完成回调
    window.initAMap = function() {
      console.log('高德地图初始化开始...');
      window.AMapReady = true;

      // 创建地图实例
      window.map = new AMap.Map('mapContainer', {
        zoom: ${zoom},
        center: [${center.longitude}, ${center.latitude}],
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
        showLabel: true,
        defaultCursor: 'pointer'
      });

      console.log('高德地图创建完成');

      // 地图加载完成事件
      window.map.on('complete', function() {
        console.log('地图加载完成');
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_LOADED',
            data: {}
          }));
        }
      });

      // 地图点击事件
      window.map.on('click', function(e) {
        const lnglat = e.lnglat;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_CLICK',
            data: {
              longitude: lnglat.lng,
              latitude: lnglat.lat
            }
          }));
        }
      });
    };

    // 添加宠物标记
    window.addPetMarker = function(pet) {
      if (!window.AMapReady || !window.map) {
        console.log('地图未就绪，暂缓添加标记');
        return;
      }

      const iconUrl = getPetIconUrl(pet.status);
      const marker = new AMap.Marker({
        position: [pet.longitude, pet.latitude],
        title: pet.title || '宠物信息',
        icon: new AMap.Icon({
          size: new AMap.Size(40, 40),
          image: iconUrl,
          imageSize: new AMap.Size(40, 40)
        })
      });

      marker.on('click', function() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MARKER_CLICK',
            data: {
              id: pet.id,
              title: pet.title,
              longitude: pet.longitude,
              latitude: pet.latitude
            }
          }));
        }
      });

      window.map.add(marker);
      window.PetMarkers.push(marker);

      console.log('添加宠物标记:', pet.id);
    };

    // 清除所有标记
    window.clearPetMarkers = function() {
      if (window.PetMarkers && window.PetMarkers.length > 0) {
        window.map.remove(window.PetMarkers);
        window.PetMarkers = [];
        console.log('清除所有标记');
      }
    };

    // 获取宠物图标URL
    function getPetIconUrl(status) {
      const colors = {
        'emergency': '#FF4444',
        'needs_rescue': '#FF9800',
        'for_adoption': '#4CAF50',
        'adopted': '#9E9E9E'
      };
      const color = colors[status] || '#4CAF50';

      // 返回SVG格式的图标（简单的圆形标记）
      return 'data:image/svg+xml;base64,' + btoa(
        '<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="20" cy="20" r="18" fill="' + color + '" stroke="white" stroke-width="2"/>' +
          '<circle cx="20" cy="20" r="12" fill="white" opacity="0.3"/>' +
        '</svg>'
      );
    }

    // 获取用户位置
    window.getUserLocation = function() {
      if (!window.AMapReady) {
        console.log('地图未就绪，无法定位');
        return;
      }

      AMap.plugin('AMap.Geolocation', function() {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
          convert: true
        });

        geolocation.getCurrentPosition(function(status, result) {
          if (status === 'complete') {
            const location = result.position;
            console.log('定位成功:', location);
            window.map.setCenter([location.lng, location.lat]);
            window.map.setZoom(15);

            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOCATION_SUCCESS',
                data: {
                  longitude: location.lng,
                  latitude: location.lat,
                  accuracy: result.accuracy
                }
              }));
            }
          } else {
            console.log('定位失败:', result);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOCATION_ERROR',
                data: {
                  message: result.message || '定位失败'
                }
              }));
            }
          }
        });
      });
    };

    console.log('高德地图脚本加载完成');
  `;
};

/**
 * WebView JavaScript 环境变量
 */
export const getWebViewJavaScript = (): string => {
  return `
    window.ReactNativeWebView = {
      postMessage: function(data) {
        window.postMessage(data, '*');
      }
    };
  `;
};

/**
 * 高德地图 HTML 模板
 */
export const getAmapHtmlTemplate = (
  apiKey: string,
  center: { longitude: number; latitude: number },
  zoom: number = 15,
  apiVersion: string = '2.0'
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <title>PawLink 地图</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        #mapContainer {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 20px;
          border-radius: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      </style>
    </head>
    <body>
      <div id="mapContainer"></div>
      <div id="loading">正在加载地图...</div>

      <script src="https://webapi.amap.com/maps?v=${apiVersion}&key=${apiKey}&plugin=AMap.Geolocation"></script>
      <script>
        ${getWebViewJavaScript()}
        ${getInitMapScript(apiKey, center, zoom)}

        // 确保DOM加载完成后初始化地图
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
            window.initAMap();
          }, 100);
        });

        // 监听React Native发送的消息
        window.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);
            console.log('收到React Native消息:', data);

            switch (data.type) {
              case 'ADD_PETS':
                window.clearPetMarkers();
                if (data.pets && data.pets.length > 0) {
                  data.pets.forEach(function(pet) {
                    window.addPetMarker(pet);
                  });
                }
                break;

              case 'CLEAR_PETS':
                window.clearPetMarkers();
                break;

              case 'GET_LOCATION':
                window.getUserLocation();
                break;

              case 'CENTER_MAP':
                if (data.longitude && data.latitude) {
                  window.map.setCenter([data.longitude, data.latitude]);
                }
                break;
            }
          } catch (err) {
            console.error('处理消息错误:', err);
          }
        });
      </script>
    </body>
    </html>
  `;
};
