package dev.booknetwork.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.user.User;

/**
 * Unit coverage for the borrow-count field added to the shared read path: the
 * mapper must expose the Loan total through {@link BookResponse#borrowCount()}
 * and never surface an empty value for a book that was never borrowed.
 */
class BookMapperTest {

    private static final UUID OWNER_ID = UUID.randomUUID();
    private static final UUID VIEWER_ID = UUID.randomUUID();

    private final Book book = new Book(
            new User(OWNER_ID, "owner@example.com", "O", "Owner"),
            "Dune", "Frank Herbert", "9780441172719", "On the planet Arrakis.",
            Genre.FANTASY, true);

    private BookWithStats stats(Long borrowCount) {
        return new BookWithStats() {
            @Override
            public Book getBook() {
                return book;
            }

            @Override
            public Double getRating() {
                return 4.5;
            }

            @Override
            public Boolean getBorrowed() {
                return true;
            }

            @Override
            public Boolean getBorrowedByMe() {
                return false;
            }

            @Override
            public Boolean getWishlisted() {
                return false;
            }

            @Override
            public Boolean getReservedByMe() {
                return false;
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

    @Test
    void exposesTotalLoanCountAsBorrowCount() {
        BookResponse response = BookMapper.toResponse(stats(4L), VIEWER_ID);

        assertThat(response.borrowCount()).isEqualTo(4L);
    }

    @Test
    void keepsBorrowCountAtZeroForNeverBorrowedBook() {
        BookResponse response = BookMapper.toResponse(stats(0L), VIEWER_ID);

        assertThat(response.borrowCount()).isEqualTo(0L);
    }

    @Test
    void mapsNullBorrowCountToZero() {
        BookResponse response = BookMapper.toResponse(stats(null), VIEWER_ID);

        assertThat(response.borrowCount()).isEqualTo(0L);
    }
}
