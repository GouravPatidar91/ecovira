
-- This function creates a table to store payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  payment_id VARCHAR NOT NULL,
  transaction_id VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add Row Level Security to the table
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions 
FOR SELECT
USING (
  auth.uid() IN (
    SELECT buyer_id FROM public.orders WHERE id = order_id
  )
);

-- Create policy to allow inserting transactions
CREATE POLICY "Service role can insert transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);
