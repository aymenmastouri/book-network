package dev.booknetwork.catalog;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Every list ships its cross-module facts — average rating, live-loan flag,
 * the viewer's wishlist and reservation state, and the queue length — in the
 * same statement via scalar subselects. Only the JPQL text knows the Feedback,
 * Loan, Reservation and Wishlist entities; the Java code of this package does
 * not import them, so the module graph stays acyclic and pages render without
 * N+1 queries.
 */
public interface BookRepository extends JpaRepository<Book, Long> {

    String STATS = """
            select b as book,
                   (select avg(f.rating) from Feedback f where f.bookId = b.id) as rating,
                   (select count(l) > 0 from Loan l where l.bookId = b.id and l.approvedAt is null) as borrowed,
                   (select count(l) > 0 from Loan l where l.bookId = b.id and l.approvedAt is null
                        and l.borrowerId = :userId) as borrowedByMe,
                   (select count(w) > 0 from Wishlist w where w.bookId = b.id and w.userId = :userId) as wishlisted,
                   (select count(r) > 0 from Reservation r where r.bookId = b.id and r.userId = :userId
                        and r.fulfilledAt is null and r.canceledAt is null) as reservedByMe,
                   (select count(r) from Reservation r where r.bookId = b.id
                        and r.fulfilledAt is null and r.canceledAt is null) as queueLength,
                   (select count(l) from Loan l where l.bookId = b.id) as borrowCount
            """;

    String BROWSE_WHERE = """
            from Book b
            where b.shareable = true and b.archived = false and b.owner.id <> :userId
              and (:q = '' or lower(b.title) like concat('%', :q, '%')
                           or lower(b.authorName) like concat('%', :q, '%'))
              and (:genre is null or b.genre = :genre)
            """;

    interface BookWithStats {
        Book getBook();
        Double getRating();
        Boolean getBorrowed();
        Boolean getBorrowedByMe();
        Boolean getWishlisted();
        Boolean getReservedByMe();
        Long getQueueLength();
        Long getBorrowCount();
    }

    @Query(value = STATS + BROWSE_WHERE + " order by b.createdAt desc",
            countQuery = "select count(b) " + BROWSE_WHERE)
    Page<BookWithStats> browseByNewest(@Param("userId") UUID userId,
                                       @Param("q") String q,
                                       @Param("genre") Genre genre,
                                       Pageable pageable);

    @Query(value = STATS + BROWSE_WHERE + """
             order by coalesce((select avg(f.rating) from Feedback f where f.bookId = b.id), 0) desc,
                      b.createdAt desc
            """,
            countQuery = "select count(b) " + BROWSE_WHERE)
    Page<BookWithStats> browseByRating(@Param("userId") UUID userId,
                                       @Param("q") String q,
                                       @Param("genre") Genre genre,
                                       Pageable pageable);

    @Query(value = STATS + """
            from Book b
            where b.owner.id = :userId
            order by b.createdAt desc
            """,
            countQuery = "select count(b) from Book b where b.owner.id = :userId")
    Page<BookWithStats> mine(@Param("userId") UUID userId, Pageable pageable);

    @Query(value = STATS + """
            from Book b
            where b.owner.id = :ownerId and b.shareable = true and b.archived = false
            order by b.createdAt desc
            """,
            countQuery = """
                    select count(b) from Book b
                    where b.owner.id = :ownerId and b.shareable = true and b.archived = false
                    """)
    Page<BookWithStats> sharedBy(@Param("ownerId") UUID ownerId,
                                 @Param("userId") UUID userId,
                                 Pageable pageable);

    @Query(value = STATS + """
            from Book b
            where exists (select 1 from Wishlist w2 where w2.bookId = b.id and w2.userId = :userId)
            order by (select max(w3.createdAt) from Wishlist w3
                      where w3.bookId = b.id and w3.userId = :userId) desc
            """,
            countQuery = """
                    select count(b) from Book b
                    where exists (select 1 from Wishlist w2 where w2.bookId = b.id and w2.userId = :userId)
                    """)
    Page<BookWithStats> wishlistOf(@Param("userId") UUID userId, Pageable pageable);

    @Query(STATS + " from Book b where b.id = :id")
    Optional<BookWithStats> findWithStats(@Param("id") Long id, @Param("userId") UUID userId);

    long countByOwnerIdAndShareableTrueAndArchivedFalse(UUID ownerId);
}
