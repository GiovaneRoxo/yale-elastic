
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('vendedor', 'cliente', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'cliente',
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    company TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Machines table (forklift models)
CREATE TABLE public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL DEFAULT 'Yale',
    model TEXT NOT NULL,
    serial_prefix TEXT,
    year_range TEXT,
    fuel_type TEXT,
    capacity TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view machines" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage machines" ON public.machines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Part categories
CREATE TABLE public.part_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.part_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view categories" ON public.part_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.part_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Parts table
CREATE TABLE public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.part_categories(id),
    image_url TEXT,
    unit TEXT DEFAULT 'UN',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view parts" ON public.parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage parts" ON public.parts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Machine-Part relationship (which parts apply to which machines)
CREATE TABLE public.machine_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
    quantity_per_machine INT DEFAULT 1,
    notes TEXT,
    UNIQUE(machine_id, part_id)
);
ALTER TABLE public.machine_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view machine_parts" ON public.machine_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage machine_parts" ON public.machine_parts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_machines_brand ON public.machines(brand);
CREATE INDEX idx_machines_model ON public.machines(model);
CREATE INDEX idx_parts_part_number ON public.parts(part_number);
CREATE INDEX idx_parts_category ON public.parts(category_id);
CREATE INDEX idx_machine_parts_machine ON public.machine_parts(machine_id);
CREATE INDEX idx_machine_parts_part ON public.machine_parts(part_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
