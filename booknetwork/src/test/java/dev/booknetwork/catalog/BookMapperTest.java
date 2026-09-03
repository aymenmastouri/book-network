package dev.booknetwork.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.user.User;

class BookMapperTest {

    private static final UUID VIEWER_ID = UUID.randomUUID();

    @Test
    void borrowCountNullIsMappedToZero() {
        BookResponse response = BookMapper.toResponse(createStats(book(VIEWER_ID), 3L, null), VIEWER_ID);

        assertEquals(0, readBorrowCount(response));
    }

    @Test
    void borrowCountNonNullIsPassedThrough() {
        BookResponse response = BookMapper.toResponse(createStats(book(VIEWER_ID), 3L, 42L), VIEWER_ID);

        assertEquals(42, readBorrowCount(response));
    }

    @Test
    void borrowCountBoundaryValuesArePassedThrough() {
        Book book = book(VIEWER_ID);
        assertEquals(0, readBorrowCount(BookMapper.toResponse(createStats(book, 3L, 0L), VIEWER_ID)));
        assertEquals(
                Integer.MAX_VALUE,
                readBorrowCount(BookMapper.toResponse(createStats(book, 3L, (long) Integer.MAX_VALUE), VIEWER_ID))
        );
    }

    private static Book book(UUID ownerId) {
        User owner = new User(ownerId, "owner@example.com", "Test", "Owner");
        return new Book(owner, "Book", "Author", "ISBN-1", "Synopsis", Genre.OTHER, true);
    }

    private static BookWithStats createStats(Book book, Long queueLength, Long borrowCount) {
        return new BookWithStats() {
            @Override
            public Book getBook() {
                return book;
            }

            @Override
            public Double getRating() {
                return 1.0;
            }

            @Override
            public Boolean getBorrowed() {
                return false;
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
                return queueLength;
            }

            @Override
            public Long getBorrowCount() {
                return borrowCount;
            }
        };
    }

    private static int readBorrowCount(BookResponse response) {
        try {
            Method getter = BookResponse.class.getMethod("getBorrowCount");
            return toInt(getter.invoke(response));
        } catch (NoSuchMethodException ignored) {
            // Try record-style accessor next.
        } catch (ReflectiveOperationException ex) {
            throw new AssertionError("Unable to read borrowCount via getBorrowCount", ex);
        }

        try {
            Method accessor = BookResponse.class.getMethod("borrowCount");
            return toInt(accessor.invoke(response));
        } catch (NoSuchMethodException ignored) {
            // Fall back to field access.
        } catch (ReflectiveOperationException ex) {
            throw new AssertionError("Unable to read borrowCount via borrowCount accessor", ex);
        }

        try {
            Field field = findField(BookResponse.class, "borrowCount");
            field.setAccessible(true);
            return toInt(field.get(response));
        } catch (Exception ex) {
            throw new AssertionError("Unable to read borrowCount from BookResponse", ex);
        }
    }

    private static Field findField(Class<?> type, String name) throws NoSuchFieldException {
        Class<?> current = type;
        while (current != null) {
            try {
                return current.getDeclaredField(name);
            } catch (NoSuchFieldException ex) {
                current = current.getSuperclass();
            }
        }
        throw new NoSuchFieldException(name);
    }

    private static int toInt(Object value) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        throw new AssertionError("Unexpected borrowCount value: " + value);
    }
}
