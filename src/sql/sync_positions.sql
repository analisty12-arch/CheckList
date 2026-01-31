-- Function to sync positions: 
-- 1. Insert missing positions from the input list
-- 2. Unlink employees from positions NOT in the input list
-- 3. Delete positions NOT in the input list

CREATE OR REPLACE FUNCTION sync_positions(allowed_titles text[])
RETURNS text AS $$
DECLARE
    -- cleaned_titles variable to store the array without conflict
    cleaned_titles text[];
BEGIN
    -- Normalize input to lowercase for comparison and store in variable
    SELECT array_agg(lower(t)) INTO cleaned_titles FROM unnest(allowed_titles) t;

    -- 1. Insert missing positions
    INSERT INTO positions (title)
    SELECT DISTINCT t
    FROM unnest(allowed_titles) t
    WHERE NOT EXISTS (
        SELECT 1 FROM positions p WHERE lower(p.title) = lower(t)
    );

    -- 2. Unlink employees from invalid positions
    UPDATE employees e
    SET position_id = NULL
    WHERE e.position_id IN (
        SELECT id FROM positions p
        WHERE lower(p.title) <> ALL(cleaned_titles)
    );

    -- 3. Delete invalid positions
    DELETE FROM positions p
    WHERE lower(p.title) <> ALL(cleaned_titles);

    RETURN 'Success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
