-- Floor plan configuration (background image, canvas dimensions)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Insert default floor plan config
INSERT INTO app_settings (key, value)
VALUES ('floor_plan', '{"image_url": null, "canvas_width": 1200, "canvas_height": 800}')
ON CONFLICT (key) DO NOTHING;
