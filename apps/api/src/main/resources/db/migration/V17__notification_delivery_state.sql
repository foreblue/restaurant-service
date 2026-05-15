ALTER TABLE notifications
    ADD COLUMN scheduled_at TIMESTAMP(6) NULL AFTER payload,
    ADD COLUMN sent_at TIMESTAMP(6) NULL AFTER scheduled_at,
    ADD COLUMN attempt_count INT NOT NULL DEFAULT 0 AFTER sent_at,
    ADD COLUMN next_retry_at TIMESTAMP(6) NULL AFTER attempt_count,
    ADD COLUMN provider_key VARCHAR(80) NULL AFTER next_retry_at,
    ADD COLUMN provider_message_id VARCHAR(128) NULL AFTER provider_key,
    ADD KEY ix_notifications_scheduled_status (status, scheduled_at),
    ADD KEY ix_notifications_next_retry (status, next_retry_at);
