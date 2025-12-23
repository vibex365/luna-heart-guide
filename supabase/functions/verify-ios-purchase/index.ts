import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apple verification endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Product ID mappings to product types
const PRODUCT_TYPE_MAP: Record<string, { type: string; amount?: number }> = {
  // Subscriptions
  'com.luna.pro.monthly': { type: 'subscription' },
  'com.luna.pro.yearly': { type: 'subscription' },
  'com.luna.couples.monthly': { type: 'subscription' },
  'com.luna.couples.yearly': { type: 'subscription' },
  // Minutes packages
  'com.luna.minutes.15': { type: 'minutes', amount: 15 },
  'com.luna.minutes.30': { type: 'minutes', amount: 30 },
  'com.luna.minutes.60': { type: 'minutes', amount: 60 },
  'com.luna.minutes.120': { type: 'minutes', amount: 120 },
  // Coin packages
  'com.luna.coins.100': { type: 'coins', amount: 100 },
  'com.luna.coins.500': { type: 'coins', amount: 500 },
  'com.luna.coins.1000': { type: 'coins', amount: 1000 },
  'com.luna.coins.2500': { type: 'coins', amount: 2500 },
};

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      is_trial_period?: string;
      quantity: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    is_trial_period?: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
  }>;
}

async function verifyWithApple(receiptData: string, useSandbox: boolean): Promise<AppleReceiptResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { receiptData, productId, transactionId } = await req.json();

    if (!receiptData) {
      return new Response(
        JSON.stringify({ error: 'Receipt data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying iOS purchase for user ${user.id}, product: ${productId}`);

    // First try production
    let appleResponse = await verifyWithApple(receiptData, false);
    
    // Status 21007 means it's a sandbox receipt, retry with sandbox
    if (appleResponse.status === 21007) {
      console.log('Receipt is sandbox, retrying with sandbox environment');
      appleResponse = await verifyWithApple(receiptData, true);
    }

    // Check Apple response status
    // Status codes: 0 = valid, 21000-21010 = various errors
    if (appleResponse.status !== 0) {
      console.error('Apple verification failed with status:', appleResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Receipt verification failed',
          appleStatus: appleResponse.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the latest transaction info
    const latestReceipt = appleResponse.latest_receipt_info?.[0] || 
                          appleResponse.receipt?.in_app?.[appleResponse.receipt.in_app.length - 1];
    
    if (!latestReceipt) {
      return new Response(
        JSON.stringify({ error: 'No transaction found in receipt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifiedProductId = latestReceipt.product_id;
    const verifiedTransactionId = latestReceipt.transaction_id;
    const originalTransactionId = latestReceipt.original_transaction_id;
    const purchaseDate = new Date(parseInt(latestReceipt.purchase_date_ms));
    const expirationDate = latestReceipt.expires_date_ms 
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null;
    const isTrial = latestReceipt.is_trial_period === 'true';
    // Check if we used sandbox endpoint (we would have retried there if status was 21007)
    const isSandbox = appleResponse.receipt?.bundle_id?.includes('sandbox') ?? false;

    // Check for duplicate transaction
    const { data: existingReceipt } = await supabase
      .from('iap_receipts')
      .select('id')
      .eq('platform', 'apple')
      .eq('transaction_id', verifiedTransactionId)
      .single();

    if (existingReceipt) {
      console.log('Transaction already processed:', verifiedTransactionId);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Transaction already processed',
          transactionId: verifiedTransactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product type from mapping
    const productInfo = PRODUCT_TYPE_MAP[verifiedProductId] || { type: 'unknown' };

    // Store the receipt
    const { error: insertError } = await supabase
      .from('iap_receipts')
      .insert({
        user_id: user.id,
        platform: 'apple',
        product_id: verifiedProductId,
        product_type: productInfo.type === 'unknown' ? 'subscription' : productInfo.type,
        transaction_id: verifiedTransactionId,
        original_transaction_id: originalTransactionId,
        receipt_data: receiptData.substring(0, 1000), // Store truncated for reference
        purchase_date: purchaseDate.toISOString(),
        expiration_date: expirationDate?.toISOString() || null,
        is_trial: isTrial,
        is_sandbox: isSandbox,
        status: 'active',
        verification_response: appleResponse,
      });

    if (insertError) {
      console.error('Error storing receipt:', insertError);
      throw insertError;
    }

    // Grant the purchased item based on product type
    if (productInfo.type === 'minutes' && productInfo.amount) {
      // Add minutes to user wallet
      const { data: userMinutes } = await supabase
        .from('user_minutes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userMinutes) {
        await supabase
          .from('user_minutes')
          .update({
            balance_minutes: userMinutes.balance_minutes + productInfo.amount,
            total_purchased_minutes: userMinutes.total_purchased_minutes + productInfo.amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_minutes')
          .insert({
            user_id: user.id,
            balance_minutes: productInfo.amount,
            total_purchased_minutes: productInfo.amount,
          });
      }

      // Record transaction
      await supabase
        .from('minute_transactions')
        .insert({
          user_id: user.id,
          amount: productInfo.amount,
          transaction_type: 'purchase',
          description: `iOS IAP: ${verifiedProductId}`,
        });

      console.log(`Added ${productInfo.amount} minutes for user ${user.id}`);
    } 
    else if (productInfo.type === 'coins' && productInfo.amount) {
      // Add coins to user wallet
      const { data: userCoins } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userCoins) {
        await supabase
          .from('user_coins')
          .update({
            balance: userCoins.balance + productInfo.amount,
            lifetime_earned: userCoins.lifetime_earned + productInfo.amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_coins')
          .insert({
            user_id: user.id,
            balance: productInfo.amount,
            lifetime_earned: productInfo.amount,
          });
      }

      // Record transaction
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: productInfo.amount,
          transaction_type: 'iap_purchase',
          description: `iOS IAP: ${verifiedProductId}`,
        });

      console.log(`Added ${productInfo.amount} coins for user ${user.id}`);
    }
    else if (productInfo.type === 'subscription') {
      // Update user subscription status
      // This would integrate with your subscription system
      console.log(`Subscription activated for user ${user.id}: ${verifiedProductId}`);
      
      // You might want to update a subscriptions table here
      // or trigger additional logic for subscription management
    }

    console.log(`iOS purchase verified successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        productId: verifiedProductId,
        transactionId: verifiedTransactionId,
        productType: productInfo.type,
        amount: productInfo.amount,
        expirationDate: expirationDate?.toISOString(),
        isTrial,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error verifying iOS purchase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
