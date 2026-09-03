package dev.booknetwork.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.lending.Loan;
import dev.booknetwork.lending.LoanRepository;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserRepository;

/**
 * The shared STATS projection derives borrowCount from every Loan row of a book,
 * so returned and currently active loans are both counted. Runs against the real
 * PostgreSQL schema the Flyway migrations create; each test rolls back.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BookRepositoryBorrowCountTest {

    private static final UUID OWNER = UUID.fromString("55555555-0000-4000-8000-000000000001");
    private static final UUID BORROWER = UUID.fromString("55555555-0000-4000-8000-000000000002");
    private static final UUID VIEWER = UUID.fromString("55555555-0000-4000-8000-000000000003");

    @Autowired
    private BookRepository bookRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private LoanRepository loanRepository;

    private Book borrowedBook;
    private Book quietBook;

    @BeforeEach
    void setUp() {
        User owner = userRepository
                .save(new User(OWNER, "owner@booknetwork.test", "Owner", "One"));
        userRepository.save(new User(BORROWER, "borrower@booknetwork.test", "Borrower", "One"));
        userRepository.save(new User(VIEWER, "viewer@booknetwork.test", "Viewer", "One"));

        borrowedBook = bookRepository
                .save(new Book(owner, "Borrowed Book", "Author A", "", "", Genre.OTHER, true));
        quietBook = bookRepository
                .save(new Book(owner, "Quiet Book", "Author B", "", "", Genre.OTHER, true));
    }

    private void closeLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        loan.markReturned();
        loan.markApproved();
        loanRepository.save(loan);
        // Commit boundary: in the app the approval and the next loan are separate
        // transactions, so the "at most one live loan per book" index only sees the
        // approval once it is applied.
        loanRepository.flush();
    }

    @Test
    void borrowCountIsZeroWhenTheBookHasNoLoans() {
        BookWithStats stats = bookRepository.findWithStats(quietBook.getId(), VIEWER).orElseThrow();

        assertThat(stats.getBorrowCount()).isZero();
    }

    @Test
    void borrowCountIncludesACurrentlyActiveLoan() {
        loanRepository.save(new Loan(borrowedBook.getId(), BORROWER));

        BookWithStats stats = bookRepository.findWithStats(borrowedBook.getId(), VIEWER).orElseThrow();

        assertThat(stats.getBorrowCount()).isEqualTo(1);
    }

    @Test
    void borrowCountIncludesAReturnedLoan() {
        Long loanId = loanRepository.save(new Loan(borrowedBook.getId(), BORROWER)).getId();
        closeLoan(loanId);

        BookWithStats stats = bookRepository.findWithStats(borrowedBook.getId(), VIEWER).orElseThrow();

        assertThat(stats.getBorrowCount()).isEqualTo(1);
    }

    @Test
    void borrowCountReflectsBothReturnedAndActiveLoans() {
        Long first = loanRepository.save(new Loan(borrowedBook.getId(), BORROWER)).getId();
        closeLoan(first);
        loanRepository.save(new Loan(borrowedBook.getId(), BORROWER));

        BookWithStats stats = bookRepository.findWithStats(borrowedBook.getId(), VIEWER).orElseThrow();

        assertThat(stats.getBorrowCount()).isEqualTo(2);
    }

    @Test
    void browseReturnsABorrowCountForEveryBook() {
        Long loanId = loanRepository.save(new Loan(borrowedBook.getId(), BORROWER)).getId();
        closeLoan(loanId);

        Page<BookWithStats> page = bookRepository
                .browseByNewest(VIEWER, "", null, PageRequest.of(0, 12));

        assertThat(page.getContent()).isNotEmpty();
        assertThat(page.getContent()).allSatisfy(stats -> assertThat(stats.getBorrowCount()).isNotNull());

        BookWithStats withLoan = page.getContent().stream()
                .filter(stats -> stats.getBook().getId().equals(borrowedBook.getId()))
                .findFirst().orElseThrow();
        BookWithStats withoutLoan = page.getContent().stream()
                .filter(stats -> stats.getBook().getId().equals(quietBook.getId()))
                .findFirst().orElseThrow();

        assertThat(withLoan.getBorrowCount()).isEqualTo(1);
        assertThat(withoutLoan.getBorrowCount()).isZero();
    }
}
