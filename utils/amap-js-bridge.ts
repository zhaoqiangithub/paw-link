import { MAP_STYLES, MapStyleType } from '@/constants/amap-config';

/**
 * 高德地图JavaScript API HTML模板生成器
 * 用于在WebView中加载高德地图
 */

interface MapConfig {
  longitude: number;
  latitude: number;
  zoom: number;
  style: string;
}

/**
 * 生成高德地图HTML模板
 */
export function getAmapHtmlTemplate(
  apiKey: string,
  center?: { longitude: number; latitude: number },
  zoom: number = 15,
  version: string = '2.0',
  style: string = MAP_STYLES.normal
): string {
  const { longitude, latitude } = center || {
    longitude: 116.407526,
    latitude: 39.90403,
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="format-detection" content="telephone=no" />
  <title>高德地图</title>
  <style>
    html, body, #container {
      height: 100%;
      margin: 0;
      padding: 0;
      width: 100%;
      overflow: hidden;
    }
    * {
      -webkit-tap-highlight-color: transparent;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      color: #999;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div class="loading" id="loading">地图加载中...</div>

  <!-- 高德地图JavaScript API -->
  <script src="https://webapi.amap.com/maps?v=${version}&key=${apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.Driving,AMap.ToolBar,AMap.Scale,AMap.MapType"></script>
  <script>
    console.log('🗺️ 高德地图WebView开始初始化...');
    console.log('中心点:', ${longitude}, ${latitude});
    console.log('缩放级别:', ${zoom});
    console.log('API Key:', '${apiKey.substring(0, 8)}...');

    // 全局变量
    let map;
    let markers = [];
    let isMapReady = false;

    // 初始化地图
    function initMap() {
      try {
        map = new AMap.Map('container', {
          zoom: ${zoom},
          center: [${longitude}, ${latitude}],
          mapStyle: '${style}',
          viewMode: '2D',
          showBuildingBlock: true,
          showLabel: true,
          zoomEnable: true,
          dragEnable: true,
          jogEnable: true,
          animateEnable: true,
          resizeEnable: true,
          keyboardEnable: true,
          doubleClickZoom: true,
          scrollWheel: true,
          rotateEnable: false,
          pitchEnable: false
        });

        // 添加控件
        map.addControl(new AMap.Scale({
          position: 'LB',
          ruler: 'metric'
        }));
        map.addControl(new AMap.ToolBar({
          position: 'RT',
          rulerBar: true,
          noIpLocate: true,
          liteStyle: false
        }));

        // 监听地图加载完成
        map.on('complete', function() {
          console.log('✅ 高德地图加载完成');
          isMapReady = true;
          document.getElementById('loading').style.display = 'none';

          // 通知React Native地图已加载
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'MAP_LOADED',
              data: {
                center: map.getCenter(),
                zoom: map.getZoom()
              }
            })
          );
        });

        // 监听地图错误
        map.on('error', function(e) {
          console.error('❌ 地图错误:', e);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'MAP_ERROR',
              data: { message: e.message || '地图加载失败' }
            })
          );
        });

        // 监听地图点击事件
        map.on('click', function(e) {
          console.log('🗺️ 地图被点击:', e.lnglat.lng, e.lnglat.lat);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'MAP_CLICK',
              data: {
                longitude: e.lnglat.lng,
                latitude: e.lnglat.lat
              }
            })
          );
        });

        // 监听定位事件
        map.on('locationerror', function(e) {
          console.error('❌ 定位错误:', e);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'LOCATION_ERROR',
              data: {
                code: e.code,
                message: e.message || '定位失败'
              }
            })
          );
        });

        map.on('locationcomplete', function(e) {
          console.log('✅ 定位成功:', e.position);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'LOCATION_SUCCESS',
              data: {
                longitude: e.position.lng,
                latitude: e.position.lat,
                accuracy: e.accuracy,
                address: e.formattedAddress
              }
            })
          );
        });

        console.log('✅ 地图初始化完成');
      } catch (error) {
        console.error('❌ 地图初始化失败:', error);
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'MAP_ERROR',
            data: { message: error.message || '地图初始化失败' }
          })
        );
      }
    }

    // 渲染宠物标记
    function renderPetMarkers(petsData) {
      console.log('📍 开始渲染宠物标记:', petsData.length, '个');

      // 清除旧标记
      clearMarkers();

      // 创建新标记
      petsData.forEach(function(pet, index) {
        try {
          // 根据状态设置标记颜色
          let markerColor = '#999999';
          if (pet.status === 'emergency') {
            markerColor = '#f44336'; // 红色 - 紧急
          } else if (pet.status === 'needs_rescue') {
            markerColor = '#ff9800'; // 橙色 - 需要救助
          } else if (pet.status === 'for_adoption') {
            markerColor = '#4CAF50'; // 绿色 - 待领养
          }

          // 创建标记
          var marker = new AMap.Marker({
            position: [pet.longitude, pet.latitude],
            title: pet.title,
            content: '<div style="width: 12px; height: 12px; border-radius: 50%; background-color: ' + markerColor + '; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            extData: {
              id: pet.id,
              status: pet.status
            },
            zIndex: pet.status === 'emergency' ? 1000 : 500
          });

          // 创建信息窗口
          var infoWindow = new AMap.InfoWindow({
            content: '<div style="padding: 8px;"><h4 style="margin: 0 0 4px 0; font-size: 14px;">' +
                     pet.title + '</h4><p style="margin: 0; font-size: 12px; color: #666;">' +
                     (pet.description || '') + '</p></div>',
            offset: new AMap.Pixel(0, -20)
          });

          // 标记点击事件
          marker.on('click', function() {
            console.log('📍 标记被点击:', pet.id);
            infoWindow.open(map, marker.getPosition());

            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'MARKER_CLICK',
                data: { id: pet.id }
              })
            );
          });

          map.add(marker);
          markers.push(marker);
        } catch (error) {
          console.error('创建标记失败:', error, pet);
        }
      });

      // 如果有标记，调整视图
      if (markers.length > 0) {
        var markerList = markers.map(m => m.getPosition());
        map.setFitView(markerList, false, [50, 50, 50, 50]);
      }

      console.log('✅ 标记渲染完成:', markers.length, '个');
    }

    // 清除所有标记
    function clearMarkers() {
      console.log('🗑️ 清除标记');
      markers.forEach(function(marker) {
        map.remove(marker);
      });
      markers = [];
    }

    // 搜索地址
    function searchAddress(keyword) {
      console.log('🔍 搜索地址:', keyword);
      if (!keyword || keyword.trim() === '') {
        return;
      }

      var geocoder = new AMap.Geocoder({
        city: '全国',
        batch: false
      });

      geocoder.getLocation(keyword, function(status, result) {
        if (status === 'complete') {
          if (result.geocodes && result.geocodes.length > 0) {
            var location = result.geocodes[0].location;
            console.log('✅ 地址搜索成功:', result.geocodes[0]);

            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'ADDRESS_SEARCH_RESULT',
                data: {
                  results: [{
                    id: result.geocodes[0].adcode,
                    name: result.geocodes[0].formattedAddress,
                    address: result.geocodes[0].formattedAddress,
                    location: {
                      longitude: location.lng,
                      latitude: location.lat
                    }
                  }]
                }
              })
            );
          } else {
            console.warn('⚠️ 未找到地址结果');
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'ADDRESS_SEARCH_RESULT',
                data: { results: [] }
              })
            );
          }
        } else {
          console.error('❌ 地址搜索失败:', result);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'ADDRESS_SEARCH_RESULT',
              data: { results: [] }
            })
          );
        }
      });
    }

    // POI搜索
    function searchPOI(keyword, longitude, latitude) {
      console.log('🔍 POI搜索:', keyword, longitude, latitude);
      if (!keyword || keyword.trim() === '') {
        return;
      }

      var placeSearch = new AMap.PlaceSearch({
        pageSize: 20,
        pageIndex: 1,
        city: '全国',
        citylimit: false,
        type: ''
      });

      var searchParams = {
        query: keyword
      };

      if (longitude && latitude) {
        searchParams.city = '全国';
      }

      placeSearch.search(keyword, function(status, result) {
        if (status === 'complete') {
          if (result.poiList && result.poiList.pois) {
            var pois = result.poiList.pois.map(function(poi) {
              return {
                id: poi.id,
                name: poi.name,
                address: poi.address,
                location: {
                  longitude: poi.location.lng,
                  latitude: poi.location.lat
                },
                type: poi.type,
                distance: poi.distance
              };
            });

            console.log('✅ POI搜索成功:', pois.length, '个结果');

            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'POI_SEARCH_RESULT',
                data: { results: pois }
              })
            );
          } else {
            console.warn('⚠️ 未找到POI结果');
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'POI_SEARCH_RESULT',
                data: { results: [] }
              })
            );
          }
        } else {
          console.error('❌ POI搜索失败:', result);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'POI_SEARCH_RESULT',
              data: { results: [] }
            })
          );
        }
      });
    }

    // 获取用户位置
    function getUserLocation() {
      console.log('📍 获取用户位置');
      if (!map) {
        console.error('❌ 地图未初始化');
        return;
      }

      map.getCurrentPosition(function(status, result) {
        if (status === 'complete') {
          console.log('✅ 获取位置成功:', result);
        } else {
          console.error('❌ 获取位置失败:', result);
        }
      });
    }

    // 设置地图中心
    function setMapCenter(longitude, latitude, zoom) {
      console.log('🎯 设置地图中心:', longitude, latitude, zoom);
      if (!map) {
        console.error('❌ 地图未初始化');
        return;
      }

      map.setCenter([longitude, latitude]);
      if (zoom) {
        map.setZoom(zoom);
      }
    }

    // 设置地图样式
    function setMapStyle(style) {
      console.log('🎨 设置地图样式:', style);
      if (!map) {
        console.error('❌ 地图未初始化');
        return;
      }

      map.setMapStyle(style);
    }

    // 监听来自React Native的消息
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        console.log('📨 收到消息:', data.type, data);

        switch (data.type) {
          case 'ADD_PETS':
            renderPetMarkers(data.pets || []);
            break;

          case 'CLEAR_PETS':
            clearMarkers();
            break;

          case 'CENTER_MAP':
            setMapCenter(data.longitude, data.latitude, data.zoom);
            break;

          case 'SET_MAP_STYLE':
            setMapStyle(data.style);
            break;

          case 'GET_LOCATION':
            getUserLocation();
            break;

          case 'ADDRESS_SEARCH':
            searchAddress(data.keyword);
            break;

          case 'POI_SEARCH':
            searchPOI(data.keyword, data.longitude, data.latitude);
            break;
        }
      } catch (error) {
        console.error('❌ 处理消息失败:', error);
      }
    });

    // 页面加载完成后初始化地图
    if (document.readyState === 'complete') {
      initMap();
    } else {
      window.onload = initMap;
    }

    console.log('✅ 高德地图WebView脚本加载完成');
  </script>
</body>
</html>
`;
}

/**
 * 创建标记HTML
 */
export function createMarkerHtml(pet: any): string {
  let markerColor = '#999999';
  if (pet.status === 'emergency') {
    markerColor = '#f44336';
  } else if (pet.status === 'needs_rescue') {
    markerColor = '#ff9800';
  } else if (pet.status === 'for_adoption') {
    markerColor = '#4CAF50';
  }

  return `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${markerColor};
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    ">
      ${pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐾'}
    </div>
  `;
}

/**
 * 创建信息窗口HTML
 */
export function createInfoWindowHtml(pet: any): string {
  const statusText = {
    emergency: '紧急',
    needs_rescue: '需救助',
    for_adoption: '待领养',
    adopted: '已领养'
  }[pet.status] || '未知';

  const statusColor = {
    emergency: '#f44336',
    needs_rescue: '#ff9800',
    for_adoption: '#4CAF50',
    adopted: '#9E9E9E'
  }[pet.status] || '#999';

  return `
    <div style="
      padding: 12px;
      max-width: 250px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      ">
        <span style="font-size: 18px;">
          ${pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐾'}
        </span>
        <h3 style="
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        ">
          ${pet.title}
        </h3>
      </div>

      <div style="
        display: inline-block;
        padding: 4px 8px;
        background-color: ${statusColor}20;
        color: ${statusColor};
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 8px;
      ">
        ${statusText}
      </div>

      ${pet.description ? `
        <p style="
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        ">
          ${pet.description}
        </p>
      ` : ''}

      <div style="
        font-size: 12px;
        color: #999;
      ">
        点击查看详情
      </div>
    </div>
  `;
}
