package dev.booknetwork.catalog.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class BookResponseTest {

    private BookResponse bookWithBorrowCount(long borrowCount) {
        return new BookResponse(
                1L,
                "The Silent Archive",
                "Jordan Blake",
                "978-1-56619-909-4",
                "A mystery set in a hidden library.",
                null,
                "owner-1",
                "Owner One",
                true,
                false,
                4.5,
                false,
                true,
                true,
                true,
                false,
                false,
                3L,
                borrowCount
        );
    }

    @Test
    void borrowCountAccessorReturnsSuppliedValue() {
        BookResponse response = bookWithBorrowCount(42L);

        assertEquals(42L, response.borrowCount());
    }

    @Test
    void borrowCountSupportsBoundaryValues() {
        long[] values = {
                0L,
                1L,
                -1L,
                Long.MIN_VALUE,
                Long.MAX_VALUE
        };

        for (long value : values) {
            BookResponse response = bookWithBorrowCount(value);

            assertEquals(value, response.borrowCount());
        }
    }

    @Test
    void borrowCountParticipatesInEqualityAndHashCode() {
        BookResponse first = bookWithBorrowCount(7L);
        BookResponse same = bookWithBorrowCount(7L);
        BookResponse different = bookWithBorrowCount(8L);

        assertEquals(first, same);
        assertEquals(first.hashCode(), same.hashCode());
        assertNotEquals(first, different);
        assertNotEquals(same, different);
    }

    @Test
    void borrowCountIsAccessibleWithNullOptionalFields() {
        BookResponse response = new BookResponse(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                false,
                0.0,
                false,
                false,
                false,
                false,
                false,
                false,
                0L,
                12L
        );

        assertNotEquals(null, response);
        assertEquals(12L, response.borrowCount());
    }
}