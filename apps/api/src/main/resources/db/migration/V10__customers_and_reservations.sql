CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_customers_restaurant_phone (restaurant_id, phone_number),
    KEY ix_customers_restaurant_created_at (restaurant_id, created_at),
    CONSTRAINT fk_customers_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE reservations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_product_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    reservation_number VARCHAR(64) NOT NULL,
    visit_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    party_size INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    customer_request VARCHAR(500) NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    idempotency_request_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservations_reservation_number (reservation_number),
    UNIQUE KEY uk_reservations_idempotency_key (idempotency_key),
    KEY ix_reservations_product_date_start_status (reservation_product_id, visit_date, start_time, status),
    KEY ix_reservations_restaurant_date_status (restaurant_id, visit_date, status),
    KEY ix_reservations_customer_created_at (customer_id, created_at),
    CONSTRAINT fk_reservations_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_reservations_reservation_product
        FOREIGN KEY (reservation_product_id)
        REFERENCES reservation_products (id),
    CONSTRAINT fk_reservations_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (id),
    CONSTRAINT ck_reservations_party_size CHECK (party_size >= 1),
    CONSTRAINT ck_reservations_time_range CHECK (start_time < end_time)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
