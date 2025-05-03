
-- This function updates the product quantity after a purchase
CREATE OR REPLACE FUNCTION decrement_quantity(p_product_id UUID, p_quantity NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  current_quantity NUMERIC;
BEGIN
  -- Get current quantity
  SELECT quantity_available INTO current_quantity
  FROM products
  WHERE id = p_product_id;
  
  -- Reduce quantity and return new value
  RETURN GREATEST(0, current_quantity - p_quantity);
END;
$$ LANGUAGE plpgsql;
