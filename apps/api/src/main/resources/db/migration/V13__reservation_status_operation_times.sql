ALTER TABLE reservations
    ADD COLUMN completed_at TIMESTAMP(6) NULL AFTER cancel_reason,
    ADD COLUMN no_show_at TIMESTAMP(6) NULL AFTER completed_at;
