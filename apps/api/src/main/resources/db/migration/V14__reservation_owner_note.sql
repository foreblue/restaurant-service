ALTER TABLE reservations
    ADD COLUMN owner_note VARCHAR(1000) NULL AFTER customer_request;
