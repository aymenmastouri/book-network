package dev.booknetwork.reservation;

import java.util.List;
import java.util.Optional;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.booknetwork.catalog.Book;
import dev.booknetwork.catalog.BookRepository;
import dev.booknetwork.common.BusinessRuleException;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.lending.LoanRepository;
import dev.booknetwork.reservation.dto.ReservationResponse;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserService;

/**
 * The queue for borrowed books. Reserving only makes sense while someone else
 * holds the book — a free book is simply borrowed. Assignment on return is the
 * lending module's move; this service only answers "who is next" and records
 * fulfilment, so the dependency arrow points one way.
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;
    private final UserService userService;

    public ReservationService(ReservationRepository reservationRepository,
                              BookRepository bookRepository,
                              LoanRepository loanRepository,
                              UserService userService) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.loanRepository = loanRepository;
        this.userService = userService;
    }

    @Transactional
    public Long reserve(Long bookId, Jwt jwt) {
        User user = userService.resolve(jwt);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("Book " + bookId + " does not exist"));
        if (book.isOwnedBy(user.getId())) {
            throw new BusinessRuleException("own_book", "You cannot reserve your own book");
        }
        var activeLoan = loanRepository.findByBookIdAndApprovedAtIsNull(bookId)
                .orElseThrow(() -> new BusinessRuleException("book_available",
                        "This book is free — borrow it instead of reserving"));
        if (activeLoan.getBorrowerId().equals(user.getId())) {
            throw new BusinessRuleException("you_hold_it", "You are holding this book right now");
        }
        if (reservationRepository
                .findByBookIdAndUserIdAndFulfilledAtIsNullAndCanceledAtIsNull(bookId, user.getId())
                .isPresent()) {
            throw new BusinessRuleException("already_reserved", "You are already in the queue");
        }
        return reservationRepository.save(new Reservation(bookId, user.getId())).getId();
    }

    @Transactional
    public void cancel(Long bookId, Jwt jwt) {
        User user = userService.resolve(jwt);
        Reservation reservation = reservationRepository
                .findByBookIdAndUserIdAndFulfilledAtIsNullAndCanceledAtIsNull(bookId, user.getId())
                .orElseThrow(() -> new BusinessRuleException("no_reservation",
                        "You have no reservation on this book"));
        reservation.markCanceled();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> mine(Jwt jwt) {
        User user = userService.resolve(jwt);
        return reservationRepository.activeOf(user.getId()).stream()
                .map(row -> new ReservationResponse(
                        row.getReservation().getId(),
                        row.getBook().getId(),
                        row.getBook().getTitle(),
                        row.getBook().getAuthorName(),
                        row.getPosition() == null ? 1 : row.getPosition(),
                        row.getReservation().getCreatedAt()))
                .toList();
    }

    /** The next member in line, if anyone queues. Read-only; lending decides. */
    @Transactional(readOnly = true)
    public Optional<Reservation> nextInLine(Long bookId) {
        return reservationRepository
                .findFirstByBookIdAndFulfilledAtIsNullAndCanceledAtIsNullOrderByCreatedAtAsc(bookId);
    }

    @Transactional
    public void fulfill(Reservation reservation) {
        reservation.markFulfilled();
        reservationRepository.save(reservation);
    }
}
