
-- Create a secure function to update order status that bypasses RLS recursion
CREATE OR REPLACE FUNCTION public.update_order_status(order_uuid uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a seller for this order
  IF NOT EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid
    AND p.seller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not authorized to update this order';
  END IF;
  
  -- Update the order status
  UPDATE orders 
  SET status = new_status, updated_at = now()
  WHERE id = order_uuid;
END;
$$;
