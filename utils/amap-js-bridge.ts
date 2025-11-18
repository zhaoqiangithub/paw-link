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
  zoom: number = 15,
  mapStyle: string = 'amap://styles/normal'
): string => {
  return `
    window.AMapReady = false;
    window.PetMarkers = [];
    window.map = null;
    window.selectedLocationMarker = null;

    // 检查AMap对象是否可用
    function checkAMapAndInit() {
      if (typeof AMap !== 'undefined' && AMap.Map) {
        initAMap();
      } else {
        setTimeout(checkAMapAndInit, 100);
      }
    }

    function updateSelectedLocationMarker(lng, lat) {
      if (!window.map || typeof AMap === 'undefined') {
        return;
      }

      const markerIcon = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(
        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
          '<defs>' +
            '<linearGradient id="selectedGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
              '<stop offset="0%" stop-color="#4285F4" />' +
              '<stop offset="100%" stop-color="#2A68F3" />' +
            '</linearGradient>' +
            '<filter id="selectedShadow" x="-50%" y="-50%" width="200%" height="200%">' +
              '<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>' +
              '<feOffset dx="0" dy="2" result="offsetblur"/>' +
              '<feComponentTransfer>' +
                '<feFuncA type="linear" slope="0.3"/>' +
              '</feComponentTransfer>' +
              '<feMerge>' +
                '<feMergeNode/>' +
                '<feMergeNode in="SourceGraphic"/>' +
              '</feMerge>' +
            '</filter>' +
          '</defs>' +
          '<circle cx="20" cy="18" r="12" fill="url(#selectedGrad)" stroke="white" stroke-width="3" filter="url(#selectedShadow)" />' +
          '<circle cx="20" cy="18" r="5" fill="white" />' +
          '<circle cx="20" cy="18" r="2.8" fill="#2A68F3" />' +
          '<ellipse cx="20" cy="34" rx="6" ry="3" fill="#9DBDF8" opacity="0.5" />' +
        '</svg>'
      )));

      if (!window.selectedLocationMarker) {
        window.selectedLocationMarker = new AMap.Marker({
          position: [lng, lat],
          icon: new AMap.Icon({
            size: new AMap.Size(40, 40),
            image: markerIcon,
            imageSize: new AMap.Size(40, 40)
          }),
          offset: new AMap.Pixel(0, -20),
          anchor: 'bottom-center',
          zIndex: 140,
          animation: 'AMAP_ANIMATION_DROP'
        });
        window.map.add(window.selectedLocationMarker);
      } else {
        window.selectedLocationMarker.setPosition([lng, lat]);
        window.selectedLocationMarker.show();
      }
    }

    // 高德地图加载完成回调
    window.initAMap = function() {
      window.AMapReady = true;

      // 创建地图实例（增强配置）
      window.map = new AMap.Map('mapContainer', {
        zoom: ${zoom},
        center: [${center.longitude}, ${center.latitude}],
        viewMode: '2D',
        mapStyle: '${mapStyle}',
        showLabel: true,
        defaultCursor: 'pointer',
        resizeEnable: true,
        rotateEnable: true,
        pitchEnable: false,
        dragEnable: true,
        zoomEnable: true,
        doubleClickZoom: true,
        keyboardEnable: true,
        jogEnable: true,
        scrollWheel: true,
        touchZoom: true,
        touchZoomCenter: 1,
        showIndoorMap: false,
        features: ['bg', 'road', 'building', 'point'],
        minZoom: 3,
        maxZoom: 20
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
        updateSelectedLocationMarker(lnglat.lng, lnglat.lat);
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

    // 添加宠物标记（优化版）
    window.addPetMarker = function(pet) {
      if (!window.AMapReady || !window.map) {
        return;
      }

      const iconUrl = getPetIconUrl(pet.status);
      const marker = new AMap.Marker({
        position: [pet.longitude, pet.latitude],
        title: pet.title || '宠物信息',
        icon: new AMap.Icon({
          size: new AMap.Size(44, 44),
          image: iconUrl,
          imageSize: new AMap.Size(44, 44)
        }),
        anchor: 'bottom-center',  // 锚点设置为底部中心
        offset: new AMap.Pixel(0, 0),
        zIndex: 100,
        extData: pet  // 存储完整的宠物信息
      });

      // 标记点击事件
      marker.on('click', function() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MARKER_CLICK',
            data: {
              id: pet.id,
              title: pet.title,
              longitude: pet.longitude,
              latitude: pet.latitude,
              status: pet.status
            }
          }));
        }

        // 点击动画效果
        marker.setAnimation('AMAP_ANIMATION_BOUNCE');
      });

      // 鼠标悬停效果（Web端）
      marker.on('mouseover', function() {
        marker.setzIndex(200);  // 提升层级
      });

      marker.on('mouseout', function() {
        marker.setzIndex(100);  // 恢复层级
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

    // 获取宠物图标URL（优化版 - 精美SVG设计）
    function getPetIconUrl(status) {
      const colors = {
        'emergency': {
          primary: '#FF4444',
          secondary: '#FF6666',
          gradient: 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)'
        },
        'needs_rescue': {
          primary: '#FF9800',
          secondary: '#FFB74D',
          gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
        },
        'for_adoption': {
          primary: '#4CAF50',
          secondary: '#81C784',
          gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
        },
        'adopted': {
          primary: '#9E9E9E',
          secondary: '#BDBDBD',
          gradient: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)'
        }
      };

      const statusColor = colors[status] || colors['for_adoption'];
      const emojis = {
        'emergency': '🚨',
        'needs_rescue': '🆘',
        'for_adoption': '🐾',
        'adopted': '✅'
      };
      const emoji = emojis[status] || '🐾';

      // 创建精美的SVG标记（带阴影和渐变）
      const svg =
        '<svg width="44" height="44" xmlns="http://www.w3.org/2000/svg">' +
          '<defs>' +
            '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">' +
              '<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>' +
              '<feOffset dx="0" dy="2" result="offsetblur"/>' +
              '<feComponentTransfer>' +
                '<feFuncA type="linear" slope="0.3"/>' +
              '</feComponentTransfer>' +
              '<feMerge>' +
                '<feMergeNode/>' +
                '<feMergeNode in="SourceGraphic"/>' +
              '</feMerge>' +
            '</filter>' +
            '<radialGradient id="grad' + status + '" cx="50%" cy="50%" r="50%">' +
              '<stop offset="0%" style="stop-color:' + statusColor.secondary + ';stop-opacity:1" />' +
              '<stop offset="100%" style="stop-color:' + statusColor.primary + ';stop-opacity:1" />' +
            '</radialGradient>' +
          '</defs>' +
          // 外圈阴影
          '<circle cx="22" cy="22" r="20" fill="url(#grad' + status + ')" filter="url(#shadow)" />' +
          // 主体圆形
          '<circle cx="22" cy="22" r="18" fill="url(#grad' + status + ')" stroke="white" stroke-width="3"/>' +
          // 内圈光晕
          '<circle cx="22" cy="22" r="13" fill="white" opacity="0.2"/>' +
          // Emoji 文本（使用foreignObject嵌入）
          '<text x="22" y="26" text-anchor="middle" font-size="18" fill="white">' + emoji + '</text>' +
        '</svg>';

      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
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
                size: new AMap.Size(36, 36),
                image: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(
                  '<svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">' +
                    '<defs>' +
                      '<filter id="user-shadow" x="-50%" y="-50%" width="200%" height="200%">' +
                        '<feGaussianBlur in="SourceAlpha" stdDeviation="2"/>' +
                        '<feOffset dx="0" dy="2" result="offsetblur"/>' +
                        '<feComponentTransfer>' +
                          '<feFuncA type="linear" slope="0.4"/>' +
                        '</feComponentTransfer>' +
                        '<feMerge>' +
                          '<feMergeNode/>' +
                          '<feMergeNode in="SourceGraphic"/>' +
                        '</feMerge>' +
                      '</filter>' +
                      '<radialGradient id="userGrad" cx="50%" cy="50%" r="50%">' +
                        '<stop offset="0%" style="stop-color:#42A5F5;stop-opacity:1" />' +
                        '<stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />' +
                      '</radialGradient>' +
                      // 脉冲动画
                      '<circle id="pulse" cx="18" cy="18" r="15" fill="none" stroke="#2196F3" stroke-width="2" opacity="0.6">' +
                        '<animate attributeName="r" from="15" to="20" dur="1.5s" repeatCount="indefinite"/>' +
                        '<animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>' +
                      '</circle>' +
                    '</defs>' +
                    // 脉冲圈
                    '<use href="#pulse"/>' +
                    // 外圈阴影
                    '<circle cx="18" cy="18" r="16" fill="url(#userGrad)" filter="url(#user-shadow)" />' +
                    // 主体圆形
                    '<circle cx="18" cy="18" r="14" fill="url(#userGrad)" stroke="white" stroke-width="3"/>' +
                    // 内圈定位点
                    '<circle cx="18" cy="18" r="6" fill="white"/>' +
                    // 中心点
                    '<circle cx="18" cy="18" r="3" fill="#1976D2"/>' +
                  '</svg>'
                ))),
                imageSize: new AMap.Size(36, 36)
              }),
              anchor: 'center',
              zIndex: 150,  // 用户标记层级更高
              animation: 'AMAP_ANIMATION_DROP'  // 掉落动画
            });

            window.map.add(window.userLocationMarker);
            window.map.setCenter([location.lng, location.lat]);
            window.map.setZoom(16);

            updateSelectedLocationMarker(location.lng, location.lat);

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
    if (!window.ReactNativeWebView) {
      window.ReactNativeWebView = {
        postMessage: function(data) {
          window.postMessage(data, '*');
        }
      };
    }
  `;
};

/**
 * 高德地图 HTML 模板
 */
export const getAmapHtmlTemplate = (
  apiKey: string,
  center: { longitude: number; latitude: number },
  zoom: number = 15,
  apiVersion: string = '2.0',
  mapStyle: string = 'amap://styles/normal'
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <title>PawLink 地图</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        #mapContainer {
          position: absolute;
          width: 100%;
          height: 100%;
          /* 启用GPU加速 */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform;
        }
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 20px 30px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          text-align: center;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        #loading .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 12px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* 高德地图控件样式优化 */
        .amap-logo, .amap-copyright {
          opacity: 0.6;
        }
      </style>
    </head>
    <body>
      <div id="mapContainer"></div>
      <div id="loading">
        <div class="spinner"></div>
        <div>正在加载地图...</div>
      </div>

      <script>
        function showError(message) {
          const loadingDiv = document.getElementById('loading');
          if (loadingDiv) {
            loadingDiv.innerHTML = '<div style="font-size: 32px; margin-bottom: 10px;">⚠️</div><div>地图加载失败</div><div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">' + message + '</div>';
          }
        }
      </script>

      <script src="https://webapi.amap.com/maps?v=${apiVersion}&key=${apiKey}&plugin=AMap.Geolocation,AMap.Geocoder,AMap.AutoComplete,AMap.PlaceSearch" onerror="showError('高德地图 SDK 加载失败，请检查网络连接')"></script>

      <script>
        ${getWebViewJavaScript()}
        ${getInitMapScript(apiKey, center, zoom, mapStyle)}

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
                  if (data.zoom) {
                    window.map.setZoom(data.zoom);
                  }
                }
                break;

              case 'SET_MAP_STYLE':
                if (window.map && data.style) {
                  window.map.setMapStyle(data.style);
                }
                break;

              case 'REVERSE_GEOCODE':
                // 逆地理编码：坐标转地址
                if (window.map && data.longitude && data.latitude) {
                  updateSelectedLocationMarker(data.longitude, data.latitude);
                  AMap.plugin('AMap.Geocoder', function() {
                    const geocoder = new AMap.Geocoder({
                      batch: false,
                      radius: 1000
                    });

                    geocoder.getAddress([data.longitude, data.latitude], function(status, result) {
                      if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                        const addressComponent = result.geocodes[0].addressComponent;
                        const formattedAddress = result.geocodes[0].formattedAddress;

                        // 构造详细地址
                        let detailedAddress = '';
                        if (addressComponent.province) detailedAddress += addressComponent.province;
                        if (addressComponent.city && addressComponent.city !== addressComponent.province) {
                          detailedAddress += addressComponent.city;
                        }
                        if (addressComponent.district) detailedAddress += addressComponent.district;
                        if (addressComponent.township) detailedAddress += addressComponent.township;
                        if (addressComponent.street) detailedAddress += addressComponent.street;
                        if (addressComponent.streetNumber) detailedAddress += addressComponent.streetNumber;

                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'LOCATION_SUCCESS',
                            data: {
                              longitude: data.longitude,
                              latitude: data.latitude,
                              address: detailedAddress || formattedAddress || '未知地址',
                              accuracy: 50  // 点击选点精度估算为50米
                            }
                          }));
                        }
                      } else {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'LOCATION_SUCCESS',
                            data: {
                              longitude: data.longitude,
                              latitude: data.latitude,
                              address: '无法获取详细地址',
                              accuracy: 50
                            }
                          }));
                        }
                      }
                    });
                  });
                }
                break;

              case 'SET_SELECTED_LOCATION':
                if (window.map && data.longitude && data.latitude) {
                  updateSelectedLocationMarker(data.longitude, data.latitude);
                  if (data.zoom) {
                    window.map.setZoom(data.zoom);
                  }
                  const shouldCenter = !!data.shouldCenter;
                  if (shouldCenter) {
                    window.map.setCenter([data.longitude, data.latitude]);
                  }
                }
                break;

              case 'ADDRESS_SEARCH':
                // 地址搜索功能
                if (data.keyword && window.map) {
                  AMap.plugin('AMap.AutoComplete', function() {
                    const autoComplete = new AMap.AutoComplete({
                      city: '全国',
                      type: 'all',
                      datatype: 'all',
                      pageSize: 10,
                      pageIndex: 1,
                      citylimit: false,
                    });

                    autoComplete.search(data.keyword, function(status, result) {
                      if (status === 'complete' && result.tips) {
                        const searchResults = result.tips
                          .filter(tip => tip.location && tip.location.lng && tip.location.lat)
                          .map((tip, index) => ({
                            id: tip.id || index.toString(),
                            name: tip.name || '未知名称',
                            address: tip.address || tip.district || '',
                            location: {
                              longitude: tip.location.lng,
                              latitude: tip.location.lat,
                            },
                            distance: tip.distance,
                          }));

                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'ADDRESS_SEARCH_RESULT',
                            data: {
                              results: searchResults,
                            }
                          }));
                        }
                      } else {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'ADDRESS_SEARCH_RESULT',
                            data: {
                              results: [],
                              error: '搜索失败，请检查网络连接'
                            }
                          }));
                        }
                      }
                    });
                  });
                }
                break;

              case 'POI_SEARCH':
                // POI 搜索功能
                if (data.keyword && window.map) {
                  AMap.plugin('AMap.PlaceSearch', function() {
                    const placeSearch = new AMap.PlaceSearch({
                      pageSize: 20,
                      pageIndex: 1,
                      extensions: 'base',
                      city: '全国',
                      citylimit: false,
                      type: '全部',
                    });

                    placeSearch.searchNearBy(data.keyword, [data.longitude || 116.407526, data.latitude || 39.90403], 5000, function(status, result) {
                      if (status === 'complete' && result.poiList && result.poiList.pois) {
                        const poiResults = result.poiList.pois.map((poi, index) => ({
                          id: poi.id || index.toString(),
                          name: poi.name || '未知名称',
                          address: poi.address || '',
                          location: {
                            longitude: poi.location.lng,
                            latitude: poi.location.lat,
                          },
                          distance: poi.distance,
                          type: poi.type,
                          tel: poi.tel,
                        }));

                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'POI_SEARCH_RESULT',
                            data: {
                              results: poiResults,
                            }
                          }));
                        }
                      } else {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'POI_SEARCH_RESULT',
                            data: {
                              results: [],
                              error: '搜索失败，请检查网络连接'
                            }
                          }));
                        }
                      }
                    });
                  });
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
