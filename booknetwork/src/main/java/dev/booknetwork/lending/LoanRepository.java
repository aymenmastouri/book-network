package dev.booknetwork.lending;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.booknetwork.catalog.Book;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    interface LoanWithBook {
        Loan getLoan();
        Book getBook();
    }

    Optional<Loan> findByBookIdAndApprovedAtIsNull(Long bookId);

    boolean existsByBookIdAndBorrowerId(Long bookId, UUID borrowerId);

    @Query(value = """
            select l as loan, b as book
            from Loan l, Book b
            where b.id = l.bookId and l.borrowerId = :userId
            order by l.borrowedAt desc
            """,
            countQuery = "select count(l) from Loan l where l.borrowerId = :userId")
    Page<LoanWithBook> borrowedBy(@Param("userId") UUID userId, Pageable pageable);

    @Query(value = """
            select l as loan, b as book
            from Loan l, Book b
            where b.id = l.bookId and b.owner.id = :ownerId and l.returnedAt is not null
            order by l.returnedAt desc
            """,
            countQuery = """
                    select count(l) from Loan l, Book b
                    where b.id = l.bookId and b.owner.id = :ownerId and l.returnedAt is not null
                    """)
    Page<LoanWithBook> returnedToOwner(@Param("ownerId") UUID ownerId, Pageable pageable);
}
