package dev.booknetwork.catalog;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.booknetwork.catalog.dto.BookResponse;
import dev.booknetwork.common.NotFoundException;
import dev.booknetwork.common.PageResponse;
import dev.booknetwork.user.User;
import dev.booknetwork.user.UserRepository;
import dev.booknetwork.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;

/** A member's public shelf: who they are and what they currently share. */
@RestController
@RequestMapping("members")
@Tag(name = "members")
public class MemberShelfController {

    public record MemberResponse(String id, String fullName, OffsetDateTime memberSince, long sharedBooks) {}

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserService userService;

    public MemberShelfController(UserRepository userRepository,
                                 BookRepository bookRepository,
                                 UserService userService) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.userService = userService;
    }

    @GetMapping("{id}")
    public MemberResponse member(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        userService.resolve(jwt);
        User member = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member does not exist"));
        return new MemberResponse(
                member.getId().toString(),
                member.fullName(),
                member.getCreatedAt(),
                bookRepository.countByOwnerIdAndShareableTrueAndArchivedFalse(member.getId()));
    }

    @GetMapping("{id}/books")
    public PageResponse<BookResponse> books(@PathVariable UUID id,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "12") int size,
                                            @AuthenticationPrincipal Jwt jwt) {
        User viewer = userService.resolve(jwt);
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("Member does not exist");
        }
        return PageResponse.of(
                bookRepository.sharedBy(id, viewer.getId(), org.springframework.data.domain.PageRequest.of(page, size)),
                s -> BookMapper.toResponse(s, viewer.getId()));
    }
}
