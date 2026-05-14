CREATE TABLE business_hours (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    sequence INT NOT NULL,
    opens_at TIME NULL,
    closes_at TIME NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_business_hours_restaurant_day_sequence (restaurant_id, day_of_week, sequence),
    KEY ix_business_hours_restaurant_day (restaurant_id, day_of_week),
    CONSTRAINT fk_business_hours_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_business_hours_time_required CHECK (
        (is_closed = TRUE AND opens_at IS NULL AND closes_at IS NULL)
        OR
        (is_closed = FALSE AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at)
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE holiday_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NULL,
    day_of_month INT NULL,
    week_of_month INT NULL,
    holiday_date DATE NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_holiday_rules_restaurant (restaurant_id),
    KEY ix_holiday_rules_type (type),
    KEY ix_holiday_rules_date (holiday_date),
    CONSTRAINT fk_holiday_rules_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id),
    CONSTRAINT ck_holiday_rules_day_of_month CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 31),
    CONSTRAINT ck_holiday_rules_week_of_month CHECK (week_of_month IS NULL OR week_of_month BETWEEN 1 AND 5),
    CONSTRAINT ck_holiday_rules_time_range CHECK (
        start_time IS NULL OR end_time IS NULL OR start_time < end_time
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
