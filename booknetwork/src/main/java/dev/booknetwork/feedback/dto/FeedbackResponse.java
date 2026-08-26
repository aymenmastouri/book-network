package dev.booknetwork.feedback.dto;

import java.time.OffsetDateTime;

public record FeedbackResponse(
        Long id,
        int rating,
        String comment,
        String authorName,
        boolean mine,
        OffsetDateTime createdAt
) {}
