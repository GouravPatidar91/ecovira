-- Fix function search paths for security
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.decrement_quantity(UUID, NUMERIC) SET search_path = public;
ALTER FUNCTION public.create_order(UUID, NUMERIC, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.create_order_items(UUID, JSONB) SET search_path = public;
ALTER FUNCTION public.get_seller_orders(UUID) SET search_path = public;
ALTER FUNCTION public.get_buyer_orders(UUID) SET search_path = public;
ALTER FUNCTION public.update_order_status(UUID, TEXT) SET search_path = public;