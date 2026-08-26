package dev.booknetwork.lending;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.booknetwork.catalog.Book;
import dev.booknetwork.catalog.BookRepository;
import dev.booknetwork.common.BusinessRuleException;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.common.PageResponse;
import dev.booknetwork.lending.LoanRepository.LoanWithBook;
import dev.booknetwork.lending.dto.LoanResponse;
import dev.booknetwork.notify.MailNotifier;
import dev.booknetwork.reservation.ReservationService;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserRepository;
import dev.booknetwork.user.UserService;

/**
 * The lending rules, in one place: you cannot borrow your own book, an
 * archived or unshared book, or a book someone else is holding; only the
 * borrower can return; only the owner can approve the return. Approval frees
 * the book — unless someone queues, in which case the book is lent straight
 * to the first reservation and its holder is told by mail.
 */
@Service
public class LendingService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ReservationService reservationService;
    private final MailNotifier mailNotifier;

    public LendingService(LoanRepository loanRepository,
                          BookRepository bookRepository,
                          UserRepository userRepository,
                          UserService userService,
                          ReservationService reservationService,
                          MailNotifier mailNotifier) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.reservationService = reservationService;
        this.mailNotifier = mailNotifier;
    }

    @Transactional
    public Long borrow(Long bookId, Jwt jwt) {
        User borrower = userService.resolve(jwt);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("Book " + bookId + " does not exist"));
        if (book.isOwnedBy(borrower.getId())) {
            throw new BusinessRuleException("own_book", "You cannot borrow your own book");
        }
        if (!book.isShareable() || book.isArchived()) {
            throw new BusinessRuleException("not_shareable", "This book is not available for borrowing");
        }
        if (loanRepository.findByBookIdAndApprovedAtIsNull(bookId).isPresent()) {
            throw new BusinessRuleException("already_borrowed", "This book is currently borrowed");
        }
        Loan loan = loanRepository.save(new Loan(bookId, borrower.getId()));
        mailNotifier.borrowed(book.getOwner().getEmail(), book.getTitle(), borrower.fullName());
        return loan.getId();
    }

    @Transactional
    public void giveBack(Long bookId, Jwt jwt) {
        User borrower = userService.resolve(jwt);
        Loan loan = loanRepository.findByBookIdAndApprovedAtIsNull(bookId)
                .filter(l -> l.getBorrowerId().equals(borrower.getId()))
                .orElseThrow(() -> new BusinessRuleException("not_borrowed_by_you",
                        "You have no open loan on this book"));
        if (loan.isReturned()) {
            throw new BusinessRuleException("already_returned", "You already returned this book");
        }
        loan.markReturned();
        Book book = bookRepository.findById(bookId).orElseThrow();
        mailNotifier.returned(book.getOwner().getEmail(), book.getTitle(), borrower.fullName());
    }

    @Transactional
    public void approveReturn(Long bookId, Jwt jwt) {
        User owner = userService.resolve(jwt);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("Book " + bookId + " does not exist"));
        if (!book.isOwnedBy(owner.getId())) {
            throw new BusinessRuleException("not_owner", "Only the owner can approve a return");
        }
        Loan loan = loanRepository.findByBookIdAndApprovedAtIsNull(bookId)
                .orElseThrow(() -> new BusinessRuleException("no_open_loan", "This book has no open loan"));
        if (!loan.isReturned()) {
            throw new BusinessRuleException("not_returned_yet", "The borrower has not returned this book yet");
        }
        loan.markApproved();
        // The partial unique index allows one live loan per book. The approval
        // UPDATE must reach the database before the next loan's INSERT, and
        // Hibernate flushes inserts first — so flush explicitly in between.
        loanRepository.flush();
        userRepository.findById(loan.getBorrowerId())
                .ifPresent(borrower -> mailNotifier.returnApproved(borrower.getEmail(), book.getTitle()));
        reservationService.nextInLine(bookId).ifPresent(next -> {
            loanRepository.save(new Loan(bookId, next.getUserId()));
            reservationService.fulfill(next);
            userRepository.findById(next.getUserId())
                    .ifPresent(reserver -> mailNotifier.reservationFulfilled(reserver.getEmail(), book.getTitle()));
        });
    }

    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> borrowed(int page, int size, Jwt jwt) {
        User user = userService.resolve(jwt);
        return PageResponse.of(
                loanRepository.borrowedBy(user.getId(), PageRequest.of(page, size)),
                LendingService::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> returnedToMe(int page, int size, Jwt jwt) {
        User user = userService.resolve(jwt);
        return PageResponse.of(
                loanRepository.returnedToOwner(user.getId(), PageRequest.of(page, size)),
                LendingService::toResponse);
    }

    private static LoanResponse toResponse(LoanWithBook row) {
        Loan loan = row.getLoan();
        Book book = row.getBook();
        return new LoanResponse(
                loan.getId(),
                book.getId(),
                book.getTitle(),
                book.getAuthorName(),
                book.getIsbn(),
                loan.getBorrowedAt(),
                loan.getDueAt(),
                loan.getReturnedAt(),
                loan.isReturned(),
                loan.isApproved(),
                loan.isOverdue(),
                book.getCoverPath() != null
        );
    }
}
