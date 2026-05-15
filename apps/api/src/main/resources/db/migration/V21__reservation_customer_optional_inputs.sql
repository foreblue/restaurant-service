ALTER TABLE reservations
    ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_request,
    ADD COLUMN allergy_note TEXT NULL AFTER customer_email,
    ADD COLUMN anniversary_type VARCHAR(40) NULL AFTER allergy_note,
    ADD COLUMN anniversary_date VARCHAR(10) NULL AFTER anniversary_type,
    ADD COLUMN request_template_values JSON NULL AFTER anniversary_date,
    ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE AFTER request_template_values;
