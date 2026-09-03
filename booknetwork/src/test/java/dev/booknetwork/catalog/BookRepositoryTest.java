package dev.booknetwork.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

class BookRepositoryTest {

    private static final String STATS_START_FRAGMENT = "select b as book";
    private static final String BORROW_COUNT_FRAGMENT =
            "select count(l) from Loan l where l.bookId = b.id) as borrowCount";

    @Test
    void statsProjectionIncludesBorrowCount() {
        String normalized = normalize(BookRepository.STATS);

        assertTrue(normalized.contains(BORROW_COUNT_FRAGMENT),
                "STATS should include the borrowCount scalar subselect, but was: " + normalized);
    }

    @Test
    void everyStatBasedQueryIncludesBorrowCount() throws Exception {
        List<String> missing = new ArrayList<>();
        int statQueries = 0;

        for (Method method : BookRepository.class.getDeclaredMethods()) {
            Query query = method.getAnnotation(Query.class);
            if (query == null) {
                continue;
            }

            String normalized = normalize(joinQueryValues(query));
            if (!normalized.contains(STATS_START_FRAGMENT)) {
                continue;
            }

            statQueries++;
            if (!normalized.contains(BORROW_COUNT_FRAGMENT)) {
                missing.add(method.getName());
            }
        }

        assertTrue(statQueries > 0, "Expected at least one query built from STATS.");
        assertTrue(missing.isEmpty(), "Queries missing borrowCount projection: " + missing);
    }

    @Test
    void bookWithStatsExposesBorrowCount() throws NoSuchMethodException {
        Method getter = BookRepository.BookWithStats.class.getMethod("getBorrowCount");

        assertNotNull(getter);
        assertEquals(Long.class, getter.getReturnType());
        assertEquals(0, getter.getParameterCount());
        assertTrue(Modifier.isPublic(getter.getModifiers()));
    }

    private static String joinQueryValues(Annotation query) throws Exception {
        Method valueMethod = query.annotationType().getMethod("value");
        Object value = valueMethod.invoke(query);

        if (value instanceof String[]) {
            return String.join("\n", (String[]) value);
        }
        if (value instanceof String) {
            return (String) value;
        }
        return String.valueOf(value);
    }

    private static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("\\s+", " ").trim();
    }
}