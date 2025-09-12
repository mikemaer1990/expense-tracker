-- =====================================================
-- SIMPLE TRIGGER FIX - SECURITY DEFINER APPROACH
-- =====================================================
-- Use SECURITY DEFINER to bypass RLS during signup
-- This is the most reliable approach for Supabase
-- =====================================================

-- Update the category creation function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_user_default_categories()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- Create default categories (runs with postgres privileges)
    INSERT INTO public.categories (user_id, name, color) VALUES
        (NEW.id, 'Fixed Expenses', '#EF4444'),
        (NEW.id, 'Variable Expenses', '#F59E0B'), 
        (NEW.id, 'Optional Expenses', '#8B5CF6');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the expense type creation function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_default_expense_types()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Create default expense types based on category name
    IF NEW.name = 'Fixed Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Rent/Mortgage', 'HomeIcon', false, NULL),
            (NEW.id, 'Insurance', 'ShieldCheckIcon', false, NULL),
            (NEW.id, 'Phone', 'DevicePhoneMobileIcon', false, NULL),
            (NEW.id, 'Internet', 'WifiIcon', false, NULL);
    ELSIF NEW.name = 'Variable Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Groceries', 'ShoppingCartIcon', false, NULL),
            (NEW.id, 'Gas', 'TruckIcon', false, NULL),
            (NEW.id, 'Utilities', 'BoltIcon', false, NULL),
            (NEW.id, 'Transportation', 'MapPinIcon', false, NULL),
            (NEW.id, 'Maintenance', 'WrenchScrewdriverIcon', false, NULL);
    ELSIF NEW.name = 'Optional Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Dining Out', 'CakeIcon', false, NULL),
            (NEW.id, 'Entertainment', 'FilmIcon', false, NULL),
            (NEW.id, 'Shopping', 'GiftIcon', false, NULL),
            (NEW.id, 'Hobbies', 'PuzzlePieceIcon', false, NULL),
            (NEW.id, 'Travel', 'PaperAirplaneIcon', false, NULL);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'SECURITY DEFINER FUNCTIONS UPDATED' as status;