CREATE TABLE time_slots (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_product_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_time_slots_product_date_start (reservation_product_id, slot_date, start_time),
    KEY ix_time_slots_restaurant_date (restaurant_id, slot_date),
    CONSTRAINT fk_time_slots_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_time_slots_reservation_product
        FOREIGN KEY (reservation_product_id)
        REFERENCES reservation_products (id),
    CONSTRAINT ck_time_slots_capacity_positive CHECK (capacity >= 1),
    CONSTRAINT ck_time_slots_time_range CHECK (start_time < end_time)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
