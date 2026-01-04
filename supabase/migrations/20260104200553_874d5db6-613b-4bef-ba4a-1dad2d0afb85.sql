-- Add 'signup_bonus' to the minute_transaction_type enum
ALTER TYPE minute_transaction_type ADD VALUE IF NOT EXISTS 'signup_bonus';