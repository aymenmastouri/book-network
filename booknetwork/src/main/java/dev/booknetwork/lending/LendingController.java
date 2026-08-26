package dev.booknetwork.lending;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.booknetwork.common.PageResponse;
import dev.booknetwork.lending.dto.LoanResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "lending")
public class LendingController {

    private final LendingService lendingService;

    public LendingController(LendingService lendingService) {
        this.lendingService = lendingService;
    }

    @PostMapping("books/{id}/borrow")
    public Long borrow(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return lendingService.borrow(id, jwt);
    }

    @PostMapping("books/{id}/return")
    public void giveBack(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        lendingService.giveBack(id, jwt);
    }

    @PostMapping("books/{id}/return/approve")
    public void approveReturn(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        lendingService.approveReturn(id, jwt);
    }

    @GetMapping("loans/borrowed")
    public PageResponse<LoanResponse> borrowed(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "12") int size,
                                               @AuthenticationPrincipal Jwt jwt) {
        return lendingService.borrowed(page, size, jwt);
    }

    @GetMapping("loans/returned")
    public PageResponse<LoanResponse> returnedToMe(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "12") int size,
                                                   @AuthenticationPrincipal Jwt jwt) {
        return lendingService.returnedToMe(page, size, jwt);
    }
}
