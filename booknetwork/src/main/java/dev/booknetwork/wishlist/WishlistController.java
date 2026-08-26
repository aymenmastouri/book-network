package dev.booknetwork.wishlist;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.booknetwork.catalog.BookMapper;
import dev.booknetwork.catalog.BookRepository;
import dev.booknetwork.common.BusinessRuleException;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.common.PageResponse;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Add, remove and list "want to read" bookmarks. The list reuses the catalog's
 * stats query, so wishlist cards carry the same facts as every other shelf.
 */
@RestController
@Tag(name = "wishlist")
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final BookRepository bookRepository;
    private final UserService userService;

    public WishlistController(WishlistRepository wishlistRepository,
                              BookRepository bookRepository,
                              UserService userService) {
        this.wishlistRepository = wishlistRepository;
        this.bookRepository = bookRepository;
        this.userService = userService;
    }

    @PostMapping("books/{id}/wishlist")
    @Transactional
    public void add(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.resolve(jwt);
        var book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Book " + id + " does not exist"));
        if (book.isOwnedBy(user.getId())) {
            throw new BusinessRuleException("own_book", "Your own books need no wishlist");
        }
        if (wishlistRepository.findByUserIdAndBookId(user.getId(), id).isEmpty()) {
            wishlistRepository.save(new Wishlist(user.getId(), id));
        }
    }

    @DeleteMapping("books/{id}/wishlist")
    @Transactional
    public void remove(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.resolve(jwt);
        wishlistRepository.findByUserIdAndBookId(user.getId(), id)
                .ifPresent(wishlistRepository::delete);
    }

    @GetMapping("wishlist")
    @Transactional(readOnly = true)
    public PageResponse<BookResponse> list(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "12") int size,
                                           @AuthenticationPrincipal Jwt jwt) {
        User user = userService.resolve(jwt);
        return PageResponse.of(
                bookRepository.wishlistOf(user.getId(), PageRequest.of(page, size)),
                s -> BookMapper.toResponse(s, user.getId()));
    }
}
