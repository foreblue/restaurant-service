CREATE TABLE pg_webhook_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    provider_key VARCHAR(80) NOT NULL,
    event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    pg_payment_id VARCHAR(128) NULL,
    pg_refund_id VARCHAR(128) NULL,
    amount BIGINT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KRW',
    signature VARCHAR(255) NULL,
    payload JSON NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    failure_code VARCHAR(100) NULL,
    failure_message VARCHAR(500) NULL,
    payment_id BIGINT NULL,
    refund_id BIGINT NULL,
    reservation_id BIGINT NULL,
    occurred_at TIMESTAMP(6) NULL,
    processed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_pg_webhook_events_provider_event (provider_key, event_id),
    KEY ix_pg_webhook_events_payment (provider_key, pg_payment_id, created_at),
    KEY ix_pg_webhook_events_status_created_at (status, created_at),
    KEY ix_pg_webhook_events_payment_id (payment_id),
    KEY ix_pg_webhook_events_reservation_id (reservation_id),
    CONSTRAINT fk_pg_webhook_events_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments (id),
    CONSTRAINT fk_pg_webhook_events_refund
        FOREIGN KEY (refund_id)
        REFERENCES refunds (id),
    CONSTRAINT fk_pg_webhook_events_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (id),
    CONSTRAINT ck_pg_webhook_events_amount_non_negative CHECK (amount IS NULL OR amount >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
