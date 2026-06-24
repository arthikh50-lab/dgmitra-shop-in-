-- Copy and paste this into the SQL Editor in your Supabase Dashboard and click "Run"

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uid uuid UNIQUE NOT NULL,
  email text,
  role text DEFAULT 'user',
  "isDisabled" boolean DEFAULT false,
  "savedAddresses" jsonb DEFAULT '[]'::jsonb,
  "measurements" jsonb,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  description text,
  price numeric,
  "originalPrice" numeric,
  image text,
  category text,
  sizes jsonb,
  colors jsonb,
  materials jsonb,
  sustainability text,
  "inStock" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid,
  status text DEFAULT 'pending',
  "paymentIntentId" text,
  "serviceType" text,
  fabric text,
  condition text,
  price numeric,
  discount numeric,
  "appliedCoupon" text,
  "originalImageUrl" text,
  "baseLayerUrl" text,
  "customizedImageUrl" text,
  "generatedDesign" text,
  design text,
  measurements jsonb,
  address jsonb,
  "paymentMethod" text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "originalImage" text,
  "customizedImage" text,
  description text,
  style text,
  likes integer DEFAULT 0,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create the user_designs table
CREATE TABLE IF NOT EXISTS public.user_designs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid,
  prompt text,
  "originalImage" text,
  "generatedImage" text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid,
  "productId" uuid,
  rating integer,
  comment text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Disable Row Level Security (RLS) so anyone can read/write (for development)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- 8. Create a storage bucket for app-storage
insert into storage.buckets (id, name, public) values ('app-storage', 'app-storage', true)
ON CONFLICT DO NOTHING;

-- Note: In production, you should ENABLE Row Level Security (RLS) and define proper access policies.
