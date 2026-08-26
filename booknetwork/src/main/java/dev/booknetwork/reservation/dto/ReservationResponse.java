package dev.booknetwork.reservation.dto;

import java.time.OffsetDateTime;

public record ReservationResponse(
        Long id,
        Long bookId,
        String title,
        String authorName,
        long position,
        OffsetDateTime createdAt
) {}
