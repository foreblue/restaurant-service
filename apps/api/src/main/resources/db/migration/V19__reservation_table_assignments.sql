CREATE TABLE reservation_table_assignments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_id BIGINT NOT NULL,
    restaurant_table_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservation_table_assignments_reservation_table (reservation_id, restaurant_table_id),
    KEY ix_reservation_table_assignments_restaurant_table (restaurant_id, restaurant_table_id),
    KEY ix_reservation_table_assignments_reservation (reservation_id),
    CONSTRAINT fk_reservation_table_assignments_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_reservation_table_assignments_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (id),
    CONSTRAINT fk_reservation_table_assignments_table
        FOREIGN KEY (restaurant_table_id)
        REFERENCES restaurant_tables (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
