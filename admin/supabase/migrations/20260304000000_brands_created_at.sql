-- brands table-д created_at column нэмэх (шинэ брэндийг эхэнд харуулахын тулд)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
