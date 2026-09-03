package dev.booknetwork.catalog.dto;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.booknetwork.catalog.Genre;

import java.lang.reflect.RecordComponent;

import org.junit.jupiter.api.Test;

class BookResponseTest {

    private static BookResponse response(long queueLength, long borrowCount) {
        return new BookResponse(
                100L,
                "Dune",
                "Frank Herbert",
                "978-0-441-17271-9",
                "An epic science fiction adventure",
                (Genre) null,
                "owner-1",
                "Owner One",
                true,
                false,
                4.7,
                false,
                true,
                false,
                true,
                false,
                false,
                queueLength,
                borrowCount
        );
    }

    @Test
    void borrowCountIsReturnedFromAccessor() {
        BookResponse actual = response(3L, 42L);

        assertEquals(42L, actual.borrowCount());
    }

    @Test
    void borrowCountBoundaryValuesArePreserved() {
        assertEquals(0L, response(0L, 0L).borrowCount());
        assertEquals(Long.MAX_VALUE, response(0L, Long.MAX_VALUE).borrowCount());
        assertEquals(Long.MIN_VALUE, response(0L, Long.MIN_VALUE).borrowCount());
    }

    @Test
    void borrowCountDistinguishesEqualObjects() {
        BookResponse first = response(5L, 10L);
        BookResponse second = response(5L, 10L);
        BookResponse different = response(5L, 11L);

        assertEquals(first, second);
        assertEquals(first.hashCode(), second.hashCode());
        assertNotEquals(first, different);
        assertNotEquals(first, null);
    }

    @Test
    void borrowCountAppearsInToString() {
        BookResponse actual = response(7L, 99L);

        assertTrue(actual.toString().contains("borrowCount=99"));
    }

    @Test
    void borrowCountComponentIsDeclaredAsLong() {
        boolean found = false;

        for (RecordComponent component : BookResponse.class.getRecordComponents()) {
            if ("borrowCount".equals(component.getName())) {
                found = true;
                assertEquals(long.class, component.getType());
                break;
            }
        }

        assertTrue(found);
    }

    @Test
    void borrowCountWorksWhenReferenceFieldsAreNull() {
        BookResponse actual = new BookResponse(
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
                1L
        );

        assertEquals(1L, actual.borrowCount());
        assertDoesNotThrow(actual::toString);
        assertNotEquals(actual, null);
        assertDoesNotThrow(() -> actual.equals(actual));
    }
}