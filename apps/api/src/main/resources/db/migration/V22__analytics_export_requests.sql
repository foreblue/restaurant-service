CREATE TABLE analytics_export_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    requested_by_user_id BIGINT NOT NULL,
    export_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    from_date DATE NULL,
    to_date DATE NULL,
    slot_date DATE NULL,
    row_count INT NOT NULL DEFAULT 0,
    file_name VARCHAR(191) NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT 'text/csv; charset=utf-8',
    csv_content LONGTEXT NULL,
    failure_message VARCHAR(500) NULL,
    completed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_analytics_exports_restaurant_created_at (restaurant_id, created_at),
    KEY ix_analytics_exports_requested_by_created_at (requested_by_user_id, created_at),
    KEY ix_analytics_exports_type_status (export_type, status),
    CONSTRAINT fk_analytics_exports_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT fk_analytics_exports_requested_by
        FOREIGN KEY (requested_by_user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
