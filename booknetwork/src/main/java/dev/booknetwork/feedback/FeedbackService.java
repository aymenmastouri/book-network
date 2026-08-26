package dev.booknetwork.feedback;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.booknetwork.catalog.Book;
import dev.booknetwork.catalog.BookRepository;
import dev.booknetwork.common.BusinessRuleException;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.common.PageResponse;
import dev.booknetwork.feedback.FeedbackRepository.FeedbackWithAuthor;
import dev.booknetwork.feedback.dto.FeedbackRequest;
import dev.booknetwork.feedback.dto.FeedbackResponse;
import dev.booknetwork.lending.LoanRepository;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserService;

/**
 * Feedback is earned, not free: only someone who actually borrowed the book at
 * some point may rate it, and owners cannot rate their own shelf.
 */
@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;
    private final UserService userService;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           BookRepository bookRepository,
                           LoanRepository loanRepository,
                           UserService userService) {
        this.feedbackRepository = feedbackRepository;
        this.bookRepository = bookRepository;
        this.loanRepository = loanRepository;
        this.userService = userService;
    }

    @Transactional
    public Long give(FeedbackRequest request, Jwt jwt) {
        User author = userService.resolve(jwt);
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new NotFoundException("Book " + request.bookId() + " does not exist"));
        if (book.isOwnedBy(author.getId())) {
            throw new BusinessRuleException("own_book", "You cannot rate your own book");
        }
        if (!loanRepository.existsByBookIdAndBorrowerId(book.getId(), author.getId())) {
            throw new BusinessRuleException("never_borrowed", "Rate only books you have borrowed");
        }
        Feedback feedback = new Feedback(book.getId(), author.getId(), request.rating(), request.commentOrEmpty());
        return feedbackRepository.save(feedback).getId();
    }

    @Transactional(readOnly = true)
    public PageResponse<FeedbackResponse> forBook(Long bookId, int page, int size, Jwt jwt) {
        User viewer = userService.resolve(jwt);
        return PageResponse.of(
                feedbackRepository.forBook(bookId, PageRequest.of(page, size)),
                row -> toResponse(row, viewer));
    }

    private static FeedbackResponse toResponse(FeedbackWithAuthor row, User viewer) {
        Feedback feedback = row.getFeedback();
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getRating(),
                feedback.getComment(),
                row.getAuthor().fullName(),
                feedback.getAuthorId().equals(viewer.getId()),
                feedback.getCreatedAt()
        );
    }
}
