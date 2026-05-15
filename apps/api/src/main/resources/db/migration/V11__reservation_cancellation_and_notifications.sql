ALTER TABLE reservations
    ADD COLUMN cancelled_at TIMESTAMP(6) NULL AFTER customer_request,
    ADD COLUMN cancel_reason VARCHAR(255) NULL AFTER cancelled_at;

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_id BIGINT NOT NULL,
    customer_id BIGINT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_contact VARCHAR(120) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    last_error TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_notifications_reservation_created_at (reservation_id, created_at),
    KEY ix_notifications_restaurant_status (restaurant_id, status),
    KEY ix_notifications_status_created_at (status, created_at),
    CONSTRAINT fk_notifications_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_notifications_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (id),
    CONSTRAINT fk_notifications_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
