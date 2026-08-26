package dev.booknetwork.catalog;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import dev.booknetwork.catalog.dto.BookRequest;
import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.common.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("books")
@Tag(name = "books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping
    public Long create(@Valid @org.springframework.web.bind.annotation.RequestBody BookRequest request,
                       @AuthenticationPrincipal Jwt jwt) {
        return bookService.create(request, jwt);
    }

    @GetMapping
    public PageResponse<BookResponse> browse(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "12") int size,
                                             @AuthenticationPrincipal Jwt jwt) {
        return bookService.browse(page, size, jwt);
    }

    @GetMapping("mine")
    public PageResponse<BookResponse> mine(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "12") int size,
                                           @AuthenticationPrincipal Jwt jwt) {
        return bookService.mine(page, size, jwt);
    }

    @GetMapping("{id}")
    public BookResponse get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return bookService.get(id, jwt);
    }

    @PutMapping("{id}")
    public void update(@PathVariable Long id,
                       @Valid @org.springframework.web.bind.annotation.RequestBody BookRequest request,
                       @AuthenticationPrincipal Jwt jwt) {
        bookService.update(id, request, jwt);
    }

    @PatchMapping("{id}/shareable")
    public boolean toggleShareable(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return bookService.toggleShareable(id, jwt);
    }

    @PatchMapping("{id}/archived")
    public boolean toggleArchived(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return bookService.toggleArchived(id, jwt);
    }

    @PostMapping(value = "{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void uploadCover(@PathVariable Long id,
                            @RequestPart("file") MultipartFile file,
                            @AuthenticationPrincipal Jwt jwt) {
        bookService.uploadCover(id, file, jwt);
    }

    @GetMapping("{id}/cover")
    public ResponseEntity<byte[]> cover(@PathVariable Long id) {
        BookService.CoverImage image = bookService.cover(id);
        return ResponseEntity.ok()
                .header("Content-Type", image.contentType())
                .header("Cache-Control", "max-age=300")
                .body(image.bytes());
    }
}
