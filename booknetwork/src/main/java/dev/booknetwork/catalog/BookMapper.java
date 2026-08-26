package dev.booknetwork.catalog;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookResponse;

/** The one place a Book plus its stats becomes an API shape. */
public final class BookMapper {

    private BookMapper() {
    }

    public static BookResponse toResponse(BookWithStats stats, UUID viewerId) {
        Book book = stats.getBook();
        double rating = stats.getRating() == null ? 0.0
                : BigDecimal.valueOf(stats.getRating()).setScale(1, RoundingMode.HALF_UP).doubleValue();
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthorName(),
                book.getIsbn(),
                book.getSynopsis(),
                book.getGenre(),
                book.getOwner().getId().toString(),
                book.getOwner().fullName(),
                book.isShareable(),
                book.isArchived(),
                rating,
                Boolean.TRUE.equals(stats.getBorrowed()),
                book.isOwnedBy(viewerId),
                book.getCoverPath() != null,
                Boolean.TRUE.equals(stats.getWishlisted()),
                Boolean.TRUE.equals(stats.getReservedByMe()),
                stats.getQueueLength() == null ? 0 : stats.getQueueLength()
        );
    }
}
