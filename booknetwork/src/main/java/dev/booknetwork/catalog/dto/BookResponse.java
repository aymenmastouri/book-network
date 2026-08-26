package dev.booknetwork.catalog.dto;

import dev.booknetwork.catalog.Genre;

public record BookResponse(
        Long id,
        String title,
        String authorName,
        String isbn,
        String synopsis,
        Genre genre,
        String ownerId,
        String ownerName,
        boolean shareable,
        boolean archived,
        double rating,
        boolean borrowed,
        boolean mine,
        boolean hasCover,
        boolean wishlisted,
        boolean reservedByMe,
        long queueLength
) {}
