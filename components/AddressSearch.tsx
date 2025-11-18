import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: {
    longitude: number;
    latitude: number;
  };
  distance?: number;
}

interface AddressSearchProps {
  webViewRef: React.RefObject<WebView>;
  onLocationSelect: (location: {
    longitude: number;
    latitude: number;
    address: string;
  }) => void;
  placeholder?: string;
  style?: any;
  searchResults?: SearchResult[];
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  webViewRef,
  onLocationSelect,
  placeholder = '搜索地址或地点',
  style,
  searchResults,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 搜索地址
  const searchAddress = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // 发送搜索请求到 WebView
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'ADDRESS_SEARCH',
        keyword: searchQuery,
      }));
    }
  }, [webViewRef]);

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchAddress(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchAddress]);

  useEffect(() => {
    if (typeof searchResults !== 'undefined') {
      setIsSearching(false);
      setResults(searchResults);
      if (query.trim().length > 0) {
        setShowResults(true);
      } else if (searchResults.length === 0) {
        setShowResults(false);
      }
    }
  }, [searchResults, query]);

  // 选择搜索结果
  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.name);
    setShowResults(false);
    Keyboard.dismiss();

    onLocationSelect({
      longitude: result.location.longitude,
      latitude: result.location.latitude,
      address: `${result.name} - ${result.address}`,
    });
  };

  // 清除搜索
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#8A94A6" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#C4CBD9"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={18} color="#C4CBD9" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3A7AFE" />
              <Text style={styles.loadingText}>搜索中...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(item)}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name="location-outline" size={18} color="#3A7AFE" />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </View>
                  {item.distance && (
                    <Text style={styles.resultDistance}>
                      {(item.distance / 1000).toFixed(1)}km
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            />
          ) : query.length > 0 && !isSearching ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>未找到相关地址</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2A44',
    padding: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#3A7AFE',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 13,
    color: '#8A94A6',
    lineHeight: 18,
  },
  resultDistance: {
    fontSize: 12,
    color: '#3A7AFE',
    fontWeight: '600',
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#C4CBD9',
  },
});

export default AddressSearch;
