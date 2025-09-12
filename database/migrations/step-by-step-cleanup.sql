-- =====================================================
-- STEP-BY-STEP MANUAL CLEANUP
-- =====================================================
-- Run each command individually and verify results
-- DO NOT run all at once - run one at a time!
-- =====================================================

-- STEP 1: First, let's see exactly what we have with IDs
-- Run this first to see the current state:

SELECT 
    et.id,
    et.name,
    et.icon_name,
    et.created_at,
    c.name as category_name
FROM expense_types et
JOIN categories c ON et.category_id = c.id
WHERE c.name = 'Fixed Expenses'
ORDER BY et.name, et.created_at;

-- =====================================================
-- After running STEP 1, copy the IDs of duplicates you want to delete
-- Then run the commands below ONE AT A TIME
-- =====================================================

-- STEP 2: Delete "Phone Bill" entirely (we want "Phone", not "Phone Bill")
-- Run this command:
DELETE FROM expense_types WHERE name = 'Phone Bill';

-- STEP 3: Verify Phone Bill is gone
-- Run this to check:
SELECT COUNT(*) FROM expense_types WHERE name = 'Phone Bill';

-- STEP 4: Find duplicate Insurance IDs and delete the newer one
-- First see which Insurance entries exist:
SELECT id, created_at FROM expense_types WHERE name = 'Insurance' ORDER BY created_at;

-- Then delete the NEWER Insurance entry (replace UUID with actual ID from above):
-- DELETE FROM expense_types WHERE id = 'NEWER_INSURANCE_ID_HERE';

-- STEP 5: Find duplicate Internet IDs and delete the newer one
-- First see which Internet entries exist:
SELECT id, created_at FROM expense_types WHERE name = 'Internet' ORDER BY created_at;

-- Then delete the NEWER Internet entry (replace UUID with actual ID from above):
-- DELETE FROM expense_types WHERE id = 'NEWER_INTERNET_ID_HERE';

-- STEP 6: Find duplicate Rent/Mortgage IDs and delete the newer one
-- First see which Rent/Mortgage entries exist:
SELECT id, created_at FROM expense_types WHERE name = 'Rent/Mortgage' ORDER BY created_at;

-- Then delete the NEWER Rent/Mortgage entry (replace UUID with actual ID from above):
-- DELETE FROM expense_types WHERE id = 'NEWER_RENT_ID_HERE';

-- STEP 7: Find duplicate Utilities IDs and delete the newer one
-- First see which Utilities entries exist:
SELECT id, created_at FROM expense_types WHERE name = 'Utilities' ORDER BY created_at;

-- Then delete the NEWER Utilities entry (replace UUID with actual ID from above):
-- DELETE FROM expense_types WHERE id = 'NEWER_UTILITIES_ID_HERE';

-- STEP 8: Check if we have Phone (should exist already)
SELECT COUNT(*) FROM expense_types WHERE name = 'Phone';

-- STEP 9: If Phone doesn't exist, create it
-- (Only run if STEP 8 shows 0)
-- INSERT INTO expense_types (category_id, name, icon_name, is_user_created, created_by_user_id)
-- SELECT id, 'Phone', 'DevicePhoneMobileIcon', false, NULL 
-- FROM categories WHERE name = 'Fixed Expenses';

-- STEP 10: Update icons to make sure they're correct
UPDATE expense_types SET icon_name = 'TruckIcon' WHERE name = 'Car Payment';
UPDATE expense_types SET icon_name = 'ShieldCheckIcon' WHERE name = 'Insurance';
UPDATE expense_types SET icon_name = 'WifiIcon' WHERE name = 'Internet';
UPDATE expense_types SET icon_name = 'DevicePhoneMobileIcon' WHERE name = 'Phone';
UPDATE expense_types SET icon_name = 'HomeIcon' WHERE name = 'Rent/Mortgage';
UPDATE expense_types SET icon_name = 'BoltIcon' WHERE name = 'Utilities';

-- STEP 11: Final verification - should show exactly 6 entries
SELECT 
    et.name,
    et.icon_name,
    c.name as category_name,
    et.id
FROM expense_types et
JOIN categories c ON et.category_id = c.id
WHERE c.name = 'Fixed Expenses'
ORDER BY et.name;

-- STEP 12: Final count check
SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT et.name) as unique_names,
    STRING_AGG(et.name, ', ' ORDER BY et.name) as all_names
FROM expense_types et
JOIN categories c ON et.category_id = c.id
WHERE c.name = 'Fixed Expenses';