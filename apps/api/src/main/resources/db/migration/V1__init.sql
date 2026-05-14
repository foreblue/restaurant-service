-- Initial database foundation. Domain tables are added by later backend issues.
CREATE TABLE app_schema_metadata (
    id BIGINT NOT NULL AUTO_INCREMENT,
    metadata_key VARCHAR(100) NOT NULL,
    metadata_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_app_schema_metadata_key (metadata_key)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO app_schema_metadata (metadata_key, metadata_value)
VALUES ('schema_version', '1');
