import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCapacitor } from './useCapacitor';
import { toast } from 'sonner';

// iOS Product IDs - must match App Store Connect
export const IOS_PRODUCTS = {
  // Subscriptions
  PRO_MONTHLY: 'com.luna.pro.monthly',
  PRO_YEARLY: 'com.luna.pro.yearly',
  COUPLES_MONTHLY: 'com.luna.couples.monthly',
  COUPLES_YEARLY: 'com.luna.couples.yearly',
  // Minutes packages
  MINUTES_15: 'com.luna.minutes.15',
  MINUTES_30: 'com.luna.minutes.30',
  MINUTES_60: 'com.luna.minutes.60',
  MINUTES_120: 'com.luna.minutes.120',
  // Coin packages  
  COINS_100: 'com.luna.coins.100',
  COINS_500: 'com.luna.coins.500',
  COINS_1000: 'com.luna.coins.1000',
  COINS_2500: 'com.luna.coins.2500',
} as const;

export type IOSProductId = typeof IOS_PRODUCTS[keyof typeof IOS_PRODUCTS];

interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  productType?: string;
  amount?: number;
  error?: string;
}

interface IOSProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceRaw: number;
  currency: string;
}

export function useIOSPurchase() {
  const { user, session } = useAuth();
  const { isIOS, isNative } = useCapacitor();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [products, setProducts] = useState<IOSProduct[]>([]);

  // Check if iOS IAP is available
  const isAvailable = isIOS && isNative;

  // Load available products from App Store
  const loadProducts = useCallback(async (productIds: IOSProductId[]) => {
    if (!isAvailable) {
      console.log('iOS IAP not available');
      return [];
    }

    setIsLoadingProducts(true);
    try {
      // This would use @capacitor-community/in-app-purchases or similar
      // For now, we'll simulate the product loading
      console.log('Loading iOS products:', productIds);
      
      // In a real implementation, you would use:
      // const { InAppPurchase2 } = await import('@capacitor-community/in-app-purchases');
      // await InAppPurchase2.getProducts(productIds);
      
      // Placeholder - actual implementation depends on your IAP plugin
      const loadedProducts: IOSProduct[] = productIds.map(id => ({
        id,
        title: getProductTitle(id),
        description: getProductDescription(id),
        price: getProductPrice(id),
        priceRaw: getProductPriceRaw(id),
        currency: 'USD',
      }));

      setProducts(loadedProducts);
      return loadedProducts;
    } catch (error) {
      console.error('Error loading iOS products:', error);
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isAvailable]);

  // Initiate a purchase
  const purchase = useCallback(async (productId: IOSProductId): Promise<PurchaseResult> => {
    if (!isAvailable) {
      return { success: false, error: 'iOS IAP not available' };
    }

    if (!user || !session) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsPurchasing(true);
    try {
      console.log('Initiating iOS purchase for:', productId);

      // This would use your IAP plugin to initiate the purchase
      // const { InAppPurchase2 } = await import('@capacitor-community/in-app-purchases');
      // const purchase = await InAppPurchase2.purchase(productId);
      
      // For now, simulate getting a receipt
      // In production, you'd get the receipt from the IAP plugin
      const mockReceiptData = ''; // This comes from StoreKit
      
      // Verify the purchase with our backend
      const { data, error } = await supabase.functions.invoke('verify-ios-purchase', {
        body: {
          receiptData: mockReceiptData,
          productId,
        },
      });

      if (error) {
        console.error('Purchase verification error:', error);
        toast.error('Purchase verification failed');
        return { success: false, error: error.message };
      }

      if (data.success) {
        toast.success('Purchase successful!');
        return {
          success: true,
          productId: data.productId,
          transactionId: data.transactionId,
          productType: data.productType,
          amount: data.amount,
        };
      } else {
        toast.error(data.error || 'Purchase failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('iOS purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Purchase failed: ' + errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPurchasing(false);
    }
  }, [isAvailable, user, session]);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<PurchaseResult[]> => {
    if (!isAvailable) {
      toast.error('iOS IAP not available');
      return [];
    }

    if (!user || !session) {
      toast.error('Please sign in to restore purchases');
      return [];
    }

    setIsPurchasing(true);
    try {
      console.log('Restoring iOS purchases');
      
      // This would use your IAP plugin to restore purchases
      // const { InAppPurchase2 } = await import('@capacitor-community/in-app-purchases');
      // const restoredPurchases = await InAppPurchase2.restorePurchases();
      
      toast.success('Purchases restored successfully');
      return [];
    } catch (error) {
      console.error('Restore purchases error:', error);
      toast.error('Failed to restore purchases');
      return [];
    } finally {
      setIsPurchasing(false);
    }
  }, [isAvailable, user, session]);

  return {
    isAvailable,
    isPurchasing,
    isLoadingProducts,
    products,
    loadProducts,
    purchase,
    restorePurchases,
  };
}

// Helper functions for product metadata (in production, this comes from App Store)
function getProductTitle(productId: IOSProductId): string {
  const titles: Record<string, string> = {
    'com.luna.pro.monthly': 'Luna Pro (Monthly)',
    'com.luna.pro.yearly': 'Luna Pro (Yearly)',
    'com.luna.couples.monthly': 'Luna Couples (Monthly)',
    'com.luna.couples.yearly': 'Luna Couples (Yearly)',
    'com.luna.minutes.15': '15 Minutes',
    'com.luna.minutes.30': '30 Minutes',
    'com.luna.minutes.60': '60 Minutes',
    'com.luna.minutes.120': '120 Minutes',
    'com.luna.coins.100': '100 Coins',
    'com.luna.coins.500': '500 Coins',
    'com.luna.coins.1000': '1000 Coins',
    'com.luna.coins.2500': '2500 Coins',
  };
  return titles[productId] || productId;
}

function getProductDescription(productId: IOSProductId): string {
  const descriptions: Record<string, string> = {
    'com.luna.pro.monthly': 'Unlimited access to all Luna features',
    'com.luna.pro.yearly': 'Save 50% with yearly subscription',
    'com.luna.couples.monthly': 'Full couples features access',
    'com.luna.couples.yearly': 'Save 50% with yearly subscription',
    'com.luna.minutes.15': '15 minutes for voice sessions',
    'com.luna.minutes.30': '30 minutes for voice sessions',
    'com.luna.minutes.60': '60 minutes for voice sessions',
    'com.luna.minutes.120': '120 minutes for voice sessions',
    'com.luna.coins.100': '100 coins for gifts and features',
    'com.luna.coins.500': '500 coins + 50 bonus',
    'com.luna.coins.1000': '1000 coins + 150 bonus',
    'com.luna.coins.2500': '2500 coins + 500 bonus',
  };
  return descriptions[productId] || '';
}

function getProductPrice(productId: IOSProductId): string {
  const prices: Record<string, string> = {
    'com.luna.pro.monthly': '$9.99',
    'com.luna.pro.yearly': '$59.99',
    'com.luna.couples.monthly': '$14.99',
    'com.luna.couples.yearly': '$89.99',
    'com.luna.minutes.15': '$4.99',
    'com.luna.minutes.30': '$8.99',
    'com.luna.minutes.60': '$14.99',
    'com.luna.minutes.120': '$24.99',
    'com.luna.coins.100': '$0.99',
    'com.luna.coins.500': '$3.99',
    'com.luna.coins.1000': '$6.99',
    'com.luna.coins.2500': '$14.99',
  };
  return prices[productId] || '$0.00';
}

function getProductPriceRaw(productId: IOSProductId): number {
  const prices: Record<string, number> = {
    'com.luna.pro.monthly': 9.99,
    'com.luna.pro.yearly': 59.99,
    'com.luna.couples.monthly': 14.99,
    'com.luna.couples.yearly': 89.99,
    'com.luna.minutes.15': 4.99,
    'com.luna.minutes.30': 8.99,
    'com.luna.minutes.60': 14.99,
    'com.luna.minutes.120': 24.99,
    'com.luna.coins.100': 0.99,
    'com.luna.coins.500': 3.99,
    'com.luna.coins.1000': 6.99,
    'com.luna.coins.2500': 14.99,
  };
  return prices[productId] || 0;
}
