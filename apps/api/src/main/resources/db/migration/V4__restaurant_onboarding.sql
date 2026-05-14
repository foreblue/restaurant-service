CREATE TABLE stored_files (
    id BIGINT NOT NULL AUTO_INCREMENT,
    storage_key VARCHAR(512) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL,
    checksum_sha256 CHAR(64) NULL,
    visibility VARCHAR(50) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    created_by_user_id BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_stored_files_storage_key (storage_key),
    KEY ix_stored_files_purpose (purpose),
    KEY ix_stored_files_created_by_user_id (created_by_user_id),
    CONSTRAINT ck_stored_files_byte_size_non_negative CHECK (byte_size >= 0),
    CONSTRAINT fk_stored_files_created_by_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE restaurants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_user_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(60) NULL,
    description TEXT NULL,
    phone VARCHAR(32) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    postal_code VARCHAR(20) NULL,
    cuisine_types JSON NOT NULL,
    cover_image_file_id BIGINT NULL,
    status VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    approved_at TIMESTAMP(6) NULL,
    suspended_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurants_owner_user_id (owner_user_id),
    UNIQUE KEY uk_restaurants_slug (slug),
    KEY ix_restaurants_status (status),
    KEY ix_restaurants_cover_image_file_id (cover_image_file_id),
    CONSTRAINT fk_restaurants_owner_user
        FOREIGN KEY (owner_user_id)
        REFERENCES users (id),
    CONSTRAINT fk_restaurants_cover_image_file
        FOREIGN KEY (cover_image_file_id)
        REFERENCES stored_files (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE users
    ADD CONSTRAINT fk_users_linked_restaurant
        FOREIGN KEY (linked_restaurant_id)
        REFERENCES restaurants (id);

CREATE TABLE restaurant_applications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    business_registration_no CHAR(10) NULL,
    business_name VARCHAR(120) NULL,
    representative_name VARCHAR(100) NULL,
    business_address VARCHAR(255) NULL,
    business_license_file_id BIGINT NULL,
    manager_name VARCHAR(100) NULL,
    manager_phone VARCHAR(32) NULL,
    manager_email VARCHAR(255) NULL,
    contact_verified_at TIMESTAMP(6) NULL,
    status VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP(6) NULL,
    reviewed_by_user_id BIGINT NULL,
    reviewed_at TIMESTAMP(6) NULL,
    review_note TEXT NULL,
    rejection_reason TEXT NULL,
    submitted_restaurant_id BIGINT GENERATED ALWAYS AS (
        CASE WHEN status = 'SUBMITTED' THEN restaurant_id ELSE NULL END
    ) STORED,
    approved_business_registration_no CHAR(10) GENERATED ALWAYS AS (
        CASE
            WHEN status = 'APPROVED' AND business_registration_no IS NOT NULL
            THEN business_registration_no
            ELSE NULL
        END
    ) STORED,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurant_applications_submitted_restaurant (submitted_restaurant_id),
    UNIQUE KEY uk_restaurant_applications_approved_business_no (approved_business_registration_no),
    KEY ix_restaurant_applications_restaurant_id (restaurant_id),
    KEY ix_restaurant_applications_status (status),
    KEY ix_restaurant_applications_business_license_file_id (business_license_file_id),
    KEY ix_restaurant_applications_reviewed_by_user_id (reviewed_by_user_id),
    CONSTRAINT fk_restaurant_applications_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_restaurant_applications_business_license_file
        FOREIGN KEY (business_license_file_id)
        REFERENCES stored_files (id),
    CONSTRAINT fk_restaurant_applications_reviewed_by_user
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE reservation_pages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    slug VARCHAR(60) NULL,
    status VARCHAR(50) NOT NULL,
    published_at TIMESTAMP(6) NULL,
    unpublished_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservation_pages_restaurant_id (restaurant_id),
    UNIQUE KEY uk_reservation_pages_slug (slug),
    KEY ix_reservation_pages_status (status),
    CONSTRAINT fk_reservation_pages_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
