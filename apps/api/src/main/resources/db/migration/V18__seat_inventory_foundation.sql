CREATE TABLE restaurant_tables (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    seat_type VARCHAR(50) NOT NULL,
    seat_type_label VARCHAR(80) NOT NULL,
    min_party_size INT NOT NULL,
    max_party_size INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    internal_note VARCHAR(1000) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurant_tables_restaurant_name (restaurant_id, name),
    KEY ix_restaurant_tables_restaurant_active_sort (restaurant_id, is_active, sort_order, id),
    CONSTRAINT fk_restaurant_tables_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_restaurant_tables_party_size CHECK (
        min_party_size >= 1
        AND max_party_size >= min_party_size
        AND max_party_size <= 8
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE table_combinations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    table_ids JSON NOT NULL,
    min_party_size INT NOT NULL,
    max_party_size INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_table_combinations_restaurant_name (restaurant_id, name),
    KEY ix_table_combinations_restaurant_active (restaurant_id, is_active, id),
    CONSTRAINT fk_table_combinations_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_table_combinations_party_size CHECK (
        min_party_size >= 1
        AND max_party_size >= min_party_size
        AND max_party_size <= 8
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE reservation_product_seat_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_product_id BIGINT NOT NULL,
    allowed_seat_types JSON NULL,
    allowed_table_ids JSON NULL,
    default_duration_minutes INT NULL,
    slot_interval_minutes INT NULL,
    inventory_policy VARCHAR(50) NOT NULL DEFAULT 'TABLE',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservation_product_seat_rules_product (reservation_product_id),
    KEY ix_reservation_product_seat_rules_restaurant (restaurant_id, id),
    CONSTRAINT fk_reservation_product_seat_rules_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_reservation_product_seat_rules_product
        FOREIGN KEY (reservation_product_id)
        REFERENCES reservation_products (id),
    CONSTRAINT ck_reservation_product_seat_rules_duration CHECK (
        default_duration_minutes IS NULL
        OR (default_duration_minutes >= 30 AND default_duration_minutes <= 240)
    ),
    CONSTRAINT ck_reservation_product_seat_rules_interval CHECK (
        slot_interval_minutes IS NULL
        OR slot_interval_minutes IN (30, 60)
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
