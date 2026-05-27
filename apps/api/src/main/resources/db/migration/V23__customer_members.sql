CREATE TABLE customer_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(80) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    allergy_note TEXT NULL,
    anniversary_type VARCHAR(40) NULL,
    anniversary_date VARCHAR(10) NULL,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_customer_members_email (email),
    UNIQUE KEY uk_customer_members_phone_number (phone_number),
    KEY ix_customer_members_status (status)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE reservations
    ADD COLUMN member_id BIGINT NULL AFTER customer_id,
    ADD KEY ix_reservations_member_created_at (member_id, created_at),
    ADD CONSTRAINT fk_reservations_member
        FOREIGN KEY (member_id)
        REFERENCES customer_members (id);
