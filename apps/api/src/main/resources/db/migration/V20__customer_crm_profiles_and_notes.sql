ALTER TABLE customers
    ADD COLUMN email VARCHAR(255) NULL AFTER phone_number,
    ADD COLUMN allergy_note TEXT NULL AFTER email,
    ADD COLUMN anniversary_type VARCHAR(40) NULL AFTER allergy_note,
    ADD COLUMN anniversary_date VARCHAR(10) NULL AFTER anniversary_type,
    ADD COLUMN preference_note TEXT NULL AFTER anniversary_date,
    ADD COLUMN internal_note TEXT NULL AFTER preference_note,
    ADD COLUMN is_vip BOOLEAN NOT NULL DEFAULT FALSE AFTER internal_note,
    ADD COLUMN is_caution BOOLEAN NOT NULL DEFAULT FALSE AFTER is_vip,
    ADD COLUMN caution_reason TEXT NULL AFTER is_caution,
    ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE AFTER caution_reason,
    ADD COLUMN blocked_reason TEXT NULL AFTER is_blocked,
    ADD KEY ix_customers_restaurant_name (restaurant_id, name),
    ADD KEY ix_customers_restaurant_flags (restaurant_id, is_vip, is_caution, is_blocked);

CREATE TABLE customer_notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    note_type VARCHAR(50) NOT NULL,
    visibility VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    deleted_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_customer_notes_customer_created_at (customer_id, created_at),
    KEY ix_customer_notes_restaurant_type (restaurant_id, note_type),
    CONSTRAINT fk_customer_notes_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_customer_notes_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (id),
    CONSTRAINT fk_customer_notes_author_user
        FOREIGN KEY (author_user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
