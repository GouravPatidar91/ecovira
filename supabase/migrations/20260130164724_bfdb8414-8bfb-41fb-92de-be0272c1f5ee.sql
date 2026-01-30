-- =====================================================
-- ECOVIRA DATABASE SCHEMA - Complete Setup
-- =====================================================

-- 1. Create enum for app roles (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer', 'buyer');

-- 2. Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- =====================================================
-- USER ROLES TABLE (Security best practice - separate from profiles)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    business_name TEXT,
    location TEXT,
    bio TEXT,
    avatar_url TEXT,
    phone TEXT,
    verification_status verification_status DEFAULT 'unverified' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS for profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    unit TEXT NOT NULL,
    quantity_available NUMERIC DEFAULT 0 NOT NULL,
    is_organic BOOLEAN DEFAULT false,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS for products
CREATE POLICY "Products are viewable by everyone"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Sellers can insert their own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
    ON public.products FOR DELETE
    USING (auth.uid() = seller_id);

-- =====================================================
-- CART ITEMS TABLE
-- =====================================================
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS for cart_items
CREATE POLICY "Users can view their own cart items"
    ON public.cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
    ON public.cart_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
    ON public.cart_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
    ON public.cart_items FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'declined')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS for orders
CREATE POLICY "Buyers can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = buyer_id);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS for order_items (view if you own the order or the product)
CREATE POLICY "Users can view order items for their orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.buyer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = order_items.product_id
            AND products.seller_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert order items for their orders"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.buyer_id = auth.uid()
        )
    );

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    payment_id VARCHAR NOT NULL,
    transaction_id VARCHAR NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'completed' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for payment_transactions
CREATE POLICY "Users can view their own transactions"
    ON public.payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND orders.buyer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transactions for their orders"
    ON public.payment_transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND orders.buyer_id = auth.uid()
        )
    );

-- =====================================================
-- CHAT CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS for chat_conversations
CREATE POLICY "Users can view their own conversations"
    ON public.chat_conversations FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
    ON public.chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for chat_messages
CREATE POLICY "Users can view messages in their conversations"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = conversation_id
            AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = conversation_id
            AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = conversation_id
            AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid())
        )
    );

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'buyer');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to decrement product quantity
CREATE OR REPLACE FUNCTION public.decrement_quantity(p_product_id UUID, p_quantity NUMERIC)
RETURNS VOID AS $$
DECLARE
    current_quantity NUMERIC;
BEGIN
    SELECT quantity_available INTO current_quantity
    FROM products
    WHERE id = p_product_id;
    
    UPDATE products
    SET quantity_available = GREATEST(0, current_quantity - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create order (bypasses RLS for atomic operation)
CREATE OR REPLACE FUNCTION public.create_order(
    p_buyer_id UUID,
    p_total_amount NUMERIC,
    p_shipping_address TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    v_order_id := COALESCE(p_order_id, gen_random_uuid());
    
    INSERT INTO public.orders (id, buyer_id, total_amount, shipping_address, status, payment_status)
    VALUES (v_order_id, p_buyer_id, p_total_amount, p_shipping_address, 'pending', 'paid');
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create order items
CREATE OR REPLACE FUNCTION public.create_order_items(
    p_order_id UUID,
    p_items JSONB
)
RETURNS VOID AS $$
DECLARE
    item JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (
            p_order_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::NUMERIC,
            (item->>'total_price')::NUMERIC
        );
        
        -- Decrement product quantity
        PERFORM public.decrement_quantity(
            (item->>'product_id')::UUID,
            (item->>'quantity')::NUMERIC
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get seller orders
CREATE OR REPLACE FUNCTION public.get_seller_orders(seller_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status TEXT,
    payment_status TEXT,
    shipping_address TEXT,
    buyer_id UUID,
    buyer_name TEXT,
    order_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.created_at,
        o.total_amount,
        o.status,
        o.payment_status,
        o.shipping_address,
        o.buyer_id,
        COALESCE(p.full_name, 'Unknown Buyer') as buyer_name,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'product_name', prod.name,
                    'product_unit', prod.unit,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::jsonb
        ) as order_items
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.buyer_id = p.id
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products prod ON oi.product_id = prod.id
    WHERE prod.seller_id = seller_user_id OR EXISTS (
        SELECT 1 FROM public.order_items oi2
        JOIN public.products p2 ON oi2.product_id = p2.id
        WHERE oi2.order_id = o.id AND p2.seller_id = seller_user_id
    )
    GROUP BY o.id, o.created_at, o.total_amount, o.status, o.payment_status, o.shipping_address, o.buyer_id, p.full_name
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get buyer orders
CREATE OR REPLACE FUNCTION public.get_buyer_orders(buyer_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status TEXT,
    payment_status TEXT,
    shipping_address TEXT,
    order_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.created_at,
        o.total_amount,
        o.status,
        o.payment_status,
        o.shipping_address,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'product_name', prod.name,
                    'product_unit', prod.unit,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price,
                    'seller_name', COALESCE(seller.business_name, seller.full_name, 'Unknown Seller')
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::jsonb
        ) as order_items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products prod ON oi.product_id = prod.id
    LEFT JOIN public.profiles seller ON prod.seller_id = seller.id
    WHERE o.buyer_id = buyer_user_id
    GROUP BY o.id, o.created_at, o.total_amount, o.status, o.payment_status, o.shipping_address
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update order status
CREATE OR REPLACE FUNCTION public.update_order_status(order_uuid UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.orders
    SET status = new_status, updated_at = now()
    WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;