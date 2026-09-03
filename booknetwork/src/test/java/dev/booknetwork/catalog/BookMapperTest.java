package dev.booknetwork.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.user.User;

/** Exercises {@link BookMapper#toResponse} borrowCount handling against real entities. */
class BookMapperTest {

    @Test
    void handlesMissingBorrowCountByDefaultingToZero() {
        BookResponse response = responseWithBorrowCount(null);
        assertEquals(0L, borrowCountOf(response));
    }

    @Test
    void mapsProvidedBorrowCount() {
        BookResponse response = responseWithBorrowCount(17L);
        assertEquals(17L, borrowCountOf(response));
    }

    @Test
    void mapsBoundaryBorrowCountValues() {
        assertEquals(0L, borrowCountOf(responseWithBorrowCount(0L)));
        assertEquals((long) Integer.MAX_VALUE, borrowCountOf(responseWithBorrowCount((long) Integer.MAX_VALUE)));
    }

    private static BookResponse responseWithBorrowCount(Long borrowCount) {
        return BookMapper.toResponse(statsWithBorrowCount(borrowCount), UUID.randomUUID());
    }

    private static BookWithStats statsWithBorrowCount(Long borrowCount) {
        Book book = new Book(
                new User(UUID.randomUUID(), "owner@example.com", "Owner", "One"),
                "Book title",
                "Author",
                "ISBN",
                "Synopsis",
                Genre.OTHER,
                false);

        return new BookWithStats() {
            @Override
            public Book getBook() {
                return book;
            }

            @Override
            public Double getRating() {
                return null;
            }

            @Override
            public Boolean getBorrowed() {
                return null;
            }

            @Override
            public Boolean getBorrowedByMe() {
                return null;
            }

            @Override
            public Boolean getWishlisted() {
                return null;
            }

            @Override
            public Boolean getReservedByMe() {
                return null;
            }

            @Override
            public Long getQueueLength() {
                return 3L;
            }

            @Override
            public Long getBorrowCount() {
                return borrowCount;
            }
        };
    }

    private static long borrowCountOf(BookResponse response) {
        return response.borrowCount();
    }
}
