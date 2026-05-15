CREATE TABLE reservation_products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(500) NULL,
    price_amount BIGINT NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL,
    min_party_size INT NOT NULL,
    max_party_size INT NOT NULL,
    available_days JSON NOT NULL,
    available_start_time TIME NULL,
    available_end_time TIME NULL,
    slot_capacity INT NOT NULL,
    payment_policy_type VARCHAR(50) NOT NULL DEFAULT 'NONE',
    payment_amount BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_reservation_products_restaurant_status_visible (restaurant_id, status, visible),
    CONSTRAINT fk_reservation_products_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_reservation_products_price_non_negative CHECK (price_amount >= 0),
    CONSTRAINT ck_reservation_products_party_size CHECK (
        min_party_size >= 1
        AND max_party_size >= min_party_size
        AND max_party_size <= 20
    ),
    CONSTRAINT ck_reservation_products_slot_capacity CHECK (slot_capacity >= 1),
    CONSTRAINT ck_reservation_products_payment_amount CHECK (payment_amount IS NULL OR payment_amount >= 0),
    CONSTRAINT ck_reservation_products_time_range CHECK (
        (available_start_time IS NULL AND available_end_time IS NULL)
        OR (available_start_time IS NOT NULL AND available_end_time IS NOT NULL AND available_start_time < available_end_time)
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
