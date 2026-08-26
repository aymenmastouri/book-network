package dev.booknetwork.reservation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.booknetwork.catalog.Book;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    interface ReservationWithBook {
        Reservation getReservation();
        Book getBook();
        Long getPosition();
    }

    Optional<Reservation> findFirstByBookIdAndFulfilledAtIsNullAndCanceledAtIsNullOrderByCreatedAtAsc(Long bookId);

    Optional<Reservation> findByBookIdAndUserIdAndFulfilledAtIsNullAndCanceledAtIsNull(Long bookId, UUID userId);

    @Query("""
            select r as reservation, b as book,
                   (select count(r2) + 1 from Reservation r2
                    where r2.bookId = r.bookId and r2.fulfilledAt is null and r2.canceledAt is null
                      and r2.createdAt < r.createdAt) as position
            from Reservation r, Book b
            where b.id = r.bookId
              and r.userId = :userId and r.fulfilledAt is null and r.canceledAt is null
            order by r.createdAt desc
            """)
    List<ReservationWithBook> activeOf(@Param("userId") UUID userId);
}
