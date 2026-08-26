package dev.booknetwork.catalog;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Every list ships its cross-module facts (average rating, live-loan flag) in
 * the same query via scalar subselects. Only the JPQL text knows the Feedback
 * and Loan entities — the Java code of this package does not import them, so
 * the module graph stays acyclic and the page renders without N+1 queries.
 */
public interface BookRepository extends JpaRepository<Book, Long> {

    String STATS = """
            select b as book,
                   (select avg(f.rating) from Feedback f where f.bookId = b.id) as rating,
                   (select count(l) > 0 from Loan l where l.bookId = b.id and l.approvedAt is null) as borrowed
            """;

    interface BookWithStats {
        Book getBook();
        Double getRating();
        Boolean getBorrowed();
    }

    @Query(value = STATS + """
            from Book b
            where b.shareable = true and b.archived = false and b.owner.id <> :userId
            order by b.createdAt desc
            """,
            countQuery = """
                    select count(b) from Book b
                    where b.shareable = true and b.archived = false and b.owner.id <> :userId
                    """)
    Page<BookWithStats> browse(@Param("userId") UUID userId, Pageable pageable);

    @Query(value = STATS + """
            from Book b
            where b.owner.id = :userId
            order by b.createdAt desc
            """,
            countQuery = "select count(b) from Book b where b.owner.id = :userId")
    Page<BookWithStats> mine(@Param("userId") UUID userId, Pageable pageable);

    @Query(STATS + " from Book b where b.id = :id")
    Optional<BookWithStats> findWithStats(@Param("id") Long id);
}
