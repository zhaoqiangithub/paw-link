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
    window.map = null;

    // 检查AMap对象是否可用
    function checkAMapAndInit() {
      if (typeof AMap !== 'undefined' && AMap.Map) {
        initAMap();
      } else {
        setTimeout(checkAMapAndInit, 100);
      }
    }

    // 高德地图加载完成回调
    window.initAMap = function() {
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

      // 地图加载完成事件
      window.map.on('complete', function() {
        // 隐藏加载提示
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
          loadingDiv.style.display = 'none';
        }

        // 发送加载完成消息到 React Native
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_LOADED',
            data: {}
          }));
        }

        // 检查是否为Web平台（通过User-Agent）
        const isWeb = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('WebView') === -1;
        console.log('Platform check:', isWeb ? 'Web' : 'Native');

        // 只在Native平台自动定位，Web端需要用户手动点击定位按钮
        if (!isWeb) {
          setTimeout(function() {
            if (typeof window.getUserLocation === 'function') {
              console.log('Auto-getting location for native platform');
              window.getUserLocation();
            }
          }, 500);
        } else {
          console.log('Web platform detected, waiting for user to click location button');
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

    // 立即检查并开始初始化
    checkAMapAndInit();

    // 添加宠物标记
    window.addPetMarker = function(pet) {
      if (!window.AMapReady || !window.map) {
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
    };

    // 清除所有标记
    window.clearPetMarkers = function() {
      if (window.PetMarkers && window.PetMarkers.length > 0) {
        window.map.remove(window.PetMarkers);
        window.PetMarkers = [];
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
        console.log('AMap not ready yet');
        return;
      }

      console.log('Starting location request...');

      AMap.plugin('AMap.Geolocation', function() {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          convert: true,
          showButton: false,
          showMarker: true,
          panToLocation: true,
          zoomToAccuracy: true
        });

        // 设置超时处理
        const timeoutId = setTimeout(function() {
          console.log('Location request timeout');
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOCATION_ERROR',
              data: {
                message: '定位超时，请检查定位权限和网络连接'
              }
            }));
          }
        }, 12000);

        geolocation.getCurrentPosition(function(status, result) {
          clearTimeout(timeoutId);
          console.log('Location status:', status, 'result:', result);

          if (status === 'complete') {
            const location = result.position;

            // 在地图上添加用户位置标记
            if (window.userLocationMarker) {
              window.map.remove(window.userLocationMarker);
            }

            window.userLocationMarker = new AMap.Marker({
              position: [location.lng, location.lat],
              title: '我的位置',
              icon: new AMap.Icon({
                size: new AMap.Size(30, 30),
                image: 'data:image/svg+xml;base64,' + btoa(
                  '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">' +
                    '<circle cx="15" cy="15" r="13" fill="#2196F3" stroke="white" stroke-width="2"/>' +
                    '<circle cx="15" cy="15" r="6" fill="white"/>' +
                  '</svg>'
                ),
                imageSize: new AMap.Size(30, 30)
              })
            });

            window.map.add(window.userLocationMarker);
            window.map.setCenter([location.lng, location.lat]);
            window.map.setZoom(16);

            console.log('Location success:', location.lng, location.lat);

            // 地理编码：将坐标转换为具体街道地址
            AMap.plugin('AMap.Geocoder', function() {
              const geocoder = new AMap.Geocoder({
                batch: false
              });

              geocoder.getAddress([location.lng, location.lat], function(status, result) {
                console.log('Geocoder status:', status);
                if (status === 'complete' && result.geocodes.length > 0) {
                  const addressComponent = result.geocodes[0].addressComponent;
                  const streetNumber = result.geocodes[0].street;
                  const formattedAddress = result.geocodes[0].formattedAddress;

                  // 构造详细地址
                  let detailedAddress = '';
                  if (addressComponent.province) detailedAddress += addressComponent.province;
                  if (addressComponent.city && addressComponent.city !== addressComponent.province) detailedAddress += addressComponent.city;
                  if (addressComponent.district) detailedAddress += addressComponent.district;
                  if (streetNumber) detailedAddress += streetNumber;
                  if (addressComponent.township) detailedAddress += addressComponent.township;

                  console.log('Address:', detailedAddress || formattedAddress);

                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'LOCATION_SUCCESS',
                      data: {
                        longitude: location.lng,
                        latitude: location.lat,
                        accuracy: result.accuracy || 0,
                        address: detailedAddress || formattedAddress || '未知地址'
                      }
                    }));
                  }
                } else {
                  console.log('Geocoder failed, sending location without address');
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'LOCATION_SUCCESS',
                      data: {
                        longitude: location.lng,
                        latitude: location.lat,
                        accuracy: 0,
                        address: '定位成功，但无法获取详细地址'
                      }
                    }));
                  }
                }
              });
            });
          } else {
            console.error('Location failed:', result.message || 'Unknown error');
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOCATION_ERROR',
                data: {
                  message: result.message || '定位失败，请检查定位权限设置',
                  code: result.code || 0
                }
              }));
            }
          }
        });
      });
    };
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
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div id="mapContainer"></div>
      <div id="loading">正在加载地图...</div>

      <script>
        function showError(message) {
          const loadingDiv = document.getElementById('loading');
          if (loadingDiv) {
            loadingDiv.innerHTML = '地图加载失败: ' + message;
          }
        }
      </script>

      <script src="https://webapi.amap.com/maps?v=${apiVersion}&key=${apiKey}&plugin=AMap.Geolocation,AMap.Geocoder" onerror="showError('高德地图 SDK 加载失败，请检查网络连接')"></script>

      <script>
        ${getWebViewJavaScript()}
        ${getInitMapScript(apiKey, center, zoom)}

        // 监听React Native发送的消息
        window.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);

            switch (data.type) {
              case 'ADD_PETS':
                if (window.clearPetMarkers) {
                  window.clearPetMarkers();
                }
                if (data.pets && data.pets.length > 0) {
                  data.pets.forEach(function(pet) {
                    if (window.addPetMarker) {
                      window.addPetMarker(pet);
                    }
                  });
                }
                break;

              case 'CLEAR_PETS':
                if (window.clearPetMarkers) {
                  window.clearPetMarkers();
                }
                break;

              case 'GET_LOCATION':
                if (window.getUserLocation) {
                  window.getUserLocation();
                }
                break;

              case 'CENTER_MAP':
                if (window.map && data.longitude && data.latitude) {
                  window.map.setCenter([data.longitude, data.latitude]);
                }
                break;
            }
          } catch (err) {
            // Silently handle message parsing errors
          }
        });
      </script>
    </body>
    </html>
  `;
};
