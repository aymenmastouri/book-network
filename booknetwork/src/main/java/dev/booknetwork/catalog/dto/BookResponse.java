package dev.booknetwork.catalog.dto;

public record BookResponse(
        Long id,
        String title,
        String authorName,
        String isbn,
        String synopsis,
        String ownerName,
        boolean shareable,
        boolean archived,
        double rating,
        boolean borrowed,
        boolean mine,
        boolean hasCover
) {}
