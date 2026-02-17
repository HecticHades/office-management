-- Seed initial admin user (temp password: ChangeMe123!Admin)
-- User must change password on first login
INSERT INTO users (username, display_name, password_hash, role, must_change_password)
VALUES ('admin', 'System Administrator', '$2b$12$PWkFIss8m4gtdeZ4JdygOONFc8QCtl.GPyyWqpzfwj5NdIzf8RVDe', 'admin', true);
