ALTER TABLE restaurants
    MODIFY name VARCHAR(80) NULL,
    MODIFY phone VARCHAR(32) NULL,
    MODIFY address_line1 VARCHAR(255) NULL,
    MODIFY cuisine_types JSON NULL;

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id BIGINT NOT NULL,
    before_value JSON NULL,
    after_value JSON NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_audit_logs_actor_user_id (actor_user_id),
    KEY ix_audit_logs_target (target_type, target_id),
    KEY ix_audit_logs_action (action),
    KEY ix_audit_logs_created_at (created_at),
    CONSTRAINT fk_audit_logs_actor_user
        FOREIGN KEY (actor_user_id)
        REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
