-- Fix Security Advisor Warning: Function Search Path Mutable
-- We alter the function to explicitly set the search_path to 'public'
ALTER FUNCTION public.update_budgets_updated_at() SET search_path = public;
