package dev.booknetwork.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

class BookRepositoryTest {

    private static final String BORROW_COUNT_SUBSELECT =
            "(select count(l) from Loan l where l.bookId = b.id) as borrowCount";

    @Test
    void statsContainsNewBorrowCountColumn() {
        String stats = BookRepository.STATS;

        assertNotNull(stats);
        assertFalse(stats.isBlank());
        assertTrue(stats.contains(BORROW_COUNT_SUBSELECT));
    }

    @Test
    void statsAppendsBorrowCountAfterQueueLength() {
        String stats = BookRepository.STATS;

        int queueLength = stats.indexOf("as queueLength");
        int borrowCount = stats.indexOf("as borrowCount");

        assertTrue(queueLength >= 0, "queueLength should remain in STATS");
        assertTrue(borrowCount > queueLength, "borrowCount should be added after queueLength");
    }

    @Test
    void statsContainsBorrowCountAliasOnlyOnce() {
        assertEquals(1, countOccurrences(BookRepository.STATS, "as borrowCount"));
    }

    @Test
    void borrowCountCountsAllLoansForBook() {
        String stats = BookRepository.STATS;

        int start = stats.indexOf("select count(l) from Loan l where l.bookId = b.id) as borrowCount");
        assertTrue(start >= 0, "borrowCount clause should be present");

        int end = stats.indexOf('\n', start);
        String clause = end < 0 ? stats.substring(start) : stats.substring(start, end);

        assertTrue(clause.startsWith("select count(l) from Loan l where l.bookId = b.id) as borrowCount"));
        assertFalse(clause.contains("approvedAt"));
        assertFalse(clause.contains("canceledAt"));
        assertFalse(clause.contains("borrowerId"));
    }

    @Test
    void projectionContractExposesBorrowCountGetter() throws Exception {
        Method getter = BookRepository.BookWithStats.class.getMethod("getBorrowCount");

        assertEquals(Long.class, getter.getReturnType());
        assertEquals(0, getter.getParameterCount());
        assertTrue(Modifier.isPublic(getter.getModifiers()));
    }

    @Test
    void allStatBackedQueriesExposeBorrowCount() throws Exception {
        Method[] methods = BookRepository.class.getDeclaredMethods();
        assertTrue(methods.length > 0);

        for (Method method : methods) {
            Query query = method.getAnnotation(Query.class);
            if (query == null) {
                continue;
            }

            assertTrue(query.value().contains(BORROW_COUNT_SUBSELECT),
                    method.getName() + " must include the borrowCount scalar subselect");
        }
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int index = haystack.indexOf(needle);

        while (index >= 0) {
            count++;
            index = haystack.indexOf(needle, index + needle.length());
        }

        return count;
    }
}