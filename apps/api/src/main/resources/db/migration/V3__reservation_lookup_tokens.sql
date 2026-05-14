CREATE TABLE reservation_lookup_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reservation_number VARCHAR(64) NOT NULL,
    phone_number_hash CHAR(64) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_used_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservation_lookup_tokens_token_hash (token_hash),
    KEY ix_reservation_lookup_tokens_reservation_number (reservation_number),
    KEY ix_reservation_lookup_tokens_expires_at (expires_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
