import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const CATEGORIES = [
  { key: 'all', label: '全部', icon: 'grid-outline' },
  { key: 'coupon', label: '优惠券', icon: 'ticket-outline' },
  { key: 'voucher', label: '代金券', icon: 'card-outline' },
  { key: 'merchandise', label: '实物商品', icon: 'bag-outline' },
  { key: 'service', label: '服务', icon: 'construct-outline' },
  { key: 'experience', label: '体验券', icon: 'star-outline' },
];

const PRODUCTS = [
  {
    id: 1,
    title: '宠物医院体检券',
    desc: '合作宠物医院免费体检一次',
    category: 'coupon',
    points: 500,
    stock: 128,
    image: 'https://via.placeholder.com/200x200/FFE8E8/FF6B6B?text=体检券',
    originalPrice: 200,
    tags: ['热门', '医疗'],
  },
  {
    id: 2,
    title: '宠物食品大礼包',
    desc: '优质猫粮/狗粮试用装组合',
    category: 'merchandise',
    points: 800,
    stock: 56,
    image: 'https://via.placeholder.com/200x200/E8F8EE/2ECC71?text=食品礼包',
    originalPrice: 150,
    tags: ['新品'],
  },
  {
    id: 3,
    title: '宠物美容体验券',
    desc: '专业美容服务一次（小型犬/猫）',
    category: 'service',
    points: 300,
    stock: 89,
    image: 'https://via.placeholder.com/200x200/E7E4FF/7B3FE4?text=美容券',
    originalPrice: 120,
    tags: ['推荐'],
  },
  {
    id: 4,
    title: '救助站志愿者T恤',
    desc: '限量版志愿者纪念T恤',
    category: 'merchandise',
    points: 1200,
    stock: 23,
    image: 'https://via.placeholder.com/200x200/FFF4E6/FF9F43?text=T恤',
    originalPrice: 80,
    tags: ['限量'],
  },
  {
    id: 5,
    title: '宠物寄养代金券',
    desc: '24小时寄养服务抵扣券',
    category: 'voucher',
    points: 600,
    stock: 45,
    image: 'https://via.placeholder.com/200x200/E7E4FF/3A7AFE?text=寄养券',
    originalPrice: 180,
    tags: ['实用'],
  },
  {
    id: 6,
    title: '流浪动物救助培训课',
    desc: '专业救助技能在线课程',
    category: 'experience',
    points: 2000,
    stock: 15,
    image: 'https://via.placeholder.com/200x200/FFE8F5/FF4D8D?text=培训课',
    originalPrice: 300,
    tags: ['专业'],
  },
];

export default function PointsMallScreen() {
  const { user } = useApp();
  const [userPoints, setUserPoints] = useState(3560);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredProducts(PRODUCTS);
    } else {
      setFilteredProducts(PRODUCTS.filter(p => p.category === activeCategory));
    }
  }, [activeCategory]);

  const handleRedeem = (product: any) => {
    if (userPoints < product.points) {
      Alert.alert('积分不足', '您的积分不足以兑换此商品');
      return;
    }

    Alert.alert(
      '确认兑换',
      `兑换 ${product.title}\n需要 ${product.points} 积分`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: () => {
            setUserPoints(prev => prev - product.points);
            Alert.alert('兑换成功', '商品已发放到您的账户', [
              { text: '查看订单', onPress: () => router.push('/my-orders') }
            ]);
          }
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.orangeAmber} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>积分商城</Text>
          <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/points-history')}>
            <Ionicons name="time-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>我的积分</Text>
            <Text style={styles.pointsValue}>{userPoints}</Text>
          </View>
          <TouchableOpacity style={styles.pointsAction}>
            <Text style={styles.pointsActionText}>兑换记录</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.earningTips}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.tipsText}>每日签到 +10积分 · 参与救助 +50积分</Text>
        </View>
      </LinearGradient>

      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryItem, activeCategory === cat.key && styles.categoryItemActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={18}
                color={activeCategory === cat.key ? '#fff' : '#4B5675'}
              />
              <Text style={[styles.categoryText, activeCategory === cat.key && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              userPoints={userPoints}
              onRedeem={handleRedeem}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function ProductCard({ product, userPoints, onRedeem }: { product: any; userPoints: number; onRedeem: (p: any) => void }) {
  const canRedeem = userPoints >= product.points;

  return (
    <View style={styles.productCard}>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.tagsRow}>
        {product.tags.map((tag: string, index: number) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.productDesc} numberOfLines={2}>
        {product.desc}
      </Text>
      <View style={styles.productFooter}>
        <View style={styles.priceInfo}>
          <View style={styles.pointsContainer}>
            <Ionicons name="gift-outline" size={16} color="#FF9F43" />
            <Text style={styles.points}>{product.points}</Text>
          </View>
          <Text style={styles.originalPrice}>¥{product.originalPrice}</Text>
        </View>
        <Text style={styles.stock}>库存 {product.stock}</Text>
      </View>
      <TouchableOpacity
        style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
        onPress={() => onRedeem(product)}
        disabled={!canRedeem}
      >
        <Text style={styles.redeemButtonText}>{canRedeem ? '立即兑换' : '积分不足'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  pointsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsActionText: {
    color: '#fff',
    fontSize: 13,
  },
  earningTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  tipsText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  categoriesSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FB',
  },
  categoryItemActive: {
    backgroundColor: '#FF9F43',
  },
  categoryText: {
    fontSize: 13,
    color: '#4B5675',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F7FB',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  tag: {
    backgroundColor: '#FFE0E0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2A44',
    marginHorizontal: 8,
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 11,
    color: '#4B5675',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  productFooter: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9F43',
  },
  originalPrice: {
    fontSize: 12,
    color: '#8A94A6',
    textDecorationLine: 'line-through',
  },
  stock: {
    fontSize: 11,
    color: '#8A94A6',
  },
  redeemButton: {
    backgroundColor: '#FF9F43',
    margin: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#CBD2E3',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
