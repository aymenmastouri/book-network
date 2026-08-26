package dev.booknetwork.lending.dto;

import java.time.OffsetDateTime;

public record LoanResponse(
        Long id,
        Long bookId,
        String title,
        String authorName,
        String isbn,
        OffsetDateTime borrowedAt,
        OffsetDateTime dueAt,
        OffsetDateTime returnedAt,
        boolean returned,
        boolean approved,
        boolean overdue,
        boolean hasCover
) {}
