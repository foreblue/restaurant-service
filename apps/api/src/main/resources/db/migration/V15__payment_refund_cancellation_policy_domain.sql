CREATE TABLE cancellation_policies (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_product_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    rules JSON NOT NULL,
    no_show_rule JSON NULL,
    restaurant_cancel_refund_rate INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_cancellation_policies_restaurant_active (restaurant_id, is_active, effective_from),
    KEY ix_cancellation_policies_product_active (reservation_product_id, is_active, effective_from),
    CONSTRAINT fk_cancellation_policies_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_cancellation_policies_reservation_product
        FOREIGN KEY (reservation_product_id)
        REFERENCES reservation_products (id),
    CONSTRAINT ck_cancellation_policies_restaurant_refund_rate CHECK (
        restaurant_cancel_refund_rate >= 0
        AND restaurant_cancel_refund_rate <= 100
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE reservations
    ADD COLUMN payment_required BOOLEAN NOT NULL DEFAULT FALSE AFTER no_show_at,
    ADD COLUMN payment_mode VARCHAR(50) NOT NULL DEFAULT 'FREE' AFTER payment_required,
    ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED' AFTER payment_mode,
    ADD COLUMN payment_due_at TIMESTAMP(6) NULL AFTER payment_status,
    ADD COLUMN cancellation_policy_snapshot JSON NULL AFTER payment_due_at;

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    reservation_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    refunded_amount BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'KRW',
    pg_provider_key VARCHAR(80) NULL,
    pg_payment_id VARCHAR(128) NULL,
    pg_order_id VARCHAR(128) NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    guarantee_token_id VARCHAR(191) NULL,
    failure_code VARCHAR(100) NULL,
    failure_message VARCHAR(500) NULL,
    paid_at TIMESTAMP(6) NULL,
    expires_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_idempotency_key (idempotency_key),
    UNIQUE KEY uk_payments_pg_payment (pg_provider_key, pg_payment_id),
    KEY ix_payments_restaurant_created_at (restaurant_id, created_at),
    KEY ix_payments_reservation_created_at (reservation_id, created_at),
    KEY ix_payments_customer_created_at (customer_id, created_at),
    KEY ix_payments_status_created_at (status, created_at),
    CONSTRAINT fk_payments_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_payments_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (id),
    CONSTRAINT fk_payments_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (id),
    CONSTRAINT ck_payments_amount_non_negative CHECK (amount >= 0),
    CONSTRAINT ck_payments_refunded_amount_non_negative CHECK (refunded_amount >= 0),
    CONSTRAINT ck_payments_refunded_amount_lte_amount CHECK (refunded_amount <= amount)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE refunds (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_id BIGINT NOT NULL,
    reservation_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    refund_amount BIGINT NOT NULL,
    non_refundable_amount BIGINT NOT NULL DEFAULT 0,
    reason VARCHAR(50) NOT NULL,
    policy_snapshot JSON NULL,
    policy_rule_id VARCHAR(100) NULL,
    pg_refund_id VARCHAR(128) NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    failure_code VARCHAR(100) NULL,
    failure_message VARCHAR(500) NULL,
    requested_by_role VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    succeeded_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_refunds_idempotency_key (idempotency_key),
    UNIQUE KEY uk_refunds_pg_refund (pg_refund_id),
    KEY ix_refunds_payment_created_at (payment_id, created_at),
    KEY ix_refunds_reservation_created_at (reservation_id, created_at),
    KEY ix_refunds_restaurant_created_at (restaurant_id, created_at),
    KEY ix_refunds_status_created_at (status, created_at),
    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments (id),
    CONSTRAINT fk_refunds_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (id),
    CONSTRAINT fk_refunds_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_refunds_amount_non_negative CHECK (refund_amount >= 0),
    CONSTRAINT ck_refunds_non_refundable_amount_non_negative CHECK (non_refundable_amount >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
