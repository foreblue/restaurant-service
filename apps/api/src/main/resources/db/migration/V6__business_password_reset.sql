CREATE TABLE business_password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    requested_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_business_password_reset_tokens_token_hash (token_hash),
    KEY ix_business_password_reset_tokens_user_requested (user_id, requested_at),
    KEY ix_business_password_reset_tokens_expires_at (expires_at),
    CONSTRAINT fk_business_password_reset_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE business_password_reset_notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reset_token_id BIGINT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    delivery_payload JSON NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_business_password_reset_notifications_token (reset_token_id),
    KEY ix_business_password_reset_notifications_status (status),
    CONSTRAINT fk_business_password_reset_notifications_token
        FOREIGN KEY (reset_token_id)
        REFERENCES business_password_reset_tokens (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
