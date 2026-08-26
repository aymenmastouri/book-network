package dev.booknetwork.catalog;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import dev.booknetwork.catalog.BookRepository.BookWithStats;
import dev.booknetwork.catalog.dto.BookRequest;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.common.BusinessRuleException;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.common.PageResponse;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserService;

@Service
public class BookService {

    /** Browse sort orders the API accepts. */
    public enum Sort { NEWEST, RATING }

    private final BookRepository bookRepository;
    private final UserService userService;
    private final CoverStorage coverStorage;

    public BookService(BookRepository bookRepository, UserService userService, CoverStorage coverStorage) {
        this.bookRepository = bookRepository;
        this.userService = userService;
        this.coverStorage = coverStorage;
    }

    @Transactional
    public Long create(BookRequest request, Jwt jwt) {
        User owner = userService.resolve(jwt);
        Book book = new Book(owner, request.title().trim(), request.authorName().trim(),
                request.isbnOrEmpty().trim(), request.synopsisOrEmpty().trim(),
                request.genreOrOther(), request.shareable());
        return bookRepository.save(book).getId();
    }

    @Transactional(readOnly = true)
    public PageResponse<BookResponse> browse(int page, int size, String q, Genre genre, Sort sort, Jwt jwt) {
        User user = userService.resolve(jwt);
        Pageable pageable = PageRequest.of(page, size);
        String query = q == null ? "" : q.trim().toLowerCase();
        Page<BookWithStats> result = sort == Sort.RATING
                ? bookRepository.browseByRating(user.getId(), query, genre, pageable)
                : bookRepository.browseByNewest(user.getId(), query, genre, pageable);
        return PageResponse.of(result, s -> BookMapper.toResponse(s, user.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<BookResponse> mine(int page, int size, Jwt jwt) {
        User user = userService.resolve(jwt);
        return PageResponse.of(
                bookRepository.mine(user.getId(), PageRequest.of(page, size)),
                s -> BookMapper.toResponse(s, user.getId()));
    }

    @Transactional(readOnly = true)
    public BookResponse get(Long id, Jwt jwt) {
        User user = userService.resolve(jwt);
        BookWithStats stats = bookRepository.findWithStats(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Book " + id + " does not exist"));
        Book book = stats.getBook();
        if (book.isArchived() && !book.isOwnedBy(user.getId())) {
            throw new NotFoundException("Book " + id + " does not exist");
        }
        return BookMapper.toResponse(stats, user.getId());
    }

    @Transactional
    public void update(Long id, BookRequest request, Jwt jwt) {
        Book book = ownedBook(id, jwt);
        book.setTitle(request.title().trim());
        book.setAuthorName(request.authorName().trim());
        book.setIsbn(request.isbnOrEmpty().trim());
        book.setSynopsis(request.synopsisOrEmpty().trim());
        book.setGenre(request.genreOrOther());
        book.setShareable(request.shareable());
    }

    @Transactional
    public boolean toggleShareable(Long id, Jwt jwt) {
        Book book = ownedBook(id, jwt);
        book.setShareable(!book.isShareable());
        return book.isShareable();
    }

    @Transactional
    public boolean toggleArchived(Long id, Jwt jwt) {
        Book book = ownedBook(id, jwt);
        book.setArchived(!book.isArchived());
        return book.isArchived();
    }

    @Transactional
    public void uploadCover(Long id, MultipartFile file, Jwt jwt) {
        Book book = ownedBook(id, jwt);
        book.setCoverPath(coverStorage.store(file));
    }

    @Transactional(readOnly = true)
    public CoverImage cover(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Book " + id + " does not exist"));
        String path = book.getCoverPath();
        if (path == null) {
            throw new NotFoundException("Book " + id + " has no cover");
        }
        byte[] bytes = coverStorage.load(path)
                .orElseThrow(() -> new NotFoundException("Book " + id + " has no cover"));
        return new CoverImage(bytes, coverStorage.contentTypeFor(path));
    }

    public record CoverImage(byte[] bytes, String contentType) {}

    private Book ownedBook(Long id, Jwt jwt) {
        User user = userService.resolve(jwt);
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Book " + id + " does not exist"));
        if (!book.isOwnedBy(user.getId())) {
            throw new BusinessRuleException("not_owner", "Only the owner can change this book");
        }
        return book;
    }
}
