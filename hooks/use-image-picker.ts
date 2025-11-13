import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export interface ImageAsset {
  uri: string;
  type?: string;
  name?: string;
}

export const useImagePicker = () => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('需要访问相册权限才能上传图片');
      return false;
    }
    return true;
  };

  const pickMultipleImages = async (maxCount: number = 9) => {
    try {
      setLoading(true);

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setLoading(false);
        return false;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxCount - images.length,
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));

        setImages(prev => {
          const newImages = [...prev, ...selectedImages];
          return newImages.slice(0, maxCount);
        });

        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error picking images:', error);
      setLoading(false);
      return false;
    }
  };

  const takePhoto = async () => {
    try {
      setLoading(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('需要访问相机权限才能拍照');
        setLoading(false);
        return false;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const newImage = {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        };

        setImages(prev => {
          const newImages = [...prev, newImage];
          return newImages.slice(0, 9);
        });

        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error taking photo:', error);
      setLoading(false);
      return false;
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    loading,
    pickMultipleImages,
    takePhoto,
    removeImage,
    clearImages,
  };
};
